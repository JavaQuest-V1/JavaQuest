import { API_ROUTES } from "@api/endpoints";
import { apiClient } from "@api/httpClient";
import { DashboardJogadorDTO, RankingResponse } from "../types/api";

/**
 * @service — espelha o `MetricasController` do Spring Boot (RF-22, RF-23, RF-24).
 * O registro de tempo/ciclo durante o combate fica no `metricasService` do
 * módulo de gameplay; aqui ficam as leituras usadas pela plataforma.
 */
export const metricasDashboardService = {
  async obterDashboard(email: string): Promise<DashboardJogadorDTO> {
    return apiClient.requestJson<DashboardJogadorDTO>(
      API_ROUTES.metricas.obterDashboard(email),
      { retries: 0 }
    );
  },

  async listarRanking(): Promise<RankingResponse> {
    const rows = await apiClient.requestJson<RankingResponse>(API_ROUTES.metricas.ranking(), {
      retries: 0,
    });
    return Array.isArray(rows) ? rows : [];
  },
};
