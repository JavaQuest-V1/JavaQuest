"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Heart, Shield, Sparkles, Zap } from "lucide-react";
import {
  OctagonBadge,
  StitchedLeatherPanel,
} from "@gameplay/components/ui/DesignSystemPrimitives";
import { PracticeModeId } from "@platform/types/platform";
import { PlatformShell } from "./PlatformShell";

interface PracticeModeOption {
  id: PracticeModeId;
  badge: string;
  title: string;
  desc: string;
  defaultFloor: number;
  icon: React.ComponentType<{ className?: string }>;
}

const PRACTICE_MODES: PracticeModeOption[] = [
  {
    id: "REVISAO_ERROS",
    badge: "FOCO ALTO",
    title: "REVISÃO DE ERROS RECENTES",
    desc: "Refaça os comandos onde você perdeu corações — desafios prontos para revisão.",
    defaultFloor: 4,
    icon: Zap,
  },
  {
    id: "MODO_ZEN",
    badge: "SEM PRESSÃO",
    title: "MODO ZEN (SEM CRONÔMETRO)",
    desc: "Dicas liberadas e montagem no seu ritmo. Ideal para aprender Java com calma.",
    defaultFloor: 1,
    icon: BookOpen,
  },
  {
    id: "SPRINT_VELOCIDADE",
    badge: "+30 XP BÔNUS",
    title: "SPRINT DE VELOCIDADE",
    desc: "Resolva fases em sequência e bata seu recorde de tempo com recompensa extra.",
    defaultFloor: 6,
    icon: Sparkles,
  },
  {
    id: "TOPICO_ESPECIFICO",
    badge: "LIVRE ESCOLHA",
    title: "ESCOLHER TÓPICO ESPECÍFICO",
    desc: "Variáveis, operadores, condicionais if/else, laços ou Chefe — treine qualquer andar.",
    defaultFloor: 10,
    icon: Shield,
  },
];

const TOPIC_FLOORS = [
  { floor: 1, label: "Andar 1 • int" },
  { floor: 2, label: "Andar 2 • double" },
  { floor: 3, label: "Andar 3 • boolean/String" },
  { floor: 4, label: "Andar 4 • Operadores" },
  { floor: 5, label: "Andar 5 • System.out" },
  { floor: 6, label: "Andar 6 • if" },
  { floor: 7, label: "Andar 7 • if / else" },
  { floor: 8, label: "Andar 8 • while" },
  { floor: 9, label: "Andar 9 • for" },
  { floor: 10, label: "Andar 10 • Chefe Dragão" },
];

/**
 * Tela Praticar Sem Limitações (`Escolha Modo.png`):
 * painel de couro costurado com faixa verde de vidas infinitas, 4 modos selecionáveis
 * e botão "INICIAR TREINO LIVRE" que entra na arena sem risco de Game Over.
 */
export function PracticeView() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] =
    useState<PracticeModeId>("REVISAO_ERROS");
  const [customFloor, setCustomFloor] = useState<number>(6);

  const handleStartPractice = () => {
    const mode = PRACTICE_MODES.find((m) => m.id === selectedMode);
    const floor =
      selectedMode === "TOPICO_ESPECIFICO"
        ? customFloor
        : (mode?.defaultFloor ?? 1);
    router.push(
      `/jogar?andar=${floor}&direto=1&modo=treino&submodo=${selectedMode}`
    );
  };

  return (
    <PlatformShell pageTitle="PRATICAR SEM LIMITAÇÕES">
      <div className="mx-auto max-w-5xl pb-12 pt-4">
        <div className="relative">
          <StitchedLeatherPanel
            title="TREINO LIVRE"
            innerClassName="space-y-5 p-6 pb-10 pt-8"
          >
            {/* Faixa Verde Floresta — Vidas Infinitas */}
            <div className="flex items-center gap-3 rounded-xl bg-[#264A2B] px-4 py-3 text-sm font-extrabold uppercase tracking-wider text-[#F4EFE6]">
              <Heart className="h-5 w-5 fill-[#8CE070] text-[#8CE070]" />
              <span>
                VIDAS INFINITAS ATIVAS — PRATIQUE LIVREMENTE SEM RISCO DE GAME OVER
              </span>
            </div>

            {/* Grid 2x2 dos Modos */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {PRACTICE_MODES.map((mode) => {
                const Icon = mode.icon;
                const active = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl p-5 text-left transition-all ${
                      active ? "jq-slot-selected" : "jq-slot hover:border-[#B08A6E]/55"
                    }`}
                  >
                    <OctagonBadge tone={active ? "gold" : "stone"} size={54}>
                      <Icon className="h-6 w-6" />
                    </OctagonBadge>
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#B08A6E]">
                        {mode.badge}
                      </div>
                      <div
                        className={`font-display text-xl font-bold uppercase tracking-wider ${
                          active ? "text-[#E5A93B]" : "text-[#F4EFE6]"
                        }`}
                      >
                        {mode.title}
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-[#F4EFE6]/75">
                        {mode.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Seletor de tópico quando "Escolher Tópico Específico" está selecionado */}
            {selectedMode === "TOPICO_ESPECIFICO" && (
              <div className="jq-slot rounded-xl p-4">
                <div className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-[#E5A93B]">
                  Selecione o Andar / Tópico para Treinar:
                </div>
                <div className="flex flex-wrap gap-2">
                  {TOPIC_FLOORS.map((item) => (
                    <button
                      key={item.floor}
                      type="button"
                      onClick={() => setCustomFloor(item.floor)}
                      className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                        customFloor === item.floor
                          ? "border-[#E5A93B] bg-[#262134] text-[#E5A93B]"
                          : "border-[#6C6877]/35 bg-[#0C0810] text-[#B08A6E] hover:text-[#F4EFE6]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </StitchedLeatherPanel>

          {/* Botão Carmesim sobreposto na borda inferior como em `Escolha Modo.png` */}
          <div className="relative z-20 -mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleStartPractice}
              className="jq-btn-crimson cursor-pointer rounded-2xl px-10 py-3.5 font-display text-lg font-bold uppercase tracking-wider shadow-2xl"
            >
              INICIAR TREINO LIVRE
            </button>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
