"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StitchedLeatherPanel } from "@gameplay/components/ui/DesignSystemPrimitives";
import { usePlayerAccount } from "@platform/controllers/PlayerAccountContext";
import { GRIMOIRE_TOPICS } from "@platform/services/accountService";
import { GrimoireTopicCard } from "@platform/types/platform";
import { PlatformShell } from "./PlatformShell";

const TABS: { id: GrimoireTopicCard["categoria"]; label: string }[] = [
  { id: "VARIAVEIS", label: "VARIÁVEIS & TIPOS" },
  { id: "CONDICIONAIS", label: "CONDICIONAIS (IF / ELSE)" },
  { id: "LACOS_ARRAYS", label: "LAÇOS & ARRAYS" },
];

/**
 * Tela Dicas de Java • Grimório (`Dicas Java.png`):
 * painel de couro costurado com 3 abas, cards CERTO vs ERRO em monospace
 * e botão "PRATICAR TÓPICO" que leva direto à arena no andar correspondente.
 */
export function GrimoireView() {
  const router = useRouter();
  const { markTopicStudied } = usePlayerAccount();
  const [activeTab, setActiveTab] =
    useState<GrimoireTopicCard["categoria"]>("VARIAVEIS");
  const [selectedCardId, setSelectedCardId] = useState<string>("ponto-virgula");

  const filtered = GRIMOIRE_TOPICS.filter((t) => t.categoria === activeTab);

  const handlePracticeTopic = (topic: GrimoireTopicCard) => {
    markTopicStudied(topic.id);
    router.push(`/jogar?andar=${topic.andarPratica}&direto=1&modo=treino`);
  };

  return (
    <PlatformShell pageTitle="DICAS DE JAVA • GRIMÓRIO">
      <div className="mx-auto max-w-5xl pt-4">
        <StitchedLeatherPanel
          title="GRIMÓRIO DE SINTAXE"
          onClose={() => router.push("/trilha")}
          closeLabel="Voltar para a trilha guiada"
          innerClassName="space-y-6 p-6 pt-8"
        >
          {/* 3 Abas de categoria */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    const first = GRIMOIRE_TOPICS.find((t) => t.categoria === tab.id);
                    if (first) setSelectedCardId(first.id);
                  }}
                  className={`cursor-pointer rounded-full border-2 py-2.5 font-display text-sm font-bold uppercase tracking-wider transition-all ${
                    active
                      ? "border-[#E5A93B] bg-[#1B1118] text-[#E5A93B]"
                      : "border-transparent bg-[#1B1118]/80 text-[#B08A6E] hover:border-[#6C6877]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Grid 2x2 de cards de sintaxe CERTO vs ERRO */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((card) => {
              const selected = selectedCardId === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    setSelectedCardId(card.id);
                    markTopicStudied(card.id);
                  }}
                  className={`flex cursor-pointer flex-col justify-between rounded-2xl p-5 transition-all ${
                    selected ? "jq-slot-selected" : "jq-slot hover:border-[#B08A6E]/50"
                  }`}
                >
                  <div>
                    <h2 className="font-display text-xl font-bold uppercase tracking-wider text-[#E5A93B]">
                      {card.titulo}
                    </h2>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#F4EFE6]/85">
                      {card.subtitulo}
                    </p>

                    <div className="mt-4 space-y-1.5 font-code text-[14px]">
                      <div className="text-[#8CE070]">
                        <span className="mr-3 font-bold text-[#5A8F49]">CERTO:</span>
                        <span>{card.certo}</span>
                      </div>
                      <div className="text-[#FF7868]">
                        <span className="mr-3 font-bold text-[#CA1C08]">ERRO:</span>
                        <span>{card.erro}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePracticeTopic(card);
                      }}
                      className={`cursor-pointer rounded-xl px-5 py-2 font-display text-sm font-bold uppercase tracking-wider ${
                        selected ? "jq-btn-crimson" : "jq-btn-stone"
                      }`}
                    >
                      PRATICAR TÓPICO
                    </button>
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
