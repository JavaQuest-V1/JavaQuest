/**
 * Ponto único de exportação pública do módulo de Gameplay do JavaQuest (RNF-04).
 */
export { GameplayScreen } from "./components/GameplayScreen";
export { useCombateController } from "./controllers/useCombateController";
export { gameplayApiClient } from "./services/apiClient";
export { combateService } from "./services/combateService";
export { vidasDicasService } from "./services/vidasDicasService";
export { checkpointService } from "./services/checkpointService";
export { metricasService } from "./services/metricasService";
export { ARMAMENTOS_CONFIG } from "./types/gameplay";
export type {
  AlcanceArmamento,
  ArenaAnimationEvent,
  ArmamentoConfig,
  BlocoCodigo,
  CategoriaErro,
  ConnectionStatus,
  DesafioAndar,
  DicaPedagogica,
  EnemyArchetype,
  GameplayPhase,
  GameplayScreenProps,
  InimigoArena,
  NivelExperiencia,
  ProgressoJogadorDTO,
  ResultadoTurnoDTO,
  SubmissaoCodigoResultado,
  TipoAcaoHeroi,
  TipoArmamento,
  TipoDano,
} from "./types/gameplay";
