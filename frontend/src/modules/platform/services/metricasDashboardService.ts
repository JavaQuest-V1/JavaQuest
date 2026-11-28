import { API_ROUTES } from "@api/endpoints";
import { apiClient } from "@api/httpClient";
import { RegistroHistoricoCicloBanco, ResumoDashboardJogador } from "@api/backendTypes";
import { RankingResponse } from "../types/api";

/**
 * @service — espelha o `MetricasController` do Spring Boot (RF-22, RF-23, RF-24).
 * O registro de tempo durante o combate fica no `metricasService` do módulo
 * de gameplay; aqui ficam as leituras usadas pela plataforma.
 */
export const metricasDashboardService = {
  async obterDashboard(): Promise<ResumoDashboardJogador> {
    return apiClient.requestJson<ResumoDashboardJogador>(API_ROUTES.metricas.obterDashboard(), {
      retries: 0,
    });
  },

  async listarHistoricoCiclos(): Promise<RegistroHistoricoCicloBanco[]> {
    const rows = await apiClient.requestJson<RegistroHistoricoCicloBanco[]>(
      API_ROUTES.metricas.historicoCiclos(),
      { retries: 0 }
    );
    return Array.isArray(rows) ? rows : [];
  },

  /**
   * PRÓXIMA ATUALIZAÇÃO NO BACK: o backend ainda não tem rota de ranking
   * (nem XP). Por enquanto o ranking mostra só o jogador atual, com o XP local.
   */
  async listarRanking(): Promise<RankingResponse> {
    return [];
  },
};
