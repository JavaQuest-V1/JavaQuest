"use client";

import React from "react";
import { ArrowRight, Check, Clock, Heart, Sparkles } from "lucide-react";
import { formatDuration } from "@controllers/useSessionTimerController";
import {
  DesafioAndar,
  ProgressoJogadorDTO,
  ResultadoTurnoDTO,
} from "../../types/gameplay";
import {
  JavaSyntaxHighlight,
  OctagonBadge,
  StitchedLeatherPanel,
} from "../ui/DesignSystemPrimitives";

interface FloorVictoryModalProps {
  desafio: DesafioAndar;
  resultado: ResultadoTurnoDTO;
  progresso: ProgressoJogadorDTO;
  floorSeconds: number;
  onNextFloor: () => void;
}

/**
 * Tela de Vitória de Andar (RF-25):
 * exibe resumo do conceito Java aplicado, código válido, XP ganho,
 * tempo no andar e botão para avançar ao próximo andar.
 */
export function FloorVictoryModal({
  desafio,
  resultado,
  progresso,
  floorSeconds,
  onNextFloor,
}: FloorVictoryModalProps) {
  const nextIsBoss = progresso.andarAtual % 10 === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0810]/78 p-4 backdrop-blur-sm">
      <StitchedLeatherPanel
        title={`ANDAR ${desafio.numeroAndar} CONCLUÍDO`}
        className="jq-modal-in w-full max-w-lg"
        innerClassName="space-y-4"
      >
        <div className="flex flex-col items-center text-center">
          <OctagonBadge tone="emerald" size={64}>
            <Check className="h-8 w-8 stroke-[3]" />
          </OctagonBadge>
          <h2 className="font-display mt-3 text-2xl font-bold uppercase tracking-wider text-[#F4EFE6]">
            {desafio.inimigo.nome} DERROTADO!
          </h2>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
            <span className="flex items-center gap-1 rounded-lg bg-[#264A2B] px-2.5 py-1 text-[#8CE070]">
              <Sparkles className="h-3.5 w-3.5" />+{resultado.xpGanho} XP
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-[#1B1118] px-2.5 py-1 text-[#B08A6E]">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(floorSeconds)}
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-[#1B1118] px-2.5 py-1 text-[#FF8A7A]">
              <Heart className="h-3.5 w-3.5 fill-[#CA1C08] text-[#CA1C08]" />
              {progresso.vidasRestantes}/3 Vidas
            </span>
          </div>
        </div>

        {/* Resumo pedagógico do conceito aplicado (RF-25) */}
        <div className="jq-slot space-y-2.5 rounded-xl p-4">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#E5A93B]">
            Conceito Java Dominado • {desafio.topicoJava}
          </div>
          <p className="text-sm leading-relaxed text-[#F4EFE6]/90">
            {desafio.conceitoResumo}
          </p>
          <div className="rounded-lg border border-[#5A8F49]/60 bg-[#0C0810] p-3 font-code text-[15px]">
            <JavaSyntaxHighlight code={desafio.codigoCorreto} />
          </div>
        </div>

        <button
          type="button"
          onClick={onNextFloor}
          className="jq-btn-crimson flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 font-display text-lg font-bold uppercase tracking-wider"
        >
          <span>
            {nextIsBoss
              ? `ENFRENTAR CHEFE — ANDAR ${progresso.andarAtual}`
              : `AVANÇAR PARA O ANDAR ${progresso.andarAtual}`}
          </span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </StitchedLeatherPanel>
    </div>
  );
}
