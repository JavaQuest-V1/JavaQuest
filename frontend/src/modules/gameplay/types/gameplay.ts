/**
 * Contratos de domínio do módulo de Gameplay do JavaQuest.
 * Espelha fielmente as entidades de `com.javaquest.dominio` e os serviços
 * `CombateService`, `ValidacaoJavaService`, `VidasDicasService`,
 * `CheckpointService` e `MetricasService` (RNF-02 / RNF-03 / RNF-04).
 */

export type TipoArmamento = "ESPADA" | "CAJADO";

export type AlcanceArmamento = "CURTO" | "LONGO";

export type TipoDano = "FISICO" | "ELEMENTAL_ARCANO";

export type TipoAcaoHeroi = "MOVER" | "INTERAGIR" | "ATACAR";

export type CategoriaErro = "SINTAXE" | "LOGICA" | "METODO" | "TIPO_DE_DADO";

export type NivelExperiencia = "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";

export type EnemyArchetype =
  | "slime"
  | "wisp"
  | "phantom"
  | "golem"
  | "gargoyle"
  | "knight"
  | "vortex"
  | "skeleton"
  | "boss_dragon";

export interface ArmamentoConfig {
  tipo: TipoArmamento;
  nome: string;
  tituloClasse: string;
  descricaoCurta: string;
  tipoDano: TipoDano;
  alcance: AlcanceArmamento;
  modeloReferencia: string;
  animacaoAtaque: string;
  ctaLabel: string;
}

export interface BlocoCodigo {
  id: string;
  texto: string;
}

export interface InimigoArena {
  nome: string;
  titulo: string;
  arquetipo: EnemyArchetype;
  ehChefe: boolean;
  hpMaximo: number;
  falaConjura: string;
  corAura: string;
}

export interface DicaPedagogica {
  texto: string;
  categoriaErro: CategoriaErro;
  tituloRegra: string;
  exemploCerto: string;
  exemploErro: string;
  dicasRestantes: number;
}

export interface DesafioAndar {
  id: string;
  numeroAndar: number;
  variacaoIndex: number;
  topicoJava: string;
  nivelDificuldade: "BASICO" | "INTERMEDIARIO" | "CHEFE";
  objetivo: string;
  conceitoResumo: string;
  codigoCorreto: string;
  /** Blocos na ordem correta (autoridade no servidor / engine) */
  blocosCorretos: string[];
  /** Blocos embaralhados exibidos ao jogador */
  blocosEmbaralhados: BlocoCodigo[];
  inimigo: InimigoArena;
  xpRecompensa: number;
  acoesEsperadas: TipoAcaoHeroi[];
}

export interface SubmissaoCodigoResultado {
  codigoJava: string;
  sintaxeValida: boolean;
  objetivoAtingido: boolean;
  ehCorreta: boolean;
  categoriaErro?: CategoriaErro;
  diagnostico: string;
  acoes: TipoAcaoHeroi[];
  latenciaMs: number;
}

export interface ResultadoTurnoDTO {
  vitoriaTurno: boolean;
  submissao: SubmissaoCodigoResultado;
  vidasRestantes: number;
  dicasRestantes: number;
  andarAtual: number;
  checkpointAtual: number;
  reiniciouNoCheckpoint: boolean;
  checkpointRegistrado: boolean;
  novoCheckpointAndar?: number;
  xpGanho: number;
  mensagem: string;
}

export interface ProgressoJogadorDTO {
  email: string;
  apelido: string;
  nivelExperiencia: NivelExperiencia;
  armamentoAtual: TipoArmamento;
  andarAtual: number;
  checkpointAtual: number;
  vidasRestantes: number;
  dicasRestantes: number;
  andarEmAndamento: boolean;
  xpTotal: number;
  streakDias: number;
  andaresConcluidosNoCiclo: number[];
  vidasGastasNoCiclo: number;
  dicasUsadasNoCiclo: number;
}

export type GameplayPhase =
  | "PRE_COMBAT"
  | "ASSEMBLING"
  | "ANIMATING_HERO_ATTACK"
  | "ANIMATING_ENEMY_COUNTER"
  | "FLOOR_VICTORY"
  | "CHECKPOINT_UNLOCKED"
  | "DEFEAT_GAMEOVER";

export type { ConnectionStatus } from "@api/httpClient";

export interface ArenaAnimationEvent {
  id: number;
  type:
    | "IDLE"
    | "SPELL_TELEGRAPH"
    | "HERO_SWORD_ATTACK"
    | "HERO_STAFF_ATTACK"
    | "ENEMY_COUNTERATTACK"
    | "ENEMY_DEFEATED"
    | "HERO_DEFEATED"
    | "CHECKPOINT_CELEBRATION";
  damageValue?: number;
  codeText?: string;
}

/**
 * Contrato de integração isolado (RNF-04) para plugar a tela de jogo
 * dentro do aplicativo Next.js principal (dashboard, trilha e perfil do amigo).
 */
export interface GameplayScreenProps {
  /** E-mail ou identificador do jogador autenticado via Google OAuth (RF-01) */
  playerEmail?: string;
  /** Apelido exibido no HUD (RF-02) */
  playerNickname?: string;
  /** Andar inicial ao entrar pela trilha (1, 11, 21... ou andar salvo) */
  initialFloor?: number;
  /** Checkpoint desbloqueado salvo no MySQL */
  initialCheckpoint?: number;
  /** Armamento escolhido no onboarding ou último checkpoint (RF-07 / RF-08) */
  initialWeapon?: TipoArmamento;
  /** XP acumulado vindo do perfil */
  initialXp?: number;
  /** Streak diário atual vindo do perfil (RF-23) */
  initialStreak?: number;
  /** Token JWT para o backend Spring Boot (RNF-10) */
  authToken?: string;
  /** URL base da API Java (se omitida, roda em modo Sandbox jogável completo) */
  apiBaseUrl?: string;
  /** Se true, abre direto no combate; se false, mostra modal rápido de preparação */
  skipPreCombatModal?: boolean;
  /** Modo Treino Livre (vidas infinitas, sem Game Over) */
  practiceMode?: boolean;
  /** Callback para voltar à Trilha Guiada / Dashboard do app principal */
  onExitToTrail?: (snapshot: ProgressoJogadorDTO) => void;
  /** Callback disparado sempre que um andar é concluído (para sincronizar UI externa) */
  onFloorCompleted?: (resultado: ResultadoTurnoDTO) => void;
  /** Callback disparado quando o jogador erra um turno (para precisão real no perfil) */
  onTurnMistake?: () => void;
  /** Callback opcional para abrir o tutorial a partir do HUD da arena */
  onOpenTutorial?: () => void;
  /** Callback disparado quando um checkpoint permanente (11, 21, 31...) é desbloqueado */
  onCheckpointUnlocked?: (checkpointAndar: number, snapshot: ProgressoJogadorDTO) => void;
}

export const ARMAMENTOS_CONFIG: Record<TipoArmamento, ArmamentoConfig> = {
  ESPADA: {
    tipo: "ESPADA",
    nome: "Espada Rúnica",
    tituloClasse: "Combate Corpo a Corpo",
    descricaoCurta:
      "Dano físico de curto alcance. O herói avança sobre o inimigo para desferir o golpe.",
    tipoDano: "FISICO",
    alcance: "CURTO",
    modeloReferencia: "espada_3d.glb",
    animacaoAtaque: "ataque_espada",
    ctaLabel: "GOLPEAR COM ESPADA",
  },
  CAJADO: {
    tipo: "CAJADO",
    nome: "Cajado Arcano",
    tituloClasse: "Combate Mágico à Distância",
    descricaoCurta:
      "Dano elemental/arcano de longa distância. Dispara projéteis mágicos sem precisar se aproximar.",
    tipoDano: "ELEMENTAL_ARCANO",
    alcance: "LONGO",
    modeloReferencia: "cajado_3d.glb",
    animacaoAtaque: "ataque_cajado",
    ctaLabel: "CONJURAR COM CAJADO",
  },
};
