import {
  DesafioAndar,
  ProgressoJogadorDTO,
  ResultadoTurnoDTO,
  TipoArmamento,
} from "../types/gameplay";
import { API_ROUTES } from "@api/endpoints";
import { novaChaveIdempotencia } from "@api/httpClient";
import {
  AberturaAndarArenaSupabase,
  RequisicaoSubmissaoBlocos,
  ResultadoSubmissaoArenaSupabase,
} from "@api/backendTypes";
import { trilhaCiclosApi } from "@api/trilhaCiclosApi";
import { cicloDoAndar, andarCheckpointDoCiclo } from "@api/mapeadores";
import { gameplayApiClient } from "./apiClient";
import { sandboxMockEngine } from "./sandboxMockEngine";
import { sessaoCombateBackend } from "./sessaoCombateBackend";

export interface IniciarSessaoGameplayPayload {
  email: string;
  apelido: string;
  andarInicial: number;
  checkpointInicial: number;
  armamentoInicial: TipoArmamento;
  xpInicial: number;
  streakInicial: number;
  forceReset?: boolean;
  /** Treino Livre: só existe no front (vidas infinitas), roda no motor Sandbox. */
  modoTreino?: boolean;
}

export interface IniciarAndarResponse {
  desafio: DesafioAndar;
  progresso: ProgressoJogadorDTO;
}

export interface SubmeterTurnoPayload {
  email: string;
  desafioId: string;
  numeroAndar: number;
  blocosMontados: string[];
  codigoJava: string;
  /** Ids dos blocos na ordem escolhida (o backend recebe bloco por lacuna). */
  blocosIds?: string[];
  /** XP do andar (front-only até o backend ter XP). */
  xpRecompensa?: number;
}

export interface SubmeterTurnoResponse {
  resultado: ResultadoTurnoDTO;
  progresso: ProgressoJogadorDTO;
}

/**
 * Garante uma run aberta no backend para o ciclo do andar pedido:
 * reaproveita a run PREPARING/ACTIVE existente ou prepara uma nova
 * (3 vidas / 3 dicas) com a arma escolhida.
 */
async function garantirRunAberta(numeroAndar: number): Promise<string> {
  const estado = sessaoCombateBackend.estado;
  if (estado.runId) return estado.runId;

  const aberta = await trilhaCiclosApi.obterTentativaAtual();
  if (aberta) {
    sessaoCombateBackend.aplicarRunAberta(aberta);
    return aberta.identificadorTentativaCiclo;
  }

  const preparada = await trilhaCiclosApi.prepararTentativa(
    cicloDoAndar(numeroAndar),
    estado.armamento
  );
  sessaoCombateBackend.aplicarRunPreparada(preparada);
  return preparada.identificadorTentativaCiclo;
}

/**
 * Camada @services (RNF-02) do combate, conectada ao `CombateController` e ao
 * `TrilhaCiclosController` do Spring Boot. Com a API configurada o backend é a
 * fonte da verdade (sem fallback silencioso: erros sobem para a tela). Sem API
 * (ou no Treino Livre) usa o motor Sandbox local.
 */
export const combateService = {
  async inicializarSessao(payload: IniciarSessaoGameplayPayload): Promise<ProgressoJogadorDTO> {
    sessaoCombateBackend.configurar({
      email: payload.email,
      apelido: payload.apelido,
      armamento: payload.armamentoInicial,
      xpTotal: payload.xpInicial,
      streakDias: payload.streakInicial,
      andarInicial: payload.andarInicial,
      checkpointInicial: payload.checkpointInicial,
      modoTreino: Boolean(payload.modoTreino),
    });

    if (sessaoCombateBackend.usarSandbox()) {
      return sandboxMockEngine.initSession(payload);
    }

    const aberta = await trilhaCiclosApi.obterTentativaAtual();
    if (aberta) {
      sessaoCombateBackend.aplicarRunAberta(aberta);
    } else {
      // Nova run sempre começa no checkpoint do ciclo (1, 11, 21...)
      sessaoCombateBackend.estado.andarAtual = andarCheckpointDoCiclo(
        cicloDoAndar(payload.andarInicial)
      );
    }
    return sessaoCombateBackend.progresso();
  },

  async iniciarAndar(
    email: string,
    numeroAndar: number,
    evitarVariacaoAnterior = true
  ): Promise<IniciarAndarResponse> {
    if (sessaoCombateBackend.usarSandbox()) {
      return sandboxMockEngine.sortearDesafioDoAndar(email, numeroAndar, evitarVariacaoAnterior);
    }

    // O backend decide o andar (andar atual da run) e sorteia a variante (RF-20 / RF-21)
    const runId = await garantirRunAberta(numeroAndar);
    const abertura = await gameplayApiClient.requestJson<AberturaAndarArenaSupabase>(
      API_ROUTES.combate.iniciarAndar(runId),
      { method: "POST", headers: { "Idempotency-Key": novaChaveIdempotencia() } }
    );
    const desafio = sessaoCombateBackend.aplicarAbertura(abertura);
    return { desafio, progresso: sessaoCombateBackend.progresso() };
  },

  async submeterTurno(payload: SubmeterTurnoPayload): Promise<SubmeterTurnoResponse> {
    if (sessaoCombateBackend.usarSandbox()) {
      return sandboxMockEngine.processarTurno(payload.email, payload.blocosMontados);
    }

    const attemptId = sessaoCombateBackend.estado.attemptId;
    if (!attemptId) {
      throw new Error("Nenhum andar ativo no servidor. Volte e inicie o andar novamente.");
    }

    const blocosEscolhidosPorLacuna = sessaoCombateBackend.montarEscolhasPorLacuna(
      payload.blocosIds ?? []
    );
    // Mesma chave nas novas tentativas de rede: a submissão é idempotente no backend
    const res = await gameplayApiClient.requestJson<
      ResultadoSubmissaoArenaSupabase,
      RequisicaoSubmissaoBlocos
    >(API_ROUTES.combate.submeterBlocos(attemptId), {
      method: "POST",
      body: { blocosEscolhidosPorLacuna },
      headers: { "Idempotency-Key": novaChaveIdempotencia() },
    });

    const resultado = sessaoCombateBackend.aplicarSubmissao(res, payload.xpRecompensa ?? 0);
    return { resultado, progresso: sessaoCombateBackend.progresso() };
  },
};
