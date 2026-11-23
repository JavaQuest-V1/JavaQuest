import { API_ROUTES } from "@api/endpoints";
import { gameplayApiClient } from "./apiClient";
import { sandboxMockEngine } from "./sandboxMockEngine";

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

/**
 * Camada @services (RNF-02) para registro de cronômetro de sessão/andar
 * e conclusão de ciclo (RF-23, RF-24), espelhando `MetricasService.java`.
 */
export const metricasService = {
  async registrarTempoSessao(payload: TempoSessaoPayload): Promise<void> {
    if (gameplayApiClient.isApiMode()) {
      await gameplayApiClient.requestJson<void, TempoSessaoPayload>(
        API_ROUTES.metricas.registrarTempo(),
        {
          method: "POST",
          body: payload,
          retries: 0,
        }
      );
      return;
    }
    sandboxMockEngine.registrarTempo(
      payload.email,
      payload.segundosSessaoDelta,
      payload.segundosNoAndarAtual
    );
  },

  async registrarConclusaoCiclo(payload: ConclusaoCicloPayload): Promise<void> {
    if (gameplayApiClient.isApiMode()) {
      await gameplayApiClient.requestJson<void, ConclusaoCicloPayload>(
        API_ROUTES.metricas.registrarCiclo(),
        {
          method: "POST",
          body: payload,
        }
      );
    }
  },
};
