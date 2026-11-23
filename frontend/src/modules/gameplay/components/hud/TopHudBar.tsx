"use client";

import React from "react";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Heart,
  HelpCircle,
  PanelRightClose,
  PanelRightOpen,
  Skull,
  Star,
  Sword,
  Volume2,
  VolumeX,
  Wand2,
} from "lucide-react";
import { formatDuration } from "@controllers/useSessionTimerController";
import {
  ConnectionStatus,
  ProgressoJogadorDTO,
} from "../../types/gameplay";
import { OctagonBadge } from "../ui/DesignSystemPrimitives";

interface TopHudBarProps {
  progresso: ProgressoJogadorDTO;
  cycleNumber: number;
  cycleStartFloor: number;
  floorSeconds: number;
  isPausedByInactivity: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  heartBreakPulse: number;
  connectionStatus: ConnectionStatus;
  practiceMode?: boolean;
  onOpenTutorial?: () => void;
  onExitToTrail?: () => void;
  hasExitHandler: boolean;
}

/**
 * HUD Superior limpo e objetivo: apenas o essencial para leitura imediata em combate
 * (Voltar, Andar/Chefe, progresso do ciclo, Vidas, Dicas, Tempo, Som e Painel de Código).
 */
export function TopHudBar({
  progresso,
  cycleStartFloor,
  floorSeconds,
  isPausedByInactivity,
  isMuted,
  onToggleMute,
  isDrawerOpen,
  onToggleDrawer,
  heartBreakPulse,
  practiceMode = false,
  onOpenTutorial,
  onExitToTrail,
  hasExitHandler,
}: TopHudBarProps) {
  const isBossFloor = progresso.andarAtual % 10 === 0;
  const floorStepInCycle = ((progresso.andarAtual - 1) % 10) + 1;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-4 py-3">
      {/* Esquerda: Voltar + Andar atual + Arma */}
      <div className="pointer-events-auto flex items-center gap-2.5">
        {hasExitHandler && (
          <button
            type="button"
            onClick={onExitToTrail}
            className="jq-btn-stone flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#F4EFE6]"
            title="Voltar para a Trilha Guiada"
          >
            <ArrowLeft className="h-4 w-4 text-[#E5A93B]" />
            <span className="hidden sm:inline">Trilha</span>
          </button>
        )}

        <div className="flex items-center gap-2.5 rounded-2xl border border-[#6C6877]/35 bg-[#0C0810]/86 px-3.5 py-1.5 backdrop-blur-md">
          <OctagonBadge tone={isBossFloor ? "crimson" : "gold"} size={32}>
            {isBossFloor ? (
              <Skull className="h-4 w-4" />
            ) : (
              <Star className="h-3.5 w-3.5 fill-current" />
            )}
          </OctagonBadge>

          <div className="leading-tight">
            <div className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-[#F4EFE6]">
              <span>
                {isBossFloor
                  ? `CHEFE • ANDAR ${progresso.andarAtual}`
                  : `ANDAR ${progresso.andarAtual} DE ${cycleStartFloor + 9}`}
              </span>
              {progresso.armamentoAtual === "ESPADA" ? (
                <Sword className="h-3.5 w-3.5 text-[#E5A93B]" />
              ) : (
                <Wand2 className="h-3.5 w-3.5 text-[#7DF9FF]" />
              )}
            </div>
            {/* Barra slim de progresso do ciclo (1 a 10) */}
            <div className="mt-1 flex items-center gap-1">
              {Array.from({ length: 10 }, (_, i) => {
                const n = i + 1;
                const active = n === floorStepInCycle;
                const done = n < floorStepInCycle;
                return (
                  <span
                    key={n}
                    className={`h-1.5 rounded-full transition-all ${
                      active
                        ? n === 10
                          ? "w-4 bg-[#CA1C08]"
                          : "w-4 bg-[#E5A93B]"
                        : done
                          ? "w-2 bg-[#5A8F49]"
                          : "w-2 bg-[#2D263C]"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Direita: Vidas + Dicas + Tempo + Controles essenciais */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#6C6877]/35 bg-[#0C0810]/86 px-4 py-2 text-xs font-extrabold backdrop-blur-md">
          {/* Vidas */}
          {practiceMode ? (
            <span className="flex items-center gap-1.5 text-[#8CE070]">
              <Heart className="h-4 w-4 fill-[#5A8F49] text-[#5A8F49]" />
              <span>∞ TREINO</span>
            </span>
          ) : (
            <div
              key={heartBreakPulse}
              className={`flex items-center gap-1 ${
                heartBreakPulse > 0 ? "animate-heart-break" : ""
              }`}
              title={`Vidas restantes: ${progresso.vidasRestantes}/3`}
            >
              {[0, 1, 2].map((i) => (
                <Heart
                  key={i}
                  className={`h-4 w-4 ${
                    i < progresso.vidasRestantes
                      ? "fill-[#CA1C08] text-[#CA1C08]"
                      : "fill-[#262134] text-[#6C6877]/45"
                  }`}
                />
              ))}
            </div>
          )}

          <span className="h-3.5 w-px bg-[#2D263C]" />

          {/* Dicas */}
          <div
            className="flex items-center gap-1 text-[#E5A93B]"
            title={`Dicas restantes: ${progresso.dicasRestantes}/3`}
          >
            <BookOpen className="h-4 w-4" />
            <span>{progresso.dicasRestantes}/3</span>
          </div>

          <span className="hidden h-3.5 w-px bg-[#2D263C] sm:inline-block" />

          {/* Cronômetro (pausa automática em 5 min — RF-24) */}
          <div
            className={`hidden items-center gap-1 font-code sm:flex ${
              isPausedByInactivity ? "text-[#E5A93B]" : "text-[#B08A6E]"
            }`}
            title="Tempo ativo no andar (pausa automática após 5 min sem interação)"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(floorSeconds)}</span>
          </div>
        </div>

        {onOpenTutorial && (
          <button
            type="button"
            onClick={onOpenTutorial}
            title="Ajuda / Tutorial"
            aria-label="Abrir tutorial"
            className="jq-btn-stone flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl"
          >
            <HelpCircle className="h-4 w-4 text-[#E5A93B]" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleMute}
          title={isMuted ? "Ativar som" : "Silenciar som"}
          aria-label={isMuted ? "Ativar som" : "Silenciar som"}
          className="jq-btn-stone flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-[#B08A6E]" />
          ) : (
            <Volume2 className="h-4 w-4 text-[#E5A93B]" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleDrawer}
          title="Abrir ou recolher o painel de código (Tab)"
          className="jq-btn-crimson flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider"
        >
          {isDrawerOpen ? (
            <>
              <PanelRightClose className="h-4 w-4" />
              <span className="hidden sm:inline">Ocultar</span>
            </>
          ) : (
            <>
              <PanelRightOpen className="h-4 w-4" />
              <span>Código</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
