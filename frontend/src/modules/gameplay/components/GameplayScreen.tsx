"use client";

import React from "react";
import { useCombateController } from "@controllers/useCombateController";
import { GameplayScreenProps } from "../types/gameplay";
import { DungeonArenaCanvas } from "./arena/DungeonArenaCanvas";
import { CodeBlocksDrawer } from "./drawer/CodeBlocksDrawer";
import { ReconnectionBanner } from "./hud/ReconnectionBanner";
import { TopHudBar } from "./hud/TopHudBar";
import { CheckpointModal } from "./modals/CheckpointModal";
import { DefeatModal } from "./modals/DefeatModal";
import { FloorVictoryModal } from "./modals/FloorVictoryModal";
import { HintModal } from "./modals/HintModal";
import { PreCombatModal } from "./modals/PreCombatModal";

/**
 * Componente raiz 100% isolado da Interface do Jogo (RNF-04).
 * Pode ser montado diretamente em qualquer rota Next.js (ex.: `/jogar`)
 * sem depender da UI externa (dashboard, login, trilha ou perfil).
 */
export function GameplayScreen(props: GameplayScreenProps) {
  const ctrl = useCombateController(props);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0C0810] text-[#F4EFE6]">
      {/* Arena 2.5D Pixel-Art em Tela Cheia (Canvas 2D a 60 FPS) */}
      <DungeonArenaCanvas
        floorNumber={ctrl.progresso.andarAtual}
        weapon={ctrl.progresso.armamentoAtual}
        heroNickname={ctrl.progresso.apelido}
        heroLives={ctrl.progresso.vidasRestantes}
        enemy={ctrl.desafio?.inimigo ?? null}
        phase={ctrl.phase}
        arenaEvent={ctrl.arenaEvent}
        isDrawerOpen={
          ctrl.isDrawerOpen &&
          ctrl.phase !== "PRE_COMBAT" &&
          ctrl.phase !== "CHECKPOINT_UNLOCKED" &&
          ctrl.phase !== "DEFEAT_GAMEOVER"
        }
      />

      {/* HUD Superior Flutuante */}
      <TopHudBar
        progresso={ctrl.progresso}
        cycleNumber={ctrl.cycleNumber}
        cycleStartFloor={ctrl.cycleStartFloor}
        floorSeconds={ctrl.timer.floorSeconds}
        isPausedByInactivity={ctrl.timer.isPausedByInactivity}
        isMuted={ctrl.audio.isMuted}
        onToggleMute={ctrl.audio.toggleMute}
        isDrawerOpen={ctrl.isDrawerOpen}
        onToggleDrawer={ctrl.toggleDrawer}
        heartBreakPulse={ctrl.heartBreakPulse}
        connectionStatus={ctrl.connectionStatus}
        practiceMode={props.practiceMode}
        onOpenTutorial={props.onOpenTutorial}
        onExitToTrail={ctrl.exitToTrail}
        hasExitHandler={Boolean(props.onExitToTrail)}
      />

      {/* Alertas de Reconexão (RNF-21) e Mobile (RNF-19) */}
      <ReconnectionBanner
        connectionStatus={ctrl.connectionStatus}
        isMobileViewport={ctrl.isMobileViewport}
        mobileNoticeDismissed={ctrl.mobileNoticeDismissed}
        onDismissMobileNotice={ctrl.dismissMobileNotice}
      />

      {/* Painel Lateral Retrátil de Montagem de Blocos Java */}
      {ctrl.phase !== "PRE_COMBAT" && (
        <CodeBlocksDrawer
          isOpen={ctrl.isDrawerOpen}
          onToggleOpen={ctrl.toggleDrawer}
          phase={ctrl.phase}
          progresso={ctrl.progresso}
          desafio={ctrl.desafio}
          selectedBlocks={ctrl.selectedBlocks}
          availableBlocks={ctrl.availableBlocks}
          onAddBlock={ctrl.addBlock}
          onRemoveBlock={ctrl.removeBlock}
          onReorderBlocks={ctrl.reorderSelectedBlocks}
          onClearBlocks={ctrl.clearSelectedBlocks}
          onExecuteTurn={() => void ctrl.executeTurn()}
          isSubmitting={ctrl.isSubmitting}
          consoleLog={ctrl.consoleLog}
          hintUnlockedByError={ctrl.hintUnlockedByError}
          onRequestHint={() => void ctrl.requestHint()}
        />
      )}

      {/* Modal de Preparação / Seleção de Arma no Checkpoint (RF-07 / RF-08) */}
      {ctrl.phase === "PRE_COMBAT" && (
        <PreCombatModal
          progresso={ctrl.progresso}
          onSelectWeapon={(arma) => void ctrl.switchWeapon(arma)}
          onStartBattle={(andar) => void ctrl.startBattleFromPreCombat(andar)}
        />
      )}

      {/* Modal de Dica Pedagógica do Grimório (RF-14) */}
      {ctrl.isHintModalOpen && (
        <HintModal
          dica={ctrl.activeHint}
          onClose={() => ctrl.setIsHintModalOpen(false)}
        />
      )}

      {/* Overlay de Vitória de Andar (RF-25) */}
      {ctrl.phase === "FLOOR_VICTORY" && ctrl.desafio && ctrl.lastResult && (
        <FloorVictoryModal
          desafio={ctrl.desafio}
          resultado={ctrl.lastResult}
          progresso={ctrl.progresso}
          floorSeconds={ctrl.timer.floorSeconds}
          onNextFloor={() => void ctrl.advanceToNextFloor()}
        />
      )}

      {/* Overlay Especial de Conquista de Checkpoint (RF-15 / RF-25) */}
      {ctrl.phase === "CHECKPOINT_UNLOCKED" && ctrl.lastResult && (
        <CheckpointModal
          progresso={ctrl.progresso}
          resultado={ctrl.lastResult}
          onSwitchWeapon={(arma) => void ctrl.switchWeapon(arma)}
          onContinueNextCycle={() => void ctrl.advanceToNextFloor()}
          onExitToTrail={ctrl.exitToTrail}
          hasExitHandler={Boolean(props.onExitToTrail)}
        />
      )}

      {/* Overlay de Derrota — 0 Vidas (RF-11 / RF-13) */}
      {ctrl.phase === "DEFEAT_GAMEOVER" && (
        <DefeatModal
          progresso={ctrl.progresso}
          onSwitchWeapon={(arma) => void ctrl.switchWeapon(arma)}
          onRestartCheckpoint={() => void ctrl.restartFromCheckpoint()}
          onExitToTrail={ctrl.exitToTrail}
          hasExitHandler={Boolean(props.onExitToTrail)}
        />
      )}
    </main>
  );
}
