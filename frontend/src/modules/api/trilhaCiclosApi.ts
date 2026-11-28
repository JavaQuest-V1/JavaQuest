import { API_ROUTES } from "./endpoints";
import { ApiError, apiClient, novaChaveIdempotencia } from "./httpClient";
import {
  EstadoTentativaCicloAtual,
  RequisicaoPreparacaoCiclo,
  ResultadoPreparacaoCiclo,
  ResultadoTrocaArmamentoCiclo,
} from "./backendTypes";
import { ArmamentoTela, armamentoParaBackend } from "./mapeadores";

/**
 * Chamadas HTTP do `TrilhaCiclosController` (RF-08 a RF-12), compartilhadas
 * pela plataforma (troca de arma no perfil) e pelo gameplay (abrir runs).
 */
export const trilhaCiclosApi = {
  /** Run aberta (PREPARING/ACTIVE) ou `null` quando o backend responde 204. */
  async obterTentativaAtual(): Promise<EstadoTentativaCicloAtual | null> {
    const res = await apiClient.requestJson<EstadoTentativaCicloAtual | undefined>(
      API_ROUTES.trilha.tentativaAtual()
    );
    return res ?? null;
  },

  async prepararTentativa(numeroCiclo: number, arma: ArmamentoTela): Promise<ResultadoPreparacaoCiclo> {
    return apiClient.requestJson<ResultadoPreparacaoCiclo, RequisicaoPreparacaoCiclo>(
      API_ROUTES.trilha.prepararTentativa(),
      {
        method: "POST",
        body: { numeroCiclo, tipoArmamento: armamentoParaBackend(arma) },
        headers: { "Idempotency-Key": novaChaveIdempotencia() },
        retries: 0,
      }
    );
  },

  async trocarArmamento(runId: string, arma: ArmamentoTela): Promise<ResultadoTrocaArmamentoCiclo> {
    return apiClient.requestJson<ResultadoTrocaArmamentoCiclo>(API_ROUTES.trilha.trocarArmamento(runId), {
      method: "PATCH",
      body: { novoTipoArmamento: armamentoParaBackend(arma) },
      headers: { "Idempotency-Key": novaChaveIdempotencia() },
      retries: 0,
    });
  },

  async abandonar(runId: string): Promise<void> {
    await apiClient.requestJson<unknown>(API_ROUTES.trilha.abandonar(runId), {
      method: "POST",
      headers: { "Idempotency-Key": novaChaveIdempotencia() },
      retries: 0,
    });
  },

  /**
   * RF-08: troca de arma. Só é aceita pelo backend com a run em PREPARING.
   * - run PREPARING -> PATCH no backend;
   * - run ACTIVE    -> recusada (409), igual à regra do backend;
   * - sem run       -> `null`: a arma vale para a próxima run que for preparada.
   */
  async trocarArmamentoForaDeCombate(arma: ArmamentoTela): Promise<ResultadoTrocaArmamentoCiclo | null> {
    const atual = await trilhaCiclosApi.obterTentativaAtual();
    if (!atual) return null;
    if (atual.statusTentativaCiclo === "PREPARING" && atual.podeTrocarArmamentoAgora) {
      return trilhaCiclosApi.trocarArmamento(atual.identificadorTentativaCiclo, arma);
    }
    throw new ApiError(
      "A arma só pode ser trocada antes de iniciar o primeiro andar do ciclo.",
      409
    );
  },
};
