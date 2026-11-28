import {
  CategoriaErro,
  DicaPedagogica,
  ProgressoJogadorDTO,
} from "../types/gameplay";
import { API_ROUTES } from "@api/endpoints";
import { gameplayApiClient } from "./apiClient";
import { sandboxMockEngine } from "./sandboxMockEngine";

export interface SolicitarDicaResponse {
  dica: DicaPedagogica;
  progresso: ProgressoJogadorDTO;
}

/**
 * Camada @services (RNF-02) conectada diretamente a `VidasDicasService.java`,
 * com fallback transparente caso o servidor Java não esteja rodando.
 */
export const vidasDicasService = {
  async solicitarDica(
    email: string,
    numeroAndar: number,
    categoriaErro: CategoriaErro
  ): Promise<SolicitarDicaResponse> {
    if (gameplayApiClient.isApiMode()) {
      try {
        return await gameplayApiClient.requestJson<SolicitarDicaResponse>(
          API_ROUTES.combate.solicitarDica(),
          {
            method: "POST",
            body: { email, numeroAndar, categoriaErro },
          }
        );
      } catch {
        return sandboxMockEngine.solicitarDica(email, categoriaErro);
      }
    }
    return sandboxMockEngine.solicitarDica(email, categoriaErro);
  },
};
