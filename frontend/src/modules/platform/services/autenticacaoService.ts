import { API_ROUTES } from "@api/endpoints";
import { apiClient } from "@api/httpClient";
import {
  EntrarComGoogleRequest,
  EntrarComGoogleResponse,
  SairRequest,
} from "../types/api";

/**
 * @service — espelha o `AutenticacaoController` do Spring Boot (RF-01, RF-05, RNF-10).
 * Só faz HTTP e trata o payload. Estado de tela e navegação ficam no
 * `useAutenticacaoController`.
 */
export const autenticacaoService = {
  /** Troca a credencial Google por um JWT assinado pelo backend e já guarda o token. */
  async entrarComGoogle(payload: EntrarComGoogleRequest): Promise<EntrarComGoogleResponse> {
    const res = await apiClient.requestJson<EntrarComGoogleResponse, EntrarComGoogleRequest>(
      API_ROUTES.autenticacao.entrarComGoogle(),
      { method: "POST", body: payload, auth: false }
    );
    if (res?.tokenJwt) apiClient.setAuthToken(res.tokenJwt);
    return res ?? {};
  },

  /** Invalida o JWT no backend e descarta o token local (mesmo se o servidor falhar). */
  async sair(): Promise<void> {
    const tokenJwt = apiClient.getAuthToken();
    try {
      if (tokenJwt) {
        await apiClient.requestJson<void, SairRequest>(API_ROUTES.autenticacao.sair(), {
          method: "POST",
          body: { tokenJwt },
          retries: 0,
        });
      }
    } finally {
      apiClient.clearAuthToken();
    }
  },
};
