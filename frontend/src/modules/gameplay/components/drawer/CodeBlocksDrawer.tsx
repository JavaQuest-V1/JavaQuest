"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  Code2,
  RotateCcw,
  Sword,
  Wand2,
} from "lucide-react";
import {
  ARMAMENTOS_CONFIG,
  BlocoCodigo,
  DesafioAndar,
  GameplayPhase,
  ProgressoJogadorDTO,
} from "../../types/gameplay";
import {
  JavaSyntaxHighlight,
  StitchedLeatherPanel,
} from "../ui/DesignSystemPrimitives";

interface CodeBlocksDrawerProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  phase: GameplayPhase;
  progresso: ProgressoJogadorDTO;
  desafio: DesafioAndar | null;
  selectedBlocks: BlocoCodigo[];
  availableBlocks: BlocoCodigo[];
  onAddBlock: (id: string) => void;
  onRemoveBlock: (id: string) => void;
  onReorderBlocks: (fromIndex: number, toIndex: number) => void;
  onClearBlocks: () => void;
  onExecuteTurn: () => void;
  isSubmitting: boolean;
  consoleLog: { tone: "neutral" | "success" | "error"; text: string };
  hintUnlockedByError: boolean;
  onRequestHint: () => void;
}

/**
 * Painel lateral retrátil direto ao ponto (sem prévia das palavras):
 * 1) Objetivo | 2) Seu Código + Blocos Embaralhados | 3) Atacar & Dica.
 */
export function CodeBlocksDrawer({
  isOpen,
  onToggleOpen,
  phase,
  progresso,
  desafio,
  selectedBlocks,
  availableBlocks,
  onAddBlock,
  onRemoveBlock,
  onReorderBlocks,
  onClearBlocks,
  onExecuteTurn,
  isSubmitting,
  consoleLog,
  hintUnlockedByError,
  onRequestHint,
}: CodeBlocksDrawerProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const weaponCfg = ARMAMENTOS_CONFIG[progresso.armamentoAtual];
  const isBoss = Boolean(desafio?.inimigo.ehChefe);
  const isAssembling = phase === "ASSEMBLING";
  const allBlocksPlaced =
    desafio !== null && selectedBlocks.length === desafio.blocosCorretos.length;

  return (
    <>
      {/* Aba limpa na borda direita quando recolhido */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggleOpen}
          className="jq-leather-panel fixed right-0 top-1/2 z-30 flex -translate-y-1/2 cursor-pointer flex-col items-center gap-2 rounded-l-2xl border-r-0 px-3 py-4 text-[#F4EFE6] shadow-2xl transition-transform hover:-translate-x-1"
          title="Abrir painel de código (Tab)"
        >
          <ChevronLeft className="h-5 w-5 text-[#E5A93B]" />
          <Code2 className="h-5 w-5 text-[#E5A93B]" />
          <span
            className="font-display text-xs font-bold uppercase tracking-widest"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            CÓDIGO
          </span>
        </button>
      )}

      {/* Drawer Retrátil */}
      <aside
        aria-label="Painel de Código Java"
        className={`fixed bottom-4 right-4 top-20 z-30 w-[calc(100vw-2rem)] max-w-[440px] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "pointer-events-none translate-x-[calc(100%+32px)]"
        }`}
      >
        <StitchedLeatherPanel
          title={
            desafio
              ? isBoss
                ? `CHEFE • ANDAR ${desafio.numeroAndar}`
                : desafio.topicoJava.toUpperCase()
              : "COMBATE JAVA"
          }
          onClose={onToggleOpen}
          closeLabel="Recolher painel (Tab)"
          className="h-full"
          innerClassName="flex flex-col gap-3.5 overflow-hidden"
        >
          {!desafio ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[#B08A6E]">
              Carregando desafio...
            </div>
          ) : (
            <div className="jq-scroll flex flex-1 flex-col gap-3.5 overflow-y-auto pr-1">
              {/* 1. Objetivo */}
              <div className="jq-slot rounded-xl p-3.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#E5A93B]">
                  {desafio.inimigo.nome}
                </div>
                <p className="mt-1 text-[15px] font-semibold leading-snug text-[#F4EFE6]">
                  {desafio.objetivo}
                </p>
              </div>

              {/* 2. Seu Código (Zona de Montagem) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#F4EFE6]">
                    Seu Código
                  </span>
                  {selectedBlocks.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearBlocks}
                      disabled={!isAssembling}
                      className="flex cursor-pointer items-center gap-1 text-xs font-bold text-[#B08A6E] hover:text-[#E5A93B]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                <div
                  className={`min-h-[84px] rounded-xl border-2 bg-[#0C0810] p-3.5 transition-colors ${
                    allBlocksPlaced
                      ? "border-[#5A8F49]"
                      : "border-[#6C6877]/45"
                  }`}
                >
                  {selectedBlocks.length === 0 ? (
                    <div className="font-code flex min-h-[48px] items-center text-[14px] text-[#6C6877]">
                      Clique nos blocos abaixo na ordem correta...
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedBlocks.map((block, index) => (
                        <button
                          key={block.id}
                          type="button"
                          draggable={isAssembling}
                          onDragStart={() => setDragIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragIndex !== null) {
                              onReorderBlocks(dragIndex, index);
                            }
                            setDragIndex(null);
                          }}
                          onClick={() => onRemoveBlock(block.id)}
                          disabled={!isAssembling}
                          title="Clique para remover ou arraste para reordenar"
                          className="cursor-pointer rounded-lg border-2 border-[#E5A93B]/75 bg-[#1B1118] px-3 py-1.5 text-[15px] transition-colors hover:border-[#CA1C08]"
                        >
                          <JavaSyntaxHighlight code={block.texto} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Blocos Embaralhados */}
              <div className="jq-slot rounded-xl p-3.5">
                <div className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-[#B08A6E]">
                  Blocos Embaralhados
                </div>

                {availableBlocks.length === 0 ? (
                  <p className="text-center text-xs font-bold text-[#8CE070]">
                    Tudo posicionado — clique em atacar!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableBlocks.map((block) => (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => onAddBlock(block.id)}
                        disabled={!isAssembling || isSubmitting}
                        className="jq-btn-stone cursor-pointer rounded-xl px-3.5 py-2 text-[15px]"
                      >
                        <JavaSyntaxHighlight code={block.texto} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback de erro ou sucesso */}
              {consoleLog.tone !== "neutral" && consoleLog.text && (
                <div
                  className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold leading-snug ${
                    consoleLog.tone === "success"
                      ? "border-[#5A8F49] bg-[#264A2B]/70 text-[#D8F5CC]"
                      : "border-[#CA1C08] bg-[#4A1112]/85 text-[#FFD5CF]"
                  }`}
                >
                  {consoleLog.text}
                </div>
              )}
            </div>
          )}

          {/* Rodapé com 2 botões claros */}
          {desafio && (
            <div className="mt-auto flex flex-col gap-2 border-t border-[#B08A6E]/20 pt-3">
              <button
                type="button"
                onClick={onExecuteTurn}
                disabled={
                  !isAssembling || isSubmitting || selectedBlocks.length === 0
                }
                className="jq-btn-crimson flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-display text-lg font-bold uppercase tracking-wider"
              >
                {progresso.armamentoAtual === "ESPADA" ? (
                  <Sword className="h-5 w-5" />
                ) : (
                  <Wand2 className="h-5 w-5" />
                )}
                <span>
                  {isSubmitting ? "VALIDANDO..." : weaponCfg.ctaLabel}
                </span>
              </button>

              <button
                type="button"
                onClick={onRequestHint}
                disabled={!isAssembling || progresso.dicasRestantes <= 0}
                className={`jq-btn-stone flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2 text-xs font-extrabold uppercase tracking-wider ${
                  hintUnlockedByError && progresso.dicasRestantes > 0
                    ? "animate-pulse-gold border-[#E5A93B] text-[#E5A93B]"
                    : "text-[#F4EFE6]"
                }`}
              >
                <BookOpen className="h-4 w-4 text-[#E5A93B]" />
                <span>
                  {progresso.dicasRestantes > 0
                    ? `Pedir Dica (${progresso.dicasRestantes}/3)`
                    : "Sem Dicas neste Ciclo (0/3)"}
                </span>
              </button>
            </div>
          )}
        </StitchedLeatherPanel>
      </aside>
    </>
  );
}
