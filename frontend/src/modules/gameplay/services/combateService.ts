import {
  DesafioAndar,
  ProgressoJogadorDTO,
  ResultadoTurnoDTO,
  TipoArmamento,
} from "../types/gameplay";
import { API_ROUTES } from "@api/endpoints";
import { gameplayApiClient } from "./apiClient";
import { sandboxMockEngine } from "./sandboxMockEngine";

export interface IniciarSessaoGameplayPayload {
  email: string;
  apelido: string;
  andarInicial: number;
  checkpointInicial: number;
  armamentoInicial: TipoArmamento;
  xpInicial: number;
  streakInicial: number;
  forceReset?: boolean;
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
}

export interface SubmeterTurnoResponse {
  resultado: ResultadoTurnoDTO;
  progresso: ProgressoJogadorDTO;
}

/**
 * Camada @services (RNF-02) conectada diretamente às classes Java
 * `CombateService` e `ValidacaoJavaService` via HTTP REST, com fallback
 * automático para o motor Sandbox local caso o servidor Java esteja parado.
 */
export const combateService = {
  async inicializarSessao(
    payload: IniciarSessaoGameplayPayload
  ): Promise<ProgressoJogadorDTO> {
    if (gameplayApiClient.isApiMode()) {
      try {
        return await gameplayApiClient.requestJson<ProgressoJogadorDTO>(
          API_ROUTES.jogador.carregarProgresso(payload.email)
        );
      } catch {
        return sandboxMockEngine.initSession(payload);
      }
    }
    return sandboxMockEngine.initSession(payload);
  },

  async iniciarAndar(
    email: string,
    numeroAndar: number,
    evitarVariacaoAnterior = true
  ): Promise<IniciarAndarResponse> {
    if (gameplayApiClient.isApiMode()) {
      try {
        return await gameplayApiClient.requestJson<IniciarAndarResponse>(
          API_ROUTES.combate.iniciarAndar(numeroAndar),
          {
            method: "POST",
            body: { email, evitarVariacaoAnterior },
          }
        );
      } catch {
        return sandboxMockEngine.sortearDesafioDoAndar(
          email,
          numeroAndar,
          evitarVariacaoAnterior
        );
      }
    }
    return sandboxMockEngine.sortearDesafioDoAndar(
      email,
      numeroAndar,
      evitarVariacaoAnterior
    );
  },

  async submeterTurno(
    payload: SubmeterTurnoPayload
  ): Promise<SubmeterTurnoResponse> {
    if (gameplayApiClient.isApiMode()) {
      try {
        return await gameplayApiClient.requestJson<
          SubmeterTurnoResponse,
          SubmeterTurnoPayload
        >(API_ROUTES.combate.submeterCodigo(), {
          method: "POST",
          body: payload,
        });
      } catch {
        return sandboxMockEngine.processarTurno(
          payload.email,
          payload.blocosMontados
        );
      }
    }
    return sandboxMockEngine.processarTurno(payload.email, payload.blocosMontados);
  },
};
