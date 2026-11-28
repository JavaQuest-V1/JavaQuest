"use client";

import { GameplayScreenProps } from "../types/gameplay";
import { useGameplayController } from "./useGameplayController";

/**
 * @controller — Combate (espelha `CombateController` do Spring Boot).
 * RF-11, RF-13, RF-14, RF-17, RF-18, RF-20, RF-21.
 *
 * Expõe as ações com os mesmos nomes do diagrama de classes, por cima do
 * `useGameplayController` (estado da arena, animações e áudio):
 * - iniciarAndar         -> POST /api/combate/andares/{n}/iniciar
 * - submeterCodigo       -> POST /api/combate/turno
 * - solicitarDica        -> POST /api/vidas-dicas/dica
 * - retornarAoCheckpoint -> POST /api/checkpoints/retomar
 * - trocarArmamento      -> PATCH /api/jogador/armamento (só fora de andar ativo)
 */
export function useCombateController(props: GameplayScreenProps) {
  const ctrl = useGameplayController(props);

  return {
    ...ctrl,
    iniciarAndar: ctrl.startBattleFromPreCombat,
    submeterCodigo: ctrl.executeTurn,
    solicitarDica: ctrl.requestHint,
    avancarAndar: ctrl.advanceToNextFloor,
    retornarAoCheckpoint: ctrl.restartFromCheckpoint,
    trocarArmamento: ctrl.switchWeapon,
    podeTrocarArmamento: ctrl.canSwitchWeapon,
  };
}
