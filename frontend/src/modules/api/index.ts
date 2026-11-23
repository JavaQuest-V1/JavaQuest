/**
 * Camada de integração REST com o backend Java Spring Boot (RNF-02 / RNF-03).
 */
export { apiClient, ApiClient, ApiError } from "./httpClient";
export type {
  ApiClientConfig,
  ConnectionStatus,
  HttpMethod,
  RequestOptions,
} from "./httpClient";
export { API_ROUTES } from "./endpoints";
