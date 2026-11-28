import { API_ROUTES } from "@api/endpoints";
import { ApiError } from "@api/httpClient";
import { sessaoEstudo } from "@api/sessaoEstudo";
import {
  RequisicaoEventoTempoEstudo,
  ResultadoAberturaSessaoEstudo,
} from "@api/backendTypes";
import { gameplayApiClient } from "./apiClient";
import { sandboxMockEngine } from "./sandboxMockEngine";
import { sessaoCombateBackend } from "./sessaoCombateBackend";

export interface TempoSessaoPayload {
  email: string;
  segundosSessaoDelta: number;
  segundosNoAndarAtual: number;
}

export interface ConclusaoCicloPayload {
  email: string;
  andarInicial: number;
  andarFinal: number;
  vidasGastas: number;
  dicasUsadas: number;
}

let ultimaSequencia = 0;

async function abrirSessaoEstudo(): Promise<string> {
  const res = await gameplayApiClient.requestJson<ResultadoAberturaSessaoEstudo>(
    API_ROUTES.metricas.abrirSessaoEstudo(),
    { method: "POST", retries: 0 }
  );
  sessaoEstudo.definir(res.identificadorSessaoEstudo);
  return res.identificadorSessaoEstudo;
}

async function enviarIntervalo(sessaoId: string, segundosAtivos: number): Promise<void> {
  const fim = new Date();
  const inicio = new Date(fim.getTime() - segundosAtivos * 1000);
  // Sequência crescente e única por sessão (o backend recusa sequência repetida)
  ultimaSequencia = Math.max(ultimaSequencia + 1, Math.floor(fim.getTime() / 1000));

  await gameplayApiClient.requestJson<void, RequisicaoEventoTempoEstudo>(
    API_ROUTES.metricas.registrarTempo(sessaoId),
    {
      method: "POST",
      body: {
        numeroSequenciaEvento: ultimaSequencia,
        identificadorTentativaAndar: sessaoCombateBackend.estado.attemptId ?? null,
        inicioIntervalo: inicio.toISOString(),
        fimIntervalo: fim.toISOString(),
        segundosAtivosNoIntervalo: segundosAtivos,
      },
      retries: 0,
    }
  );
}

/**
 * Camada @services (RNF-02) do cronômetro de estudo (RF-24), conectada ao
 * `MetricasController` (`/api/v1/sessoes-estudo/...`).
 */
export const metricasService = {
  async registrarTempoSessao(payload: TempoSessaoPayload): Promise<void> {
    if (!gameplayApiClient.isApiMode()) {
      sandboxMockEngine.registrarTempo(
        payload.email,
        payload.segundosSessaoDelta,
        payload.segundosNoAndarAtual
      );
      return;
    }
    if (payload.segundosSessaoDelta <= 0) return;

    const sessaoId = sessaoEstudo.obter() ?? (await abrirSessaoEstudo());
    try {
      await enviarIntervalo(sessaoId, payload.segundosSessaoDelta);
    } catch (err) {
      // Sessão expirada/encerrada no servidor: abre outra e reenvia uma vez
      if (err instanceof ApiError && (err.statusCode === 404 || err.statusCode === 409)) {
        const nova = await abrirSessaoEstudo();
        await enviarIntervalo(nova, payload.segundosSessaoDelta);
        return;
      }
      throw err;
    }
  },

  /**
   * O backend já consolida o ciclo no histórico a cada submissão
   * (`GET /api/v1/metricas/historico-ciclos`), então não há chamada aqui.
   */
  async registrarConclusaoCiclo(payload: ConclusaoCicloPayload): Promise<void> {
    void payload;
  },
};
