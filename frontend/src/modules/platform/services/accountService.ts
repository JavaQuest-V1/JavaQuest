import { NivelExperiencia, TipoArmamento } from "@gameplay/types/gameplay";
import {
  CanalAquisicao,
  GrimoireTopicCard,
  PlayerAccountState,
} from "../types/platform";

const STORAGE_KEY = "javaquest_account_v3";

/**
 * Estado inicial limpo (RF-01):
 * todo jogador começa deslogado em /login, conclui o onboarding
 * e inicia no Andar 1 com 0 XP, 3 vidas e 3 dicas.
 */
export const DEFAULT_ACCOUNT_STATE: PlayerAccountState = {
  autenticado: false,
  onboardingConcluido: false,
  tutorialConcluido: false,
  email: "",
  nomeGoogle: "",
  apelido: "",
  nivelExperiencia: "INICIANTE",
  canalAquisicao: "INDICACAO",
  armamentoAtual: "ESPADA",
  andarAtual: 1,
  checkpointAtual: 1,
  andaresConcluidos: [],
  bausResgatados: [],
  vidasAtuais: 3,
  dicasAtuais: 3,
  xpTotal: 0,
  xpSemana: 0,
  xpHoje: 0,
  streakDias: 1,
  recordeStreakDias: 1,
  tempoEstudoMinutos: 0,
  melhorTempoBloco: "--:--",
  totalTentativas: 0,
  totalAcertos: 0,
  topicosEstudados: [],
  combatesSemErroHoje: 0,
  missoes: [
    { id: "m-xp", titulo: "Ganhe 50 XP em fases", atual: 0, meta: 50, cor: "emerald" },
    {
      id: "m-combo",
      titulo: "Complete 2 combates sem errar",
      atual: 0,
      meta: 2,
      cor: "gold",
    },
    {
      id: "m-dica",
      titulo: "Estude 1 tópico de Dicas Java",
      atual: 0,
      meta: 1,
      cor: "emerald",
    },
  ],
};

export const GRIMOIRE_TOPICS: GrimoireTopicCard[] = [
  {
    id: "ponto-virgula",
    categoria: "VARIAVEIS",
    titulo: "PONTO E VÍRGULA (;)",
    subtitulo: "TODA INSTRUÇÃO SIMPLES TERMINA COM PONTO E VÍRGULA.",
    certo: "int vida = 100;",
    erro: "int vida = 100",
    andarPratica: 1,
  },
  {
    id: "tipos-primitivos",
    categoria: "VARIAVEIS",
    titulo: "TIPOS PRIMITIVOS & STRING",
    subtitulo: "INT GUARDA INTEIROS, DOUBLE DECIMAIS E STRING TEXTOS.",
    certo: 'String heroi = "Java";',
    erro: "string heroi = 'Java';",
    andarPratica: 3,
  },
  {
    id: "decimais-double",
    categoria: "VARIAVEIS",
    titulo: "DECIMAIS COM DOUBLE (.)",
    subtitulo: "EM JAVA, NÚMEROS DECIMAIS USAM PONTO E NUNCA VÍRGULA.",
    certo: "double pi = 3.14;",
    erro: "double pi = 3,14;",
    andarPratica: 2,
  },
  {
    id: "operadores-console",
    categoria: "VARIAVEIS",
    titulo: "OPERADORES & CONSOLE",
    subtitulo: "COMBINE EXPRESSÕES E IMPRIMA SAÍDAS COM SYSTEM.OUT.PRINTLN.",
    certo: 'System.out.println("Java " + 10);',
    erro: 'System.print("Java " + 10)',
    andarPratica: 5,
  },
  {
    id: "atribuicao-igualdade",
    categoria: "CONDICIONAIS",
    titulo: "ATRIBUIÇÃO (=) VS IGUALDADE (==)",
    subtitulo: "UM SINAL DEFINE O VALOR; DOIS SINAIS COMPARAM VALORES.",
    certo: "if (hp == 0) { recuar(); }",
    erro: "if (hp = 0) { recuar(); }",
    andarPratica: 6,
  },
  {
    id: "blocos-if-else",
    categoria: "CONDICIONAIS",
    titulo: "BLOCOS CONDICIONAIS (IF / ELSE)",
    subtitulo: "CONDIÇÕES FICAM ENTRE PARÊNTESES () E O CORPO ENTRE CHAVES {}.",
    certo: "if (atk > 10) { atacar(); } else { mover(); }",
    erro: "if atk > 10 atacar(); else mover();",
    andarPratica: 7,
  },
  {
    id: "boolean-direto",
    categoria: "CONDICIONAIS",
    titulo: "TESTE BOOLEANO DIRETO",
    subtitulo: "VARIÁVEIS BOOLEAN PODEM IR DIRETO DENTRO DO IF SEM == TRUE.",
    certo: "if (ativo) { disparar(); }",
    erro: 'if ("ativo") { disparar(); }',
    andarPratica: 6,
  },
  {
    id: "operadores-relacionais",
    categoria: "CONDICIONAIS",
    titulo: "OPERADORES RELACIONAIS (>=, <=, !=)",
    subtitulo: "COMPARE FORÇA, MANA OU VIDA PARA ESCOLHER O ATAQUE CERTO.",
    certo: "if (mana >= 5) { disparar(); }",
    erro: "if (mana => 5) { disparar(); }",
    andarPratica: 7,
  },
  {
    id: "laco-while",
    categoria: "LACOS_ARRAYS",
    titulo: "LAÇO WHILE (ENQUANTO)",
    subtitulo: "REPETE O BLOCO ENQUANTO A CONDIÇÃO PERMANECER VERDADEIRA.",
    certo: "while (inimigo > 0) { atacar(); }",
    erro: "while inimigo > 0 { atacar(); }",
    andarPratica: 8,
  },
  {
    id: "laco-for",
    categoria: "LACOS_ARRAYS",
    titulo: "LAÇO FOR (CONTADOR)",
    subtitulo: "INICIALIZAÇÃO, CONDIÇÃO E INCREMENTO SEPARADOS POR PONTO E VÍRGULA.",
    certo: "for (int i = 0; i < 3; i++) { atacar(); }",
    erro: "for (int i = 0, i < 3, i++) { atacar(); }",
    andarPratica: 9,
  },
  {
    id: "arrays-java",
    categoria: "LACOS_ARRAYS",
    titulo: "ARRAYS E .LENGTH",
    subtitulo: "USE COLCHETES NO TIPO E .LENGTH (SEM PARÊNTESES) PARA O TAMANHO.",
    certo: "int[] runas = {1, 2, 3};",
    erro: "int runas[] = (1, 2, 3);",
    andarPratica: 11,
  },
  {
    id: "chefe-integrador",
    categoria: "LACOS_ARRAYS",
    titulo: "INTEGRAÇÃO DE CHEFE",
    subtitulo: "COMBINE VARIÁVEIS, CONDIÇÕES E LAÇOS PARA CONQUISTAR CHECKPOINTS.",
    certo: "int golpe = 50; if (golpe >= 50) { mover(); atacar(); }",
    erro: "if (golpe >= 50) mover(); atacar();",
    andarPratica: 10,
  },
];

/**
 * Persistência local da conta (cache do navegador) da UI da Plataforma.
 * As chamadas HTTP ficam nos @services de cada controller do backend:
 * `autenticacaoService`, `jogadorService` e `metricasDashboardService`.
 */
export const accountService = {
  load(): PlayerAccountState {
    if (typeof window === "undefined") return DEFAULT_ACCOUNT_STATE;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_ACCOUNT_STATE;
      const parsed = JSON.parse(raw) as Partial<PlayerAccountState>;
      return {
        ...DEFAULT_ACCOUNT_STATE,
        ...parsed,
        missoes: parsed.missoes ?? DEFAULT_ACCOUNT_STATE.missoes,
      };
    } catch {
      return DEFAULT_ACCOUNT_STATE;
    }
  },

  save(state: PlayerAccountState): PlayerAccountState {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Ignora erro de cota
      }
    }
    return state;
  },

  buildOnboardingReset(email: string, nomeGoogle: string): PlayerAccountState {
    const firstName = nomeGoogle.trim().split(/\s+/)[0] || email.split("@")[0] || "";
    return {
      ...DEFAULT_ACCOUNT_STATE,
      autenticado: true,
      onboardingConcluido: false,
      email: email.trim().toLowerCase(),
      nomeGoogle: nomeGoogle.trim(),
      apelido: firstName.toUpperCase(),
    };
  },

  applyOnboarding(
    current: PlayerAccountState,
    payload: {
      apelido: string;
      nivelExperiencia: NivelExperiencia;
      canalAquisicao: CanalAquisicao;
      armamentoAtual: TipoArmamento;
      pontoPartida: "ZERO" | "NIVELAMENTO";
    }
  ): PlayerAccountState {
    const startFloor = payload.pontoPartida === "NIVELAMENTO" ? 6 : 1;
    const completed =
      payload.pontoPartida === "NIVELAMENTO" ? [1, 2, 3, 4, 5] : [];

    return this.save({
      ...current,
      autenticado: true,
      onboardingConcluido: true,
      apelido: payload.apelido.trim() || current.apelido,
      nivelExperiencia: payload.nivelExperiencia,
      canalAquisicao: payload.canalAquisicao,
      armamentoAtual: payload.armamentoAtual,
      andarAtual: startFloor,
      checkpointAtual: 1,
      andaresConcluidos: completed,
    });
  },
};
