"use client";

import React from "react";
import { Check, Heart, Skull, Sword, Trophy, Wand2, Zap } from "lucide-react";
import {
  OctagonBadge,
  StitchedLeatherPanel,
} from "@gameplay/components/ui/DesignSystemPrimitives";
import { useMetricasController } from "@platform/controllers/useMetricasController";
import { PlatformShell } from "./PlatformShell";

const SCORING_RULES = [
  {
    title: "FASE CONCLUÍDA",
    desc: "AO DERROTAR QUALQUER MONSTRO",
    xp: "+25 XP",
    tone: "emerald" as const,
    xpColor: "text-[#8CE070]",
    icon: Check,
  },
  {
    title: "COMBO SEM ERROS",
    desc: "PASSAR COM VIDAS CHEIAS (3/3)",
    xp: "+15 XP",
    tone: "crimson" as const,
    xpColor: "text-[#FF6E5E]",
    icon: Heart,
  },
  {
    title: "RECORDE VELOCIDADE",
    desc: "RESOLVER RAPIDAMENTE",
    xp: "+10 XP",
    tone: "gold" as const,
    xpColor: "text-[#E5A93B]",
    icon: Zap,
  },
  {
    title: "DOMÍNIO DE ARMAMENTO",
    desc: "ESPADA (CURTO) OU CAJADO (LONGO)",
    xp: "+20% XP",
    tone: "emerald" as const,
    xpColor: "text-[#8CE070]",
    icon: Sword,
  },
  {
    title: "CHEFÃO DO BLOCO",
    desc: "VITÓRIA CONTRA O BOSS + CHECKPOINT",
    xp: "+100 XP",
    tone: "gold" as const,
    xpColor: "text-[#E5A93B]",
    icon: Skull,
  },
];

/**
 * Tela Pontuação & Divisões (`Tela Ranking.png`):
 * dois painéis lado a lado em couro costurado — Divisão Bronze (dinâmica com XP real)
 * e Regras de Pontuação.
 */
export function RankingView() {
  const { ranking } = useMetricasController();

  return (
    <PlatformShell pageTitle="PONTUAÇÃO & DIVISÕES">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 pt-4 lg:grid-cols-[1.25fr_1fr]">
        {/* Painel Esquerdo: Divisão Bronze */}
        <StitchedLeatherPanel
          title="DIVISÃO BRONZE"
          innerClassName="space-y-4 p-5 pt-8"
        >
          <p className="text-center font-display text-sm font-bold uppercase tracking-widest text-[#E5A93B]">
            OS TRÊS PRIMEIROS SOBEM PARA A DIVISÃO PRATA
          </p>

          <div className="space-y-3">
            {ranking.map((entry, idx) => {
              const pos = idx + 1;
              const isTop3 = pos <= 3;

              return (
                <React.Fragment key={entry.id}>
                  <div
                    className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                      entry.isCurrentUser ? "jq-slot-selected" : "jq-slot"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-display w-8 text-lg font-bold ${
                          pos === 1 || entry.isCurrentUser
                            ? "text-[#E5A93B]"
                            : "text-[#9A96A6]"
                        }`}
                      >
                        #{pos}
                      </span>

                      <OctagonBadge
                        tone={
                          pos === 1 || entry.isCurrentUser ? "gold" : "stone"
                        }
                        size={42}
                      >
                        {isTop3 ? (
                          <Trophy className="h-4 w-4" />
                        ) : entry.arma === "ESPADA" ? (
                          <Sword className="h-4 w-4" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                      </OctagonBadge>

                      <div>
                        <div
                          className={`font-display text-base font-bold uppercase tracking-wider ${
                            entry.isCurrentUser
                              ? "text-[#E5A93B]"
                              : "text-[#F4EFE6]"
                          }`}
                        >
                          {entry.apelido}
                        </div>
                        <div className="text-[11px] font-bold uppercase text-[#B08A6E]">
                          ARMA: {entry.arma === "ESPADA" ? "ESPADA RÚNICA" : "CAJADO ARCANO"}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`font-display text-lg font-bold ${
                        pos === 1 || entry.isCurrentUser
                          ? "text-[#E5A93B]"
                          : "text-[#F4EFE6]/85"
                      }`}
                    >
                      {entry.xpSemana} XP
                    </div>
                  </div>

                  {pos === 3 && ranking.length > 3 && (
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-px flex-1 bg-[#E5A93B]/50" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E5A93B]">
                        ZONA DE PROMOÇÃO PARA PRATA
                      </span>
                      <div className="h-px flex-1 bg-[#E5A93B]/50" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {ranking.length === 1 && (
              <div className="rounded-xl border border-dashed border-[#6C6877]/45 bg-[#0C0810]/60 px-4 py-3 text-center text-xs font-semibold text-[#B08A6E]">
                Apenas contas reais cadastradas aparecem aqui. Conclua andares para somar XP na Divisão Bronze!
              </div>
            )}
          </div>
        </StitchedLeatherPanel>

        {/* Painel Direito: Regras de Pontuação */}
        <StitchedLeatherPanel
          title="REGRAS DE PONTUAÇÃO"
          innerClassName="space-y-4 p-5 pt-8"
        >
          <p className="text-center font-display text-sm font-bold uppercase tracking-widest text-[#F4EFE6]/80">
            COMO GANHAR XP E SUBIR NO RANKING
          </p>

          <div className="space-y-3">
            {SCORING_RULES.map((rule) => {
              const Icon = rule.icon;
              return (
                <div
                  key={rule.title}
                  className="jq-slot flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <OctagonBadge tone={rule.tone} size={42}>
                      <Icon className="h-4 w-4" />
                    </OctagonBadge>
                    <div>
                      <div className="font-display text-base font-bold uppercase tracking-wider text-[#F4EFE6]">
                        {rule.title}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-[#B08A6E]">
                        {rule.desc}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-display whitespace-nowrap text-base font-bold ${rule.xpColor}`}
                  >
                    {rule.xp}
                  </div>
                </div>
              );
            })}
          </div>
        </StitchedLeatherPanel>
      </div>
    </PlatformShell>
  );
}
