/**
 * Mapa único das rotas REST consumidas pelo front Next.js (RNF-03 / RNF-26).
 *
 * Cada grupo corresponde a um @RestController do backend Spring Boot
 * (`src/main/java/com/javaquest/controller`). Todas as rotas ficam sob
 * `/api/v1` e exigem `Authorization: Bearer <JWT do Supabase Auth>`, exceto
 * `GET /api/v1/saude`. O contrato completo está em `API_CONTRATO.md`.
 */

const enc = (value: string | number) => encodeURIComponent(String(value));

const V1 = "/api/v1";

export const API_ROUTES = {
  /** AutenticacaoController — RF-01, RF-05, RNF-10 */
  autenticacao: {
    /** POST — cria perfil no 1º acesso, abre sessão de estudo e diz se falta onboarding */
    sincronizarSessao: () => `${V1}/autenticacao/sessao`,
    /** POST — encerra a sessão de estudo ativa (o token é encerrado no Supabase) */
    sair: () => `${V1}/autenticacao/logout`,
  },

  /** JogadorController — RF-02, RF-03, RF-04, RF-07 */
  jogador: {
    /** GET — perfil completo do jogador logado */
    obterPerfil: () => `${V1}/jogadores/eu`,
    /** POST — grava apelido, nível, canal de aquisição e armamento inicial */
    registrarOnboarding: () => `${V1}/jogadores/eu/onboarding`,
    /** PATCH — altera o apelido do herói */
    atualizarApelido: () => `${V1}/jogadores/eu/apelido`,
    /** GET — catálogo de armas 2D */
    armamentos: () => `${V1}/catalogo/armamentos`,
    /** GET — aparência padrão 2D do herói */
    aparencia: () => `${V1}/catalogo/aparencia`,
  },

  /** TrilhaCiclosController — RF-08, RF-09, RF-10, RF-11, RF-12 */
  trilha: {
    /** GET — trilha de ciclos e andares com status de desbloqueio */
    listarCiclos: () => `${V1}/ciclos`,
    /** GET — run aberta (PREPARING/ACTIVE) ou 204 */
    tentativaAtual: () => `${V1}/tentativas-ciclo/atual`,
    /** POST — prepara nova run (3 vidas / 3 dicas) a partir do checkpoint do ciclo */
    prepararTentativa: () => `${V1}/tentativas-ciclo`,
    /** PATCH — troca de arma só enquanto a run está em PREPARING (RF-08) */
    trocarArmamento: (runId: string) => `${V1}/tentativas-ciclo/${enc(runId)}/armamento`,
    /** POST — abandona a run aberta */
    abandonar: (runId: string) => `${V1}/tentativas-ciclo/${enc(runId)}/abandonar`,
  },

  /** CombateController — RF-13, RF-14, RF-17, RF-18, RF-20, RF-21 */
  combate: {
    /** POST — abre o andar atual da run e sorteia a variante (anti-memorização) */
    iniciarAndar: (runId: string) => `${V1}/tentativas-ciclo/${enc(runId)}/andares/iniciar`,
    /** POST — envia os blocos escolhidos por lacuna (exige Idempotency-Key) */
    submeterBlocos: (attemptId: string) => `${V1}/tentativas-andar/${enc(attemptId)}/submissoes`,
    /** POST — libera a dica pedagógica de uma submissão incorreta (máx. 3 por ciclo) */
    solicitarDica: (submissionId: string) => `${V1}/submissoes/${enc(submissionId)}/dica`,
  },

  /** MetricasController — RF-22, RF-23, RF-24 */
  metricas: {
    /** GET — dashboard consolidado do jogador */
    obterDashboard: () => `${V1}/metricas/dashboard`,
    /** GET — histórico de runs */
    historicoCiclos: () => `${V1}/metricas/historico-ciclos`,
    /** POST — abre ou recupera a sessão única de estudo ativa */
    abrirSessaoEstudo: () => `${V1}/sessoes-estudo/abrir`,
    /** POST — registra intervalo de tempo ativo (idempotente por sequência) */
    registrarTempo: (sessaoId: string) => `${V1}/sessoes-estudo/${enc(sessaoId)}/eventos-tempo`,
    /** POST — encerra a sessão de estudo */
    encerrarSessaoEstudo: (sessaoId: string) => `${V1}/sessoes-estudo/${enc(sessaoId)}/encerrar`,
  },

  /** GET — verificação de saúde do backend (pública) */
  health: () => `${V1}/saude`,
} as const;
