import { API_ROUTES } from "@api/endpoints";
import { apiClient, novaChaveIdempotencia } from "@api/httpClient";
import {
  PerfilCompletoJogador,
  RequisicaoOnboardingJogador,
  ResultadoTrocaArmamentoCiclo,
} from "@api/backendTypes";
import { trilhaCiclosApi } from "@api/trilhaCiclosApi";
import { TipoArmamento } from "@gameplay/types/gameplay";

/**
 * @service — espelha o `JogadorController` do Spring Boot
 * (RF-02, RF-03, RF-04, RF-07) e a troca de arma do `TrilhaCiclosController`
 * (RF-08). Só HTTP; regras de tela no `useJogadorController`.
 */
export const jogadorService = {
  async obterPerfil(): Promise<PerfilCompletoJogador> {
    return apiClient.requestJson<PerfilCompletoJogador>(API_ROUTES.jogador.obterPerfil());
  },

  async registrarOnboarding(payload: RequisicaoOnboardingJogador): Promise<PerfilCompletoJogador> {
    return apiClient.requestJson<PerfilCompletoJogador, RequisicaoOnboardingJogador>(
      API_ROUTES.jogador.registrarOnboarding(),
      {
        method: "POST",
        body: payload,
        headers: { "Idempotency-Key": novaChaveIdempotencia() },
        retries: 0,
      }
    );
  },

  async atualizarApelido(novoApelidoHeroi: string): Promise<PerfilCompletoJogador> {
    return apiClient.requestJson<PerfilCompletoJogador>(API_ROUTES.jogador.atualizarApelido(), {
      method: "PATCH",
      body: { novoApelidoHeroi },
    });
  },

  /** RF-08: só troca no backend se houver run em PREPARING; ACTIVE -> 409. */
  async trocarArmamento(arma: TipoArmamento): Promise<ResultadoTrocaArmamentoCiclo | null> {
    return trilhaCiclosApi.trocarArmamentoForaDeCombate(arma);
  },
};
