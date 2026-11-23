import { ApiError, apiClient } from "./httpClient";

/**
 * Resultado padronizado de uma chamada ao backend, usado pelos @controllers.
 * - `ok: true, data`        -> o servidor respondeu com sucesso.
 * - `ok: true, offline`     -> modo Sandbox (sem API configurada) ou servidor fora do ar;
 *                              o front segue com o estado local.
 * - `ok: false, erro`       -> o servidor recusou (4xx): regra de negócio do backend
 *                              (RNF-11). O controller mostra a mensagem e não aplica a ação.
 */
export type ApiOutcome<T> =
  | { ok: true; data: T; offline?: false }
  | { ok: true; data?: undefined; offline: true }
  | { ok: false; erro: string; status: number };

export async function callApi<T>(request: () => Promise<T>): Promise<ApiOutcome<T>> {
  if (!apiClient.isApiMode()) return { ok: true, offline: true };
  try {
    return { ok: true, data: await request() };
  } catch (err) {
    if (err instanceof ApiError && err.isClientError) {
      return { ok: false, erro: err.message, status: err.statusCode };
    }
    // Falha de rede / 5xx: mantém o jogo funcionando no modo Sandbox (RNF-21)
    return { ok: true, offline: true };
  }
}
