"use client";

import React from "react";
import { Play, ShieldCheck, Sword, Wand2 } from "lucide-react";
import {
  ARMAMENTOS_CONFIG,
  ProgressoJogadorDTO,
  TipoArmamento,
} from "../../types/gameplay";
import { PixelSpritePreview } from "../arena/PixelSpritePreview";
import { StitchedLeatherPanel } from "../ui/DesignSystemPrimitives";

interface PreCombatModalProps {
  progresso: ProgressoJogadorDTO;
  onSelectWeapon: (arma: TipoArmamento) => void;
  onStartBattle: (andar?: number) => void;
}

/**
 * Tela limpa de preparação fora de combate no Checkpoint:
 * permite confirmar Espada ou Cajado (RF-07 / RF-08) antes de iniciar o andar atual.
 */
export function PreCombatModal({
  progresso,
  onSelectWeapon,
  onStartBattle,
}: PreCombatModalProps) {
  const weapons: TipoArmamento[] = ["ESPADA", "CAJADO"];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0C0810]/80 p-4 backdrop-blur-sm">
      <div className="jq-modal-in w-full max-w-2xl">
        <StitchedLeatherPanel
          title={`PREPARAÇÃO • ANDAR ${progresso.andarAtual}`}
          innerClassName="space-y-5"
        >
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-[#F4EFE6]">
              CONFIRME SEU ARMAMENTO
            </h1>
            <p className="mt-1 text-xs font-semibold text-[#B08A6E]">
              A arma fica ativa durante o ciclo e só pode ser trocada fora de combate.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {weapons.map((tipo) => {
              const cfg = ARMAMENTOS_CONFIG[tipo];
              const selected = progresso.armamentoAtual === tipo;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => onSelectWeapon(tipo)}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all ${
                    selected ? "jq-slot-selected" : "jq-slot hover:border-[#B08A6E]/60"
                  }`}
                >
                  <PixelSpritePreview kind="HERO" weapon={tipo} size={108} />
                  <div
                    className={`flex items-center justify-center gap-1.5 font-display text-xl font-bold uppercase tracking-wider ${
                      selected ? "text-[#E5A93B]" : "text-[#F4EFE6]"
                    }`}
                  >
                    {tipo === "ESPADA" ? (
                      <Sword className="h-4 w-4" />
                    ) : (
                      <Wand2 className="h-4 w-4 text-[#7DF9FF]" />
                    )}
                    <span>{cfg.nome}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#B08A6E]">
                    {cfg.alcance === "CURTO"
                      ? "Combate corpo a corpo (curto alcance)"
                      : "Combate mágico (longa distância)"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#8CE070]">
            <ShieldCheck className="h-4 w-4" />
            <span>
              {progresso.vidasRestantes}/3 Vidas • {progresso.dicasRestantes}/3 Dicas
            </span>
          </div>

          <button
            type="button"
            onClick={() => onStartBattle(progresso.andarAtual)}
            className="jq-btn-crimson flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 font-display text-lg font-bold uppercase tracking-wider"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>ENTRAR NO ANDAR {progresso.andarAtual}</span>
          </button>
        </StitchedLeatherPanel>
      </div>
    </div>
  );
}
