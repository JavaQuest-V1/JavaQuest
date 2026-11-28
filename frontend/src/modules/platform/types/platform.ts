import { NivelExperiencia, TipoArmamento } from "@gameplay/types/gameplay";

/** Espelha exatamente o enum `com.javaquest.dominio.CanalAquisicao` do backend Java */
export type CanalAquisicao =
  | "YOUTUBE"
  | "TIKTOK"
  | "INDICACAO"
  | "INSTAGRAM"
  | "OUTROS";

export type PracticeModeId =
  | "REVISAO_ERROS"
  | "MODO_ZEN"
  | "SPRINT_VELOCIDADE"
  | "TOPICO_ESPECIFICO";

export interface DailyMission {
  id: string;
  titulo: string;
  atual: number;
  meta: number;
  cor: "emerald" | "gold";
}

export interface PlayerAccountState {
  autenticado: boolean;
  onboardingConcluido: boolean;
  tutorialConcluido: boolean;
  email: string;
  nomeGoogle: string;
  apelido: string;
  nivelExperiencia: NivelExperiencia;
  canalAquisicao: CanalAquisicao;
  armamentoAtual: TipoArmamento;
  andarAtual: number;
  checkpointAtual: number;
  andaresConcluidos: number[];
  bausResgatados: string[];
  vidasAtuais: number;
  dicasAtuais: number;
  xpTotal: number;
  xpSemana: number;
  xpHoje: number;
  streakDias: number;
  recordeStreakDias: number;
  tempoEstudoMinutos: number;
  melhorTempoBloco: string;
  totalTentativas: number;
  totalAcertos: number;
  topicosEstudados: string[];
  combatesSemErroHoje: number;
  missoes: DailyMission[];
}

export interface RankingEntry {
  id: string;
  apelido: string;
  arma: TipoArmamento;
  xpSemana: number;
  isCurrentUser?: boolean;
}

export interface GrimoireTopicCard {
  id: string;
  categoria: "VARIAVEIS" | "CONDICIONAIS" | "LACOS_ARRAYS";
  titulo: string;
  subtitulo: string;
  certo: string;
  erro: string;
  andarPratica: number;
}
