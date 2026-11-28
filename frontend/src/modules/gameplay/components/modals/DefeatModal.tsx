"use client";

import React from "react";
import {
  ArrowLeft,
  RefreshCw,
  Shuffle,
  Skull,
  Sword,
  Wand2,
} from "lucide-react";
import { ProgressoJogadorDTO, TipoArmamento } from "../../types/gameplay";
import {
  OctagonBadge,
  StitchedLeatherPanel,
} from "../ui/DesignSystemPrimitives";

interface DefeatModalProps {
  progresso: ProgressoJogadorDTO;
  onSwitchWeapon: (arma: TipoArmamento) => void;
  onRestartCheckpoint: () => void;
  onExitToTrail?: () => void;
  hasExitHandler: boolean;
}

/**
 * Tela de Derrota ao atingir 0 vidas (RF-11 / RF-13 / RF-21):
 * informa retorno ao último checkpoint permanente (nunca regredindo a ciclos anteriores),
 * sorteio de novas variações anti-memorização e troca de arma permitida antes de reiniciar (RF-08).
 */
export function DefeatModal({
  progresso,
  onSwitchWeapon,
  onRestartCheckpoint,
  onExitToTrail,
  hasExitHandler,
}: DefeatModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0810]/84 p-4 backdrop-blur-sm">
      <StitchedLeatherPanel
        title="DERROTA NA MASMORRA"
        className="jq-modal-in w-full max-w-lg"
        innerClassName="space-y-4"
      >
        <div className="flex flex-col items-center text-center">
          <OctagonBadge tone="crimson" size={68}>
            <Skull className="h-8 w-8" />
          </OctagonBadge>
          <h2 className="font-display mt-3 text-2xl font-bold uppercase tracking-wider text-[#FF7868]">
            SUAS 3 VIDAS ACABARAM!
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#F4EFE6]/90">
            Seu progresso neste ciclo será reiniciado no seu último checkpoint:{" "}
            <strong className="text-[#E5A93B]">
              Andar {progresso.checkpointAtual}
            </strong>
            . Suas 3 vidas e 3 dicas serão restauradas para a nova tentativa.
          </p>
        </div>

        {/* Badge anti-memorização (RF-21) */}
        <div className="jq-slot flex items-center gap-3 rounded-xl p-3">
          <Shuffle className="h-5 w-5 shrink-0 text-[#E5A93B]" />
          <p className="text-xs leading-snug text-[#B08A6E]">
            <strong className="text-[#F4EFE6]">Sistema Anti-Memorização ativo:</strong>{" "}
            novas variações de desafios Java serão sorteadas ao reiniciar o ciclo.
          </p>
        </div>

        {/* Troca opcional de arma fora de combate antes de reiniciar (RF-08) */}
        <div className="jq-slot rounded-xl p-3">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#B08A6E]">
            Deseja mudar seu armamento antes de tentar novamente?
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["ESPADA", "CAJADO"] as TipoArmamento[]).map((arma) => {
              const active = progresso.armamentoAtual === arma;
              return (
                <button
                  key={arma}
                  type="button"
                  onClick={() => onSwitchWeapon(arma)}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-2 text-xs font-extrabold uppercase tracking-wider ${
                    active
                      ? "border-[#E5A93B] bg-[#262134] text-[#E5A93B]"
                      : "border-[#6C6877]/35 bg-[#0C0810] text-[#B08A6E]"
                  }`}
                >
                  {arma === "ESPADA" ? (
                    <Sword className="h-4 w-4" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>{arma === "ESPADA" ? "Espada" : "Cajado"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {hasExitHandler && (
            <button
              type="button"
              onClick={onExitToTrail}
              className="jq-btn-stone flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-display text-base font-bold uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar à Trilha</span>
            </button>
          )}
          <button
            type="button"
            onClick={onRestartCheckpoint}
            className="jq-btn-crimson flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-display text-base font-bold uppercase tracking-wider"
          >
            <RefreshCw className="h-4 w-4" />
            <span>REINICIAR NO ANDAR {progresso.checkpointAtual}</span>
          </button>
        </div>
      </StitchedLeatherPanel>
    </div>
  );
}
