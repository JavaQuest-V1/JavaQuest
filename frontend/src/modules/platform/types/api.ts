/**
 * DTOs JSON trocados entre o front Next.js e os @RestController do Spring Boot
 * (RNF-03). Os nomes dos campos seguem as classes Java do diagrama de classes.
 */
import { NivelExperiencia, TipoArmamento } from "@gameplay/types/gameplay";
import { CanalAquisicao, RankingEntry } from "./platform";

/* ---------- AutenticacaoController ---------- */

/** POST /api/auth/google */
export interface EntrarComGoogleRequest {
  /** ID Token do Google Identity Services (fluxo oficial OAuth 2.0) */
  googleIdToken?: string;
  /** Modo local de testes (sem Client ID): e-mail Gmail + nome */
  email?: string;
  nome?: string;
  /** Força o fluxo de primeiro acesso (onboarding) */
  forceNew?: boolean;
}

export interface EntrarComGoogleResponse {
  tokenJwt?: string;
  primeiroAcesso?: boolean;
  email?: string;
  nome?: string;
  fotoPerfil?: string;
}

/** POST /api/auth/logout */
export interface SairRequest {
  tokenJwt: string;
}

/* ---------- JogadorController ---------- */

/** POST /api/jogador/onboarding */
export interface RegistrarOnboardingRequest {
  email: string;
  nome: string;
  apelido: string;
  nivelExperiencia: NivelExperiencia;
  canalAquisicao: CanalAquisicao;
  armamentoAtual: TipoArmamento;
}

/** PATCH /api/jogador/armamento */
export interface TrocarArmamentoRequest {
  email: string;
  armamento: TipoArmamento;
}

/* ---------- MetricasController ---------- */

/** GET /api/metricas/dashboard/{email} — RF-22 / RF-23 / RF-24 */
export interface DashboardJogadorDTO {
  apelido: string;
  armamentoAtual: TipoArmamento;
  nivelExperiencia: NivelExperiencia;
  andarAtual: number;
  checkpointAtual: number;
  xpTotal: number;
  xpSemana: number;
  streakDias: number;
  recordeStreakDias: number;
  tempoEstudoMinutos: number;
  totalTentativas: number;
  totalAcertos: number;
  andaresConcluidos: number[];
}

/** GET /api/ranking */
export type RankingResponse = RankingEntry[];
