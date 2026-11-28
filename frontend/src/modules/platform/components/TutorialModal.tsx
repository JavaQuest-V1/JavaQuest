"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Play,
  RotateCcw,
  Sword,
  Wand2,
} from "lucide-react";
import { PixelSpritePreview } from "@gameplay/components/arena/PixelSpritePreview";
import {
  JavaSyntaxHighlight,
  StitchedLeatherPanel,
} from "@gameplay/components/ui/DesignSystemPrimitives";
import { TipoArmamento } from "@gameplay/types/gameplay";

const TUTORIAL_BLOCKS = [
  { id: "tb-1", texto: "= 10;" },
  { id: "tb-2", texto: "int" },
  { id: "tb-3", texto: "poder" },
];
const TUTORIAL_ANSWER = ["int", "poder", "= 10;"];

/**
 * Tutorial Inicial limpo e direto em 3 passos:
 * 1) Como funciona a torre | 2) Mini-teste prático de blocos | 3) Arma & Começar Andar 1.
 */
export function TutorialModal({
  isOpen,
  activeWeapon,
  onSelectWeapon,
  onClose,
}: {
  isOpen: boolean;
  activeWeapon: TipoArmamento;
  onSelectWeapon: (arma: TipoArmamento) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [pickedIds, setPickedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const pickedBlocks = pickedIds
    .map((id) => TUTORIAL_BLOCKS.find((b) => b.id === id))
    .filter((b): b is (typeof TUTORIAL_BLOCKS)[number] => Boolean(b));

  const remainingBlocks = TUTORIAL_BLOCKS.filter((b) => !pickedIds.includes(b.id));

  const isSolved =
    pickedBlocks.length === TUTORIAL_ANSWER.length &&
    pickedBlocks.every((b, idx) => b.texto === TUTORIAL_ANSWER[idx]);

  const isWrong = pickedBlocks.length === TUTORIAL_ANSWER.length && !isSolved;

  const handlePlayNow = () => {
    onClose();
    router.push("/jogar?andar=1&direto=1");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0810]/85 p-4 backdrop-blur-md">
      <div className="jq-modal-in w-full max-w-xl">
        <StitchedLeatherPanel
          title={`COMO JOGAR • ${step} DE 3`}
          onClose={onClose}
          closeLabel="Fechar tutorial"
          innerClassName="space-y-5 p-6 pt-9"
        >
          {/* Barra simples de 3 etapas */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-[#E5A93B]" : "bg-[#1B1118]"
                }`}
              />
            ))}
          </div>

          {/* PASSO 1 — RESUMO CLARO */}
          {step === 1 && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-6">
                <PixelSpritePreview kind="HERO" weapon={activeWeapon} size={104} />
                <span className="font-display text-2xl font-bold text-[#E5A93B]">
                  VS
                </span>
                <PixelSpritePreview kind="ENEMY" enemy="boss_dragon" size={114} />
              </div>

              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                DERROTE MONSTROS MONTANDO CÓDIGO JAVA
              </h2>

              <div className="space-y-2 text-left text-sm">
                <div className="jq-slot rounded-xl px-4 py-2.5">
                  <strong className="text-[#E5A93B]">1. Leia e monte:</strong>{" "}
                  clique nos blocos de código Java na ordem correta para atacar.
                </div>
                <div className="jq-slot rounded-xl px-4 py-2.5">
                  <strong className="text-[#FF7868]">2. 3 vidas e 3 dicas:</strong>{" "}
                  cada erro tira 1 vida. Use o Grimório de Dicas quando precisar.
                </div>
                <div className="jq-slot rounded-xl px-4 py-2.5">
                  <strong className="text-[#8CE070]">3. Chefe no Andar 10:</strong>{" "}
                  vença o Dragão para salvar seu Checkpoint 11 e restaurar tudo!
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2 — TESTE PRÁTICO */}
          {step === 2 && (
            <div className="space-y-4 text-center">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                  TESTE AGORA: MONTE <span className="font-code text-[#E5A93B]">int poder = 10;</span>
                </h2>
                <p className="mt-1 text-xs font-semibold text-[#B08A6E]">
                  Clique nos 3 blocos na ordem certa.
                </p>
              </div>

              <div
                className={`min-h-[68px] rounded-xl border-2 bg-[#0C0810] p-3.5 ${
                  isSolved
                    ? "border-[#5A8F49]"
                    : isWrong
                      ? "border-[#CA1C08]"
                      : "border-[#6C6877]/50"
                }`}
              >
                {pickedBlocks.length === 0 ? (
                  <span className="font-code text-sm text-[#6C6877]">
                    Seu código aparece aqui...
                  </span>
                ) : (
                  <div className="flex flex-wrap justify-center gap-2">
                    {pickedBlocks.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          setPickedIds((prev) => prev.filter((id) => id !== b.id))
                        }
                        className="cursor-pointer rounded-lg border-2 border-[#E5A93B] bg-[#1B1118] px-3 py-1.5 text-[15px]"
                      >
                        <JavaSyntaxHighlight code={b.texto} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-2.5">
                {remainingBlocks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setPickedIds((prev) => [...prev, b.id])}
                    className="jq-btn-stone cursor-pointer rounded-xl px-4 py-2 text-[15px]"
                  >
                    <JavaSyntaxHighlight code={b.texto} />
                  </button>
                ))}
              </div>

              {isSolved && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-[#264A2B] px-4 py-2 text-sm font-bold text-[#8CE070]">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Perfeito! É exatamente assim que você ataca na arena.</span>
                </div>
              )}

              {isWrong && (
                <button
                  type="button"
                  onClick={() => setPickedIds([])}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#FF8A7A] hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Ordem incorreta (dica: comece por int). Clique para tentar de novo
                </button>
              )}
            </div>
          )}

          {/* PASSO 3 — ARMA E INICIAR */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                SUA ARMA ESTÁ PRONTA!
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {(["ESPADA", "CAJADO"] as TipoArmamento[]).map((arma) => {
                  const selected = activeWeapon === arma;
                  return (
                    <button
                      key={arma}
                      type="button"
                      onClick={() => onSelectWeapon(arma)}
                      className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl p-3.5 transition-all ${
                        selected ? "jq-slot-selected" : "jq-slot"
                      }`}
                    >
                      <PixelSpritePreview kind="HERO" weapon={arma} size={96} />
                      <div className="flex items-center gap-1.5 font-display text-lg font-bold uppercase text-[#E5A93B]">
                        {arma === "ESPADA" ? (
                          <Sword className="h-4 w-4" />
                        ) : (
                          <Wand2 className="h-4 w-4 text-[#7DF9FF]" />
                        )}
                        <span>{arma === "ESPADA" ? "Espada" : "Cajado"}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#B08A6E]">
                        {arma === "ESPADA" ? "Curto alcance" : "Longa distância"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <button
                  type="button"
                  onClick={onClose}
                  className="jq-btn-stone flex-1 cursor-pointer rounded-xl py-3 font-display text-sm font-bold uppercase tracking-wider"
                >
                  Ver Trilha Guiada
                </button>
                <button
                  type="button"
                  onClick={handlePlayNow}
                  className="jq-btn-crimson flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-display text-sm font-bold uppercase tracking-wider"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Começar no Andar 1</span>
                </button>
              </div>
            </div>
          )}

          {/* Navegação limpa */}
          {step < 3 && (
            <div className="flex items-center justify-between border-t border-[#B08A6E]/20 pt-3.5">
              <button
                type="button"
                onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
                className="jq-btn-stone flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 font-display text-sm font-bold uppercase tracking-wider"
              >
                {step === 1 ? (
                  <span>Pular</span>
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="jq-btn-crimson flex cursor-pointer items-center gap-1.5 rounded-xl px-6 py-2 font-display text-sm font-bold uppercase tracking-wider"
              >
                <span>Próximo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </StitchedLeatherPanel>
      </div>
    </div>
  );
}
