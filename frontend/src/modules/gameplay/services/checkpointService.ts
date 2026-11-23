import { ProgressoJogadorDTO, TipoArmamento } from "../types/gameplay";
import { API_ROUTES } from "@api/endpoints";
import { gameplayApiClient } from "./apiClient";
import { sandboxMockEngine } from "./sandboxMockEngine";

/**
 * Camada @services (RNF-02) conectada diretamente a `CheckpointService.java`
 * e `JogadorService.java`, com fallback automático para Sandbox local.
 */
export const checkpointService = {
  async retomarUltimoCheckpoint(email: string): Promise<ProgressoJogadorDTO> {
    if (gameplayApiClient.isApiMode()) {
      try {
        return await gameplayApiClient.requestJson<ProgressoJogadorDTO>(
          API_ROUTES.combate.retornarAoCheckpoint(),
          {
            method: "POST",
            body: { email },
          }
        );
      } catch {
        return sandboxMockEngine.retomarDoUltimoCheckpoint(email);
      }
    }
    return sandboxMockEngine.retomarDoUltimoCheckpoint(email);
  },

  async trocarArmamentoNoCheckpoint(
    email: string,
    armamento: TipoArmamento
  ): Promise<ProgressoJogadorDTO> {
    if (gameplayApiClient.isApiMode()) {
      try {
        return await gameplayApiClient.requestJson<ProgressoJogadorDTO>(
          API_ROUTES.jogador.trocarArmamento(),
          {
            method: "PATCH",
            body: { email, armamento },
          }
        );
      } catch {
        return sandboxMockEngine.trocarArmamento(email, armamento);
      }
    }
    return sandboxMockEngine.trocarArmamento(email, armamento);
  },
};
