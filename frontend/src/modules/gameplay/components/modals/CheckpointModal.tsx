"use client";

import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Crown,
  Heart,
  ShieldCheck,
  Sparkles,
  Sword,
  Wand2,
} from "lucide-react";
import {
  ProgressoJogadorDTO,
  ResultadoTurnoDTO,
  TipoArmamento,
} from "../../types/gameplay";
import {
  OctagonBadge,
  StitchedLeatherPanel,
} from "../ui/DesignSystemPrimitives";

interface CheckpointModalProps {
  progresso: ProgressoJogadorDTO;
  resultado: ResultadoTurnoDTO;
  onSwitchWeapon: (arma: TipoArmamento) => void;
  onContinueNextCycle: () => void;
  onExitToTrail?: () => void;
  hasExitHandler: boolean;
}

/**
 * Tela Especial de Conquista de Checkpoint (RF-10 / RF-15 / RF-25):
 * celebrada ao vencer o Chefe dos andares 10, 20, 30..., confirmando
 * o novo checkpoint permanente (11, 21, 31...), restauração completa
 * de 3/3 vidas e 3/3 dicas e liberando troca controlada de arma (RF-08).
 */
export function CheckpointModal({
  progresso,
  resultado,
  onSwitchWeapon,
  onContinueNextCycle,
  onExitToTrail,
  hasExitHandler,
}: CheckpointModalProps) {
  const checkpointFloor = resultado.novoCheckpointAndar ?? progresso.checkpointAtual;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0810]/82 p-4 backdrop-blur-sm">
      <StitchedLeatherPanel
        title={`CHECKPOINT ${checkpointFloor} CONQUISTADO`}
        className="jq-modal-in w-full max-w-xl"
        innerClassName="space-y-4"
      >
        <div className="flex flex-col items-center text-center">
          <OctagonBadge tone="gold" size={72}>
            <Crown className="h-9 w-9 text-[#E5A93B]" />
          </OctagonBadge>
          <h2 className="font-display mt-3 text-3xl font-bold uppercase tracking-wider text-[#E5A93B]">
            CHEFE DERROTADO!
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#F4EFE6]">
            Checkpoint permanente do <strong className="text-[#E5A93B]">Andar {checkpointFloor}</strong> salvo! Você nunca mais regredirá para o ciclo anterior.
          </p>
        </div>

        {/* Confirmação explícita da restauração 3/3 Vidas e 3/3 Dicas (RF-15) */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="jq-slot flex flex-col items-center rounded-xl p-3 text-center">
            <Heart className="h-5 w-5 fill-[#CA1C08] text-[#CA1C08]" />
            <div className="font-display mt-1 text-lg font-bold text-[#F4EFE6]">
              3 / 3 VIDAS
            </div>
            <div className="text-[10px] font-bold uppercase text-[#8CE070]">
              Restauradas
            </div>
          </div>

          <div className="jq-slot flex flex-col items-center rounded-xl p-3 text-center">
            <BookOpen className="h-5 w-5 text-[#E5A93B]" />
            <div className="font-display mt-1 text-lg font-bold text-[#F4EFE6]">
              3 / 3 DICAS
            </div>
            <div className="text-[10px] font-bold uppercase text-[#8CE070]">
              Restauradas
            </div>
          </div>

          <div className="jq-slot flex flex-col items-center rounded-xl p-3 text-center">
            <Sparkles className="h-5 w-5 text-[#8CE070]" />
            <div className="font-display mt-1 text-lg font-bold text-[#8CE070]">
              +{resultado.xpGanho} XP
            </div>
            <div className="text-[10px] font-bold uppercase text-[#B08A6E]">
              Bônus Chefe
            </div>
          </div>
        </div>

        {/* RF-08: Troca controlada de armamento liberada no Checkpoint */}
        <div className="jq-slot rounded-xl p-3.5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#E5A93B]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#5A8F49]" />
              Troca de Armamento Liberada no Checkpoint
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["ESPADA", "CAJADO"] as TipoArmamento[]).map((arma) => {
              const active = progresso.armamentoAtual === arma;
              return (
                <button
                  key={arma}
                  type="button"
                  onClick={() => onSwitchWeapon(arma)}
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all ${
                    active
                      ? "border-[#E5A93B] bg-[#262134] text-[#E5A93B]"
                      : "border-[#6C6877]/35 bg-[#0C0810] text-[#B08A6E] hover:border-[#B08A6E]"
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
            onClick={onContinueNextCycle}
            className="jq-btn-crimson flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-display text-base font-bold uppercase tracking-wider"
          >
            <span>INICIAR ANDAR {checkpointFloor}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </StitchedLeatherPanel>
    </div>
  );
}
