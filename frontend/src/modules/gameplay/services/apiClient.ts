/**
 * Compatibilidade do módulo de Gameplay (RNF-04):
 * o cliente HTTP agora é único para todo o front (`@api/httpClient`), assim a
 * arena e a plataforma compartilham o mesmo JWT e o mesmo status de conexão.
 */
export {
  ApiClient as GameplayApiClient,
  ApiError as GameplayApiError,
  apiClient as gameplayApiClient,
} from "@api/httpClient";
export type { ApiClientConfig } from "@api/httpClient";
