import { API_ROUTES } from "@api/endpoints";
import { apiClient } from "@api/httpClient";
import { ProgressoJogadorDTO } from "@gameplay/types/gameplay";
import { RegistrarOnboardingRequest, TrocarArmamentoRequest } from "../types/api";

/**
 * @service — espelha o `JogadorController` do Spring Boot
 * (RF-02, RF-03, RF-04, RF-07, RF-08). Só HTTP; regras de tela no
 * `useJogadorController`.
 */
export const jogadorService = {
  async registrarOnboarding(payload: RegistrarOnboardingRequest): Promise<void> {
    await apiClient.requestJson<void, RegistrarOnboardingRequest>(
      API_ROUTES.jogador.registrarOnboarding(),
      { method: "POST", body: payload }
    );
  },

  async trocarArmamento(payload: TrocarArmamentoRequest): Promise<ProgressoJogadorDTO | undefined> {
    return apiClient.requestJson<ProgressoJogadorDTO | undefined, TrocarArmamentoRequest>(
      API_ROUTES.jogador.trocarArmamento(),
      { method: "PATCH", body: payload }
    );
  },

  async carregarProgresso(email: string): Promise<ProgressoJogadorDTO> {
    return apiClient.requestJson<ProgressoJogadorDTO>(
      API_ROUTES.jogador.carregarProgresso(email)
    );
  },
};
