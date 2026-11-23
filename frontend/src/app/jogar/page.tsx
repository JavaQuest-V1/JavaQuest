"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameplayScreen, TipoArmamento } from "@gameplay/index";
import { TutorialModal } from "@platform/components/TutorialModal";
import { usePlayerAccount } from "@platform/controllers/PlayerAccountContext";

function JogarRouteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    account,
    hydrated,
    isTutorialOpen,
    openTutorial,
    closeTutorial,
    switchWeapon,
    recordTurnMistake,
    syncFloorVictory,
    syncCheckpointUnlocked,
  } = usePlayerAccount();

  // RF-01 / RF-05: proteger rota `/jogar` antes do login e onboarding
  useEffect(() => {
    if (!hydrated) return;
    if (!account.autenticado) {
      router.replace("/login");
    } else if (!account.onboardingConcluido) {
      router.replace("/onboarding");
    }
  }, [account.autenticado, account.onboardingConcluido, hydrated, router]);

  if (!hydrated || !account.autenticado || !account.onboardingConcluido) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0C0810] font-display text-lg uppercase tracking-widest text-[#E5A93B]">
        Preparando Arena JavaQuest...
      </div>
    );
  }

  const floorParam = params.get("andar");
  const parsedFloor = floorParam ? Number(floorParam) : account.andarAtual;
  const initialFloor =
    Number.isFinite(parsedFloor) && parsedFloor >= 1
      ? parsedFloor
      : account.andarAtual;

  const armaParam = params.get("arma")?.toUpperCase();
  const weapon: TipoArmamento =
    armaParam === "CAJADO" || armaParam === "ESPADA"
      ? armaParam
      : account.armamentoAtual;

  const skipPrep = params.get("direto") === "1";
  const practiceMode = params.get("modo") === "treino";

  return (
    <>
      <GameplayScreen
        playerEmail={account.email}
        playerNickname={account.apelido}
        initialFloor={initialFloor}
        initialCheckpoint={account.checkpointAtual}
        initialWeapon={weapon}
        initialXp={account.xpTotal}
        initialStreak={account.streakDias}
        skipPreCombatModal={skipPrep}
        practiceMode={practiceMode}
        onOpenTutorial={openTutorial}
        onTurnMistake={() => recordTurnMistake()}
        onExitToTrail={() => {
          router.push("/trilha");
        }}
        onFloorCompleted={(resultado) => {
          syncFloorVictory(resultado, practiceMode);
        }}
        onCheckpointUnlocked={(checkpointAndar, snapshot) => {
          syncCheckpointUnlocked(checkpointAndar, snapshot);
        }}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        activeWeapon={account.armamentoAtual}
        onSelectWeapon={switchWeapon}
        onClose={closeTutorial}
      />
    </>
  );
}

/**
 * Rota `/jogar` conectando o módulo isolado `<GameplayScreen />` (RNF-04)
 * à conta do jogador (Trilha, Perfil, Ranking, Missões e Tutorial).
 */
export default function JogarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#0C0810] font-display text-lg uppercase tracking-widest text-[#E5A93B]">
          Carregando Arena JavaQuest...
        </div>
      }
    >
      <JogarRouteInner />
    </Suspense>
  );
}
