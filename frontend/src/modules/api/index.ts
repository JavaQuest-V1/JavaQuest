/**
 * Camada de integração REST com o backend Java Spring Boot (RNF-02 / RNF-03).
 */
export { apiClient, ApiClient, ApiError, novaChaveIdempotencia } from "./httpClient";
export { getSupabase, isSupabaseConfigurado, obterTokenSupabase } from "./supabaseClient";
export * from "./mapeadores";
export type {
  ApiClientConfig,
  ConnectionStatus,
  HttpMethod,
  RequestOptions,
} from "./httpClient";
export { API_ROUTES } from "./endpoints";
