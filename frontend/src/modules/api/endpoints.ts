/**
 * Mapa único das rotas REST consumidas pelo front Next.js (RNF-03 / RNF-26).
 *
 * Cada grupo corresponde a um @RestController do backend Java Spring Boot,
 * seguindo o diagrama de classes (AutenticacaoController, JogadorController,
 * CombateController e MetricasController).
 *
 * As rotas são as mesmas já expostas pelo `JavaQuestApiServer` atual. Quando o
 * backend Spring Boot for implementado, basta manter estes caminhos (ou alterar
 * apenas este arquivo). O contrato completo está em `API_CONTRATO.md`.
 */

const enc = (value: string | number) => encodeURIComponent(String(value));

export const API_ROUTES = {
  /** AutenticacaoController — RF-01, RF-05, RNF-10 */
  autenticacao: {
    /** POST — troca o ID Token do Google (ou e-mail/nome no modo local) por um JWT */
    entrarComGoogle: () => "/api/auth/google",
    /** POST — invalida o JWT da sessão atual */
    sair: () => "/api/auth/logout",
  },

  /** JogadorController — RF-02, RF-03, RF-04, RF-07, RF-08, RF-22 */
  jogador: {
    /** POST — grava apelido, nível, canal de aquisição e armamento inicial */
    registrarOnboarding: () => "/api/jogador/onboarding",
    /** PATCH — troca controlada de armamento fora de combate */
    trocarArmamento: () => "/api/jogador/armamento",
    /** GET — carrega o progresso salvo (andar, checkpoint, vidas, dicas, arma) */
    carregarProgresso: (email: string) => `/api/gameplay/sessao/${enc(email)}`,
  },

  /** CombateController — RF-11, RF-13, RF-14, RF-17, RF-18, RF-20, RF-21 */
  combate: {
    /** POST — sorteia a variação do desafio do andar (anti-memorização) */
    iniciarAndar: (numeroAndar: number) => `/api/combate/andares/${enc(numeroAndar)}/iniciar`,
    /** POST — envia o código Java montado e recebe o resultado do turno */
    submeterCodigo: () => "/api/combate/turno",
    /** POST — libera uma dica pedagógica (máx. 3 por ciclo) */
    solicitarDica: () => "/api/vidas-dicas/dica",
    /** POST — reinicia o ciclo no último checkpoint após a derrota */
    retornarAoCheckpoint: () => "/api/checkpoints/retomar",
  },

  /** MetricasController — RF-22, RF-23, RF-24 */
  metricas: {
    /** GET — dashboard do jogador (ainda não existe no backend; o front usa os dados locais) */
    obterDashboard: (email: string) => `/api/metricas/dashboard/${enc(email)}`,
    /** POST — cronômetro de sessão e tempo no andar */
    registrarTempo: () => "/api/metricas/tempo",
    /** POST — consolida o ciclo de 10 andares no histórico */
    registrarCiclo: () => "/api/metricas/ciclo",
    /** GET — ranking semanal da divisão */
    ranking: () => "/api/ranking",
  },

  /** GET — verificação de saúde do backend */
  health: () => "/api/health",
} as const;
