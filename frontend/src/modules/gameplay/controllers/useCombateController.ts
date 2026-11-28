"use client";

import { GameplayScreenProps } from "../types/gameplay";
import { useGameplayController } from "./useGameplayController";

/**
 * @controller — Combate (espelha `CombateController` do Spring Boot).
 * RF-11, RF-13, RF-14, RF-17, RF-18, RF-20, RF-21.
 *
 * Expõe as ações com os mesmos nomes do diagrama de classes, por cima do
 * `useGameplayController` (estado da arena, animações e áudio):
 * - iniciarAndar         -> POST /api/v1/tentativas-ciclo (se não houver run) +
 *                           POST /api/v1/tentativas-ciclo/{runId}/andares/iniciar
 * - submeterCodigo       -> POST /api/v1/tentativas-andar/{attemptId}/submissoes
 * - solicitarDica        -> POST /api/v1/submissoes/{submissionId}/dica
 * - retornarAoCheckpoint -> POST /api/v1/tentativas-ciclo (nova run no checkpoint)
 * - trocarArmamento      -> PATCH /api/v1/tentativas-ciclo/{runId}/armamento (só em PREPARING)
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
