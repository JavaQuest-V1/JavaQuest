"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Crown,
  Flame,
  LogOut,
  Shield,
  Star,
  Sword,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react";
import { ARMAMENTOS_CONFIG, TipoArmamento } from "@gameplay/types/gameplay";
import { PixelSpritePreview } from "@gameplay/components/arena/PixelSpritePreview";
import {
  OctagonBadge,
  StitchedLeatherPanel,
} from "@gameplay/components/ui/DesignSystemPrimitives";
import { usePlayerAccount } from "@platform/controllers/PlayerAccountContext";
import { useAutenticacaoController } from "@platform/controllers/useAutenticacaoController";
import { useJogadorController } from "@platform/controllers/useJogadorController";
import { useMetricasController } from "@platform/controllers/useMetricasController";
import { PlatformShell } from "./PlatformShell";

/**
 * Tela Perfil do Aventureiro (`Tela perfil .png`, RF-05, RF-08, RF-22, RF-23, RF-24):
 * ficha do herói, troca controlada de armamento fora de combate (Espada/Cajado),
 * logout, 4 KPIs, domínio por conceito Java e insígnias desbloqueadas.
 */
export function ProfileView() {
  const { account } = usePlayerAccount();
  const { sair } = useAutenticacaoController();
  const { trocarArmamento, erro: erroArmamento, salvando: trocandoArma } = useJogadorController();
  const {
    posicaoRanking: userRankPosition,
    precisao: accuracyPercent,
    dominioConceitos: conceptMastery,
  } = useMetricasController();
  const [showWeaponPicker, setShowWeaponPicker] = useState(false);

  const weaponCfg = ARMAMENTOS_CONFIG[account.armamentoAtual];
  const hours = Math.floor(account.tempoEstudoMinutos / 60);
  const mins = account.tempoEstudoMinutos % 60;
  const formattedStudyTime = `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
  const blocksConquered = Math.max(0, Math.floor((account.checkpointAtual - 1) / 10));

  const masteryBars = [
    {
      label: "VARIÁVEIS E TIPOS PRIMITIVOS",
      pct: conceptMastery.variaveis,
      color: "bg-[#5A8F49]",
      text: "text-[#8CE070]",
    },
    {
      label: "OPERADORES E CONCATENAÇÃO",
      pct: conceptMastery.operadores,
      color: "bg-[#5A8F49]",
      text: "text-[#8CE070]",
    },
    {
      label: "CONDICIONAIS (IF / ELSE)",
      pct: conceptMastery.condicionais,
      color: "bg-[#E5A93B]",
      text: "text-[#E5A93B]",
    },
    {
      label: "LAÇOS DE REPETIÇÃO (FOR / WHILE)",
      pct: conceptMastery.lacos,
      color: "bg-[#6C6877]",
      text: "text-[#B08A6E]",
    },
  ];

  const badges = [
    {
      title: "PRIMEIRO FEITIÇO",
      unlocked: account.andaresConcluidos.length >= 1,
      icon: Zap,
    },
    {
      title: "OFENSIVA ATIVA",
      unlocked: account.streakDias >= 2,
      icon: Flame,
    },
    {
      title: "CAÇADOR DE BUGS",
      unlocked: account.andaresConcluidos.length >= 2,
      icon: Shield,
    },
    {
      title: "MESTRE DO BLOCO",
      unlocked: account.checkpointAtual >= 11,
      icon: Crown,
    },
  ];

  const handleLogout = () => {
    void sair();
  };

  return (
    <PlatformShell pageTitle="PERFIL DO AVENTUREIRO">
      <div className="mx-auto max-w-5xl pt-4">
        <StitchedLeatherPanel
          title="FICHA DO HERÓI"
          innerClassName="space-y-5 p-6 pt-8"
        >
          {/* Cartão Principal do Herói com sprite pixel-art animado */}
          <div className="jq-slot-selected flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="shrink-0 overflow-hidden rounded-2xl border-2 border-[#E5A93B]/60 bg-[#0C0810]">
                <PixelSpritePreview
                  kind="HERO"
                  weapon={account.armamentoAtual}
                  size={84}
                />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                  {account.apelido}
                </h2>
                <div className="text-xs font-bold text-[#8CE070]">
                  {account.email} • CONTA GOOGLE VERIFICADA
                </div>
                <div className="mt-1 text-xs font-extrabold uppercase tracking-wider text-[#E5A93B]">
                  ARMA ATIVA: {weaponCfg.nome.toUpperCase()} •{" "}
                  {weaponCfg.alcance === "CURTO"
                    ? "CURTO ALCANCE (FÍSICO)"
                    : "LONGA DISTÂNCIA (ELEMENTAL/ARCANO)"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowWeaponPicker((v) => !v)}
                className="jq-btn-stone cursor-pointer rounded-xl px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wider"
              >
                TROCAR ARMA
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="jq-btn-stone flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-[#FF8A7A]"
                title="Encerrar sessão autenticada (RF-05)"
              >
                <LogOut className="h-4 w-4" />
                <span>SAIR</span>
              </button>
            </div>
          </div>

          {/* Seletor de Troca de Armamento fora de combate (RF-07 / RF-08) */}
          {showWeaponPicker && (
            <div className="jq-slot rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-[#E5A93B]">
                <span>Trocar Armamento Fora de Combate (RF-08)</span>
                <span className="text-[#B08A6E]">
                  Checkpoint Atual: Andar {account.checkpointAtual}
                </span>
              </div>
              {erroArmamento && (
                <p role="alert" className="mb-3 text-xs font-bold text-[#FF8A7A]">
                  {erroArmamento}
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(["ESPADA", "CAJADO"] as TipoArmamento[]).map((arma) => {
                  const cfg = ARMAMENTOS_CONFIG[arma];
                  const active = account.armamentoAtual === arma;
                  return (
                    <button
                      key={arma}
                      type="button"
                      disabled={trocandoArma}
                      onClick={async () => {
                        const ok = await trocarArmamento(arma);
                        if (ok) setShowWeaponPicker(false);
                      }}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        active
                          ? "border-[#E5A93B] bg-[#262134]"
                          : "border-[#6C6877]/35 bg-[#0C0810] hover:border-[#B08A6E]"
                      }`}
                    >
                      <OctagonBadge tone={active ? "gold" : "stone"} size={42}>
                        {arma === "ESPADA" ? (
                          <Sword className="h-4 w-4" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                      </OctagonBadge>
                      <div>
                        <div className="font-display text-base font-bold uppercase text-[#F4EFE6]">
                          {cfg.nome}
                        </div>
                        <div className="text-[11px] text-[#B08A6E]">
                          {cfg.tituloClasse}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4 Cards KPI (idênticos ao `Tela perfil .png`) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="jq-slot rounded-2xl p-4">
              <div className="flex items-center gap-2.5">
                <OctagonBadge tone="gold" size={38}>
                  <Flame className="h-4 w-4" />
                </OctagonBadge>
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#B08A6E]">
                  OFENSIVA ATUAL
                </span>
              </div>
              <div className="font-display mt-3 text-3xl font-bold text-[#E5A93B]">
                {account.streakDias} DIAS
              </div>
              <div className="text-[11px] font-bold uppercase text-[#B08A6E]">
                RECORDE: {account.recordeStreakDias} DIAS
              </div>
            </div>

            <div className="jq-slot rounded-2xl p-4">
              <div className="flex items-center gap-2.5">
                <OctagonBadge tone="emerald" size={38}>
                  <Star className="h-4 w-4" />
                </OctagonBadge>
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#B08A6E]">
                  PONTUAÇÃO TOTAL
                </span>
              </div>
              <div className="font-display mt-3 text-3xl font-bold text-[#8CE070]">
                {account.xpTotal.toLocaleString("pt-BR")} XP
              </div>
              <div className="text-[11px] font-bold uppercase text-[#B08A6E]">
                DIVISÃO BRONZE • #{userRankPosition}º
              </div>
            </div>

            <div className="jq-slot rounded-2xl p-4">
              <div className="flex items-center gap-2.5">
                <OctagonBadge tone="stone" size={38}>
                  <BookOpen className="h-4 w-4" />
                </OctagonBadge>
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#B08A6E]">
                  TEMPO DE ESTUDO
                </span>
              </div>
              <div className="font-display mt-3 text-3xl font-bold text-[#F4EFE6]">
                {formattedStudyTime}
              </div>
              <div className="text-[11px] font-bold uppercase text-[#B08A6E]">
                MELHOR BLOCO: {account.melhorTempoBloco}
              </div>
            </div>

            <div className="jq-slot rounded-2xl p-4">
              <div className="flex items-center gap-2.5">
                <OctagonBadge tone="emerald" size={38}>
                  <Trophy className="h-4 w-4" />
                </OctagonBadge>
                <span className="font-display text-xs font-bold uppercase tracking-wider text-[#B08A6E]">
                  PRECISÃO JAVA
                </span>
              </div>
              <div className="font-display mt-3 text-3xl font-bold text-[#8CE070]">
                {accuracyPercent}%
              </div>
              <div className="text-[11px] font-bold uppercase text-[#B08A6E]">
                BLOCOS CONQUISTADOS: {blocksConquered}
              </div>
            </div>
          </div>

          {/* Linha Inferior: Domínio por Conceito + Insígnias */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
            <div className="jq-slot space-y-3.5 rounded-2xl p-5">
              <h3 className="font-display text-lg font-bold uppercase tracking-wider text-[#F4EFE6]">
                DOMÍNIO POR CONCEITO JAVA
              </h3>
              {masteryBars.map((bar) => (
                <div key={bar.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#F4EFE6]/90">{bar.label}</span>
                    <span className={bar.text}>{bar.pct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0C0810]">
                    <div
                      className={`h-full rounded-full transition-all ${bar.color}`}
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="jq-slot rounded-2xl p-5">
              <h3 className="font-display mb-4 text-lg font-bold uppercase tracking-wider text-[#F4EFE6]">
                INSÍGNIAS DESBLOQUEADAS
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {badges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.title}
                      className="flex flex-col items-center gap-2 text-center"
                    >
                      <OctagonBadge
                        tone={badge.unlocked ? "gold" : "stone"}
                        size={48}
                      >
                        <Icon className="h-5 w-5" />
                      </OctagonBadge>
                      <span
                        className={`font-display text-xs font-bold uppercase tracking-wider ${
                          badge.unlocked ? "text-[#E5A93B]" : "text-[#6C6877]"
                        }`}
                      >
                        {badge.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </StitchedLeatherPanel>
      </div>
    </PlatformShell>
  );
}
