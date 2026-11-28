"use client";

import React from "react";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";
import { DicaPedagogica } from "../../types/gameplay";
import {
  OctagonBadge,
  StitchedLeatherPanel,
} from "../ui/DesignSystemPrimitives";

interface HintModalProps {
  dica: DicaPedagogica | null;
  onClose: () => void;
}

const CATEGORIA_LABELS: Record<DicaPedagogica["categoriaErro"], string> = {
  SINTAXE: "ERRO DE SINTAXE",
  LOGICA: "ERRO DE LÓGICA",
  METODO: "CHAMADA DE MÉTODO",
  TIPO_DE_DADO: "TIPO DE DADO JAVA",
};

/**
 * Modal de Dica Pedagógica (RF-14) estilizado fielmente conforme `Dicas Java.png`
 * (Grimório de Sintaxe com bloco CERTO em verde esmeralda e ERRO em vermelho carmesim).
 */
export function HintModal({ dica, onClose }: HintModalProps) {
  if (!dica) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0810]/80 p-4 backdrop-blur-sm">
      <StitchedLeatherPanel
        title="GRIMÓRIO DE DICAS"
        onClose={onClose}
        className="jq-modal-in w-full max-w-lg"
        innerClassName="space-y-4"
      >
        <div className="flex items-center gap-3">
          <OctagonBadge tone="gold" size={48}>
            <BookOpen className="h-5 w-5" />
          </OctagonBadge>
          <div>
            <span className="inline-block rounded-md bg-[#5A3E18] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#E5A93B]">
              {CATEGORIA_LABELS[dica.categoriaErro]}
            </span>
            <h2 className="font-display mt-0.5 text-xl font-bold uppercase tracking-wider text-[#E5A93B]">
              {dica.tituloRegra}
            </h2>
          </div>
        </div>

        <div className="jq-slot-selected space-y-3 rounded-xl p-4">
          <p className="text-sm font-semibold leading-relaxed text-[#F4EFE6]">
            {dica.texto}
          </p>

          {/* Comparação CERTO vs ERRO idêntica ao `Dicas Java.png` */}
          <div className="space-y-2 rounded-xl bg-[#0C0810] p-3.5 font-code text-[14px]">
            <div className="flex items-start gap-2 text-[#8CE070]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5A8F49]" />
              <div>
                <span className="mr-2 font-bold text-[#5A8F49]">CERTO:</span>
                <span>{dica.exemploCerto}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 text-[#FF8A7A]">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#CA1C08]" />
              <div>
                <span className="mr-2 font-bold text-[#CA1C08]">ERRO:</span>
                <span>{dica.exemploErro}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-[#B08A6E]">
            Dicas restantes neste ciclo:{" "}
            <strong className="text-[#E5A93B]">{dica.dicasRestantes}/3</strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="jq-btn-crimson cursor-pointer rounded-xl px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider"
          >
            VOLTAR AO COMBATE
          </button>
        </div>
      </StitchedLeatherPanel>
    </div>
  );
}
