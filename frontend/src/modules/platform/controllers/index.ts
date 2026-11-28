/**
 * @controllers da UI da Plataforma (RNF-02).
 * Um controller por @RestController do backend Spring Boot.
 * O `useCombateController` (CombateController) fica no módulo de gameplay (RNF-04).
 */
export { PlayerAccountProvider, usePlayerAccount } from "./PlayerAccountContext";
export type { ActionResult } from "./PlayerAccountContext";
export { useAutenticacaoController } from "./useAutenticacaoController";
export { useJogadorController, APELIDO_MAX, APELIDO_MIN } from "./useJogadorController";
export type { DadosOnboarding } from "./useJogadorController";
export { useMetricasController } from "./useMetricasController";
export type { FonteDashboard } from "./useMetricasController";
