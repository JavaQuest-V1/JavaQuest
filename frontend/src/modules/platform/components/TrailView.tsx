"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  Dumbbell,
  Flame,
  Gift,
  Lock,
  Shield,
  Skull,
  Sparkles,
  Star,
  Sword,
  Trophy,
  Zap,
} from "lucide-react";
import { PixelSpritePreview } from "@gameplay/components/arena/PixelSpritePreview";
import { OctagonBadge } from "@gameplay/components/ui/DesignSystemPrimitives";
import { usePlayerAccount } from "@platform/controllers/PlayerAccountContext";
import { useMetricasController } from "@platform/controllers/useMetricasController";
import { PlatformShell } from "./PlatformShell";

interface TrailNodeDef {
  floor: number;
  label: string;
  xp: number;
  offsetX: number;
  isBoss?: boolean;
  chestAfter?: { id: string; title: string; reward: string; bonusXp: number };
}

const UNIT_1_NODES: TrailNodeDef[] = [
  { floor: 1, label: "TIPOS INT E VARIÁVEIS", xp: 25, offsetX: 18 },
  { floor: 2, label: "DECIMAIS COM DOUBLE", xp: 25, offsetX: -36 },
  {
    floor: 3,
    label: "STRING E BOOLEAN",
    xp: 25,
    offsetX: -62,
    chestAfter: {
      id: "chest-runas-u1",
      title: "BAÚ DE RUNAS",
      reward: "+40 XP & +1 DICA",
      bonusXp: 40,
    },
  },
  { floor: 4, label: "OPERADORES ARITMÉTICOS", xp: 25, offsetX: 38 },
  { floor: 5, label: "CONCATENAÇÃO JAVA", xp: 25, offsetX: 62 },
];

const UNIT_2_NODES: TrailNodeDef[] = [
  { floor: 6, label: "CONDIÇÃO SIMPLES (IF)", xp: 30, offsetX: 40 },
  {
    floor: 7,
    label: "DESVIO DUPLO (IF / ELSE)",
    xp: 30,
    offsetX: -12,
    chestAfter: {
      id: "chest-caminho-u2",
      title: "BAÚ DO CAMINHO",
      reward: "+50 XP BÔNUS",
      bonusXp: 50,
    },
  },
  { floor: 8, label: "LAÇO WHILE (REPETIÇÃO)", xp: 35, offsetX: -10 },
  { floor: 9, label: "LAÇO FOR (CONTADOR)", xp: 35, offsetX: 46 },
];

function TrailConnector({
  fromX,
  toX,
  completed,
  active,
}: {
  fromX: number;
  toX: number;
  completed: boolean;
  active: boolean;
}) {
  const cx = 140;
  const x1 = cx + fromX;
  const x2 = cx + toX;
  const midY = 22;
  const stroke = completed ? "#5A8F49" : active ? "#E5A93B" : "#443A54";

  return (
    <svg
      width="280"
      height="44"
      viewBox="0 0 280 44"
      className="pointer-events-none -my-3 overflow-visible"
      aria-hidden="true"
    >
      <path
        d={`M ${x1} 2 C ${x1} ${midY}, ${x2} ${midY}, ${x2} 42`}
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        strokeDasharray="7 7"
        strokeLinecap="round"
        opacity={completed || active ? 0.9 : 0.65}
      />
    </svg>
  );
}

/**
 * Tela Principal — Trilha Guiada (`Tela principal jornada.png`):
 * com conectores SVG tracejados em curva S, baús resgatáveis interativos,
 * sprite animado do herói no card lateral e integração total com `/jogar`.
 */
export function TrailView() {
  const { posicaoRanking: userRankPosition, precisao: accuracyPercent } =
    useMetricasController();
  const { account, claimTrailChest } =
    usePlayerAccount();
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [chestToast, setChestToast] = useState<string | null>(null);

  const activeFloor = Math.min(11, Math.max(1, account.andarAtual));
  const focusedFloor = selectedFloor ?? activeFloor;

  const isFloorDone = (floor: number) =>
    account.andaresConcluidos.includes(floor) || floor < activeFloor;

  const isFloorUnlocked = (floor: number) =>
    floor <= activeFloor ||
    floor <= account.checkpointAtual ||
    account.andaresConcluidos.includes(floor - 1);

  const handleClaimChest = (
    chestId: string,
    title: string,
    bonusXp: number,
    canClaim: boolean
  ) => {
    if (!canClaim) return;
    const claimed = claimTrailChest(chestId, bonusXp);
    if (claimed) {
      setChestToast(`${title} aberto! +${bonusXp} XP adicionados à sua jornada!`);
      window.setTimeout(() => setChestToast(null), 3200);
    }
  };

  const renderNodeList = (nodes: TrailNodeDef[]) =>
    nodes.map((node, idx) => {
      const done = isFloorDone(node.floor);
      const current = node.floor === activeFloor;
      const unlocked = isFloorUnlocked(node.floor);
      const showPopover = focusedFloor === node.floor && unlocked;
      const nextNode = nodes[idx + 1];

      const tone = done
        ? "emerald"
        : node.isBoss
          ? "crimson"
          : current
            ? "gold"
            : "stone";

      const chestUnlocked = node.chestAfter ? done : false;
      const chestClaimed = node.chestAfter
        ? account.bausResgatados.includes(node.chestAfter.id)
        : false;

      return (
        <div key={node.floor} className="flex flex-col items-center">
          <div
            className="relative flex items-center justify-center py-2"
            style={{ transform: `translateX(${node.offsetX}px)` }}
          >
            {/* Rótulo à esquerda */}
            <div className="mr-4 w-44 text-right">
              <div
                className={`font-display text-sm font-bold uppercase tracking-wider ${
                  done
                    ? "text-[#F4EFE6]"
                    : current
                      ? "text-[#E5A93B]"
                      : unlocked
                        ? "text-[#F4EFE6]"
                        : "text-[#6C6877]"
                }`}
              >
                {node.label}
              </div>
              <div className="text-[11px] font-bold uppercase text-[#B08A6E]">
                {done
                  ? `+${node.xp} XP CONCLUÍDA`
                  : current
                    ? "FASE ATUAL"
                    : unlocked
                      ? `ANDAR ${node.floor} • LIBERADA`
                      : "BLOQUEADA"}
              </div>
            </div>

            {/* Medalhão Octogonal */}
            <button
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && setSelectedFloor(node.floor)}
              className={`relative cursor-pointer transition-transform ${
                unlocked ? "hover:scale-105" : "cursor-not-allowed opacity-65"
              }`}
              title={
                unlocked
                  ? `Selecionar Andar ${node.floor}`
                  : "Conclua os andares anteriores para desbloquear (RF-12)"
              }
            >
              {current && (
                <span className="jq-octagon animate-pulse-gold absolute -inset-1.5 bg-[#E5A93B]/35" />
              )}
              <OctagonBadge tone={tone} size={node.isBoss ? 74 : 62}>
                {done ? (
                  <Check className="h-7 w-7 stroke-[3]" />
                ) : node.isBoss ? (
                  <Skull className="h-8 w-8" />
                ) : current ? (
                  <Star className="h-7 w-7 fill-[#F4EFE6]" />
                ) : unlocked ? (
                  <Sword className="h-6 w-6" />
                ) : (
                  <Lock className="h-5 w-5 text-[#9A96A6]" />
                )}
              </OctagonBadge>
            </button>

            {/* Popover flutuante em couro costurado */}
            <div className="ml-4 w-64">
              {showPopover && (
                <div className="jq-modal-in jq-leather-panel rounded-2xl p-3.5 shadow-2xl">
                  <div className="font-display text-base font-bold uppercase tracking-wider text-[#F4EFE6]">
                    ANDAR {node.floor} • {node.label}
                  </div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase text-[#E5A93B]">
                    RECOMPENSA: +{node.xp} XP
                    {node.isBoss ? " & CHECKPOINT 11" : ""}
                  </div>
                  <Link
                    href={`/jogar?andar=${node.floor}&direto=1`}
                    className="jq-btn-crimson mt-3 flex w-full items-center justify-center rounded-xl py-2.5 font-display text-sm font-bold uppercase tracking-wider"
                  >
                    {done ? `REJOGAR ANDAR ${node.floor}` : `COMEÇAR +${node.xp} XP`}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Baú interativo resgatável após concluir o andar anterior */}
          {node.chestAfter && (
            <>
              <TrailConnector
                fromX={node.offsetX}
                toX={node.offsetX * 0.4}
                completed={done}
                active={current}
              />
              <button
                type="button"
                disabled={!chestUnlocked || chestClaimed}
                onClick={() =>
                  node.chestAfter &&
                  handleClaimChest(
                    node.chestAfter.id,
                    node.chestAfter.title,
                    node.chestAfter.bonusXp,
                    chestUnlocked
                  )
                }
                className={`my-1 flex items-center gap-3 rounded-2xl px-3 py-1.5 text-left transition-transform ${
                  chestUnlocked && !chestClaimed
                    ? "animate-float-soft cursor-pointer hover:scale-105"
                    : "cursor-default opacity-80"
                }`}
                style={{ transform: `translateX(${node.offsetX * 0.4}px)` }}
                title={
                  chestClaimed
                    ? "Baú já resgatado"
                    : chestUnlocked
                      ? "Clique para abrir o baú e resgatar a recompensa!"
                      : `Conclua o Andar ${node.floor} para destrancar este baú`
                }
              >
                <OctagonBadge
                  tone={chestClaimed ? "emerald" : chestUnlocked ? "gold" : "stone"}
                  size={50}
                >
                  {chestClaimed ? (
                    <Check className="h-5 w-5 stroke-[3]" />
                  ) : (
                    <Gift className="h-5 w-5 text-[#F4EFE6]" />
                  )}
                </OctagonBadge>
                <div>
                  <div className="font-display text-sm font-bold uppercase tracking-wider text-[#E5A93B]">
                    {node.chestAfter.title}
                  </div>
                  <div className="text-[11px] font-bold uppercase text-[#B08A6E]">
                    {chestClaimed
                      ? "RESGATADO ✓"
                      : chestUnlocked
                        ? `CLIQUE P/ ABRIR (${node.chestAfter.reward})`
                        : node.chestAfter.reward}
                  </div>
                </div>
              </button>
            </>
          )}

          {/* Conector tracejado até o próximo nó */}
          {nextNode && (
            <TrailConnector
              fromX={node.chestAfter ? node.offsetX * 0.4 : node.offsetX}
              toX={nextNode.offsetX}
              completed={done && isFloorDone(nextNode.floor)}
              active={done && nextNode.floor === activeFloor}
            />
          )}
        </div>
      );
    });

  const xpToSilver = Math.max(0, 540 - account.xpSemana);
  const promoPct = Math.min(100, Math.round((account.xpSemana / 540) * 100));

  return (
    <PlatformShell contentScroll={false}>
      {/* Toast de recompensa ao abrir Baú */}
      {chestToast && (
        <div className="jq-modal-in fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border-2 border-[#E5A93B] bg-[#20122E] px-5 py-3 text-sm font-extrabold text-[#FFE27A] shadow-2xl">
          <Gift className="h-5 w-5 text-[#E5A93B]" />
          <span>{chestToast}</span>
        </div>
      )}

      {/*
        Layout de scroll: em telas grandes (xl) só a coluna central da trilha rola;
        a lateral direita fica parada (e só rola sozinha se não couber na altura).
        Em telas menores (1 coluna) a página inteira rola normalmente.
      */}
      <div className="jq-scroll h-full overflow-y-auto xl:overflow-hidden">
      <div className="grid w-full grid-cols-1 gap-8 xl:h-full xl:grid-cols-[1fr_326px]">
        {/* COLUNA PRINCIPAL: TRILHA GUIADA EM BLOCOS DE 10 ANDARES */}
        <section className="jq-scroll space-y-8 pt-6 pb-16 xl:min-h-0 xl:overflow-y-auto xl:pr-3">
          {/* UNIDADE 1 — VERDE FLORESTA */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#5A8F49]/60 bg-[#264A2B] px-5 py-4 shadow-lg">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#8CE070]">
                ← FUNDAMENTOS • UNIDADE INICIAL (ANDARES 1 A 5)
              </div>
              <h2 className="font-display mt-0.5 text-2xl font-bold tracking-wide text-[#F4EFE6]">
                Declare variáveis e tipos primitivos
              </h2>
            </div>
            <Link
              href="/dicas"
              className="jq-btn-stone flex items-center gap-2 rounded-xl px-4 py-2 font-display text-sm font-bold uppercase tracking-wider"
            >
              <BookOpen className="h-4 w-4 text-[#E5A93B]" />
              <span>GUIA</span>
            </Link>
          </div>

          <div className="relative flex flex-col items-center">
            {renderNodeList(UNIT_1_NODES)}
          </div>

          {/* DIVISOR DE UNIDADE 2 */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#262134]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[#6C6877]">
              ESTRUTURAS CONDICIONAIS & LAÇOS (ANDARES 6 A 9)
            </span>
            <div className="h-px flex-1 bg-[#262134]" />
          </div>

          {/* UNIDADE 2 — ÂMBAR ESCURO */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E5A93B]/55 bg-[#5A3E18] px-5 py-4 shadow-lg">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#FFE27A]">
                ← DECISÕES & REPETIÇÃO • UNIDADE CONDICIONAL
              </div>
              <h2 className="font-display mt-0.5 text-2xl font-bold tracking-wide text-[#F4EFE6]">
                Tome decisões com if, else e laços de repetição
              </h2>
            </div>
            <Link
              href="/dicas"
              className="jq-btn-stone flex items-center gap-2 rounded-xl px-4 py-2 font-display text-sm font-bold uppercase tracking-wider"
            >
              <BookOpen className="h-4 w-4 text-[#E5A93B]" />
              <span>GUIA</span>
            </Link>
          </div>

          <div className="relative flex flex-col items-center">
            {renderNodeList(UNIT_2_NODES)}
          </div>

          {/* DIVISOR DO CHEFE */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-[#4A1112]" />
            <span className="font-display text-xs font-bold uppercase tracking-widest text-[#CA1C08]">
              DESAFIO FINAL DO BLOCO (ANDAR 10)
            </span>
            <div className="h-px flex-1 bg-[#4A1112]" />
          </div>

          {/* UNIDADE 3 — BANNER CARMESIM DO CHEFE */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#CA1C08]/70 bg-[#4A1112] px-5 py-4 shadow-lg">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF8A7A]">
                ← DESAFIO • BATALHA DO CHEFE (CHECKPOINT 11)
              </div>
              <h2 className="font-display mt-0.5 text-2xl font-bold tracking-wide text-[#F4EFE6]">
                Derrote o Dragão integrando Variáveis, Condicionais e Laços
              </h2>
            </div>
            <Link
              href="/dicas"
              className="jq-btn-stone flex items-center gap-2 rounded-xl px-4 py-2 font-display text-sm font-bold uppercase tracking-wider"
            >
              <BookOpen className="h-4 w-4 text-[#E5A93B]" />
              <span>GUIA</span>
            </Link>
          </div>

          <div className="flex flex-col items-center">
            {renderNodeList([
              {
                floor: 10,
                label: "CHEFE FINAL DO BLOCO",
                xp: 100,
                offsetX: 0,
                isBoss: true,
              },
            ])}
          </div>

          {/* CHECKPOINT 11 — CICLO 2 */}
          <div
            className={`rounded-2xl border-2 p-4 ${
              account.checkpointAtual >= 11
                ? "border-[#E5A93B] bg-[#20122E]"
                : "border-dashed border-[#6C6877]/45 bg-[#1B1118]/65"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <OctagonBadge
                  tone={account.checkpointAtual >= 11 ? "gold" : "stone"}
                  size={48}
                >
                  {account.checkpointAtual >= 11 ? (
                    <Sparkles className="h-5 w-5 text-[#E5A93B]" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </OctagonBadge>
                <div>
                  <div className="font-display text-lg font-bold uppercase tracking-wider text-[#F4EFE6]">
                    CHECKPOINT 11 • CICLO 2 (ARRAYS JAVA)
                  </div>
                  <p className="text-xs font-semibold text-[#B08A6E]">
                    {account.checkpointAtual >= 11
                      ? "Desbloqueado permanentemente! 3 vidas e 3 dicas restauradas."
                      : "Derrote o Chefe do Andar 10 para liberar o Checkpoint 11 permanentemente."}
                  </p>
                </div>
              </div>

              {account.checkpointAtual >= 11 && (
                <Link
                  href="/jogar?andar=11&direto=1"
                  className="jq-btn-crimson rounded-xl px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider"
                >
                  JOGAR ANDAR 11
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* COLUNA LATERAL DIREITA: 4 WIDGETS OFICIAIS (fixa, fora do scroll da trilha) */}
        <aside className="jq-scroll space-y-5 pb-6 xl:min-h-0 xl:overflow-y-auto xl:pt-6">
          {/* 1. Card Couro Costurado: Praticar Sem Limitações */}
          <div className="jq-leather-panel rounded-2xl p-2">
            <div className="jq-leather-stitch p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#8CE070]">
                    VIDAS INFINITAS ATIVAS
                  </div>
                  <h3 className="font-display mt-0.5 text-xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                    PRATICAR SEM LIMITAÇÕES
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#F4EFE6]/80">
                    Treine blocos de código livremente sem perder corações e domine a sintaxe.
                  </p>
                </div>
                <OctagonBadge tone="gold" size={44}>
                  <Dumbbell className="h-5 w-5" />
                </OctagonBadge>
              </div>
              <Link
                href="/praticar"
                className="jq-btn-crimson mt-4 flex w-full items-center justify-center rounded-xl py-2.5 font-display text-sm font-bold uppercase tracking-wider"
              >
                TREINAR AGORA
              </Link>
            </div>
          </div>

          {/* 2. Card Divisão Bronze */}
          <div className="jq-slot rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base font-bold uppercase tracking-wider text-[#F4EFE6]">
                DIVISÃO BRONZE
              </span>
              <Link
                href="/ranking"
                className="text-[11px] font-extrabold uppercase tracking-wider text-[#E5A93B] hover:underline"
              >
                VER RANKING
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <OctagonBadge tone="gold" size={46}>
                <Trophy className="h-5 w-5" />
              </OctagonBadge>
              <div>
                <div className="font-display text-lg font-bold uppercase text-[#E5A93B]">
                  SUA POSIÇÃO: #{userRankPosition}º LUGAR
                </div>
                <p className="text-xs text-[#B08A6E]">
                  Você já ganhou {account.xpSemana} XP esta semana (+{account.xpHoje} XP hoje).
                </p>
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#0C0810]">
              <div
                className="h-full rounded-full bg-[#E5A93B] transition-all"
                style={{ width: `${promoPct}%` }}
              />
            </div>
            <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B08A6E]">
              {xpToSilver > 0
                ? `FALTAM ${xpToSilver} XP PARA A ZONA DE PROMOÇÃO PRATA`
                : "VOCÊ ESTÁ NA ZONA DE PROMOÇÃO PRATA!"}
            </div>
          </div>

          {/* 3. Card Missões do Dia */}
          <div className="jq-slot rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-base font-bold uppercase tracking-wider text-[#F4EFE6]">
                MISSÕES DO DIA
              </span>
              <span className="text-[10px] font-bold uppercase text-[#6C6877]">
                ATUALIZAM 00H
              </span>
            </div>

            <div className="space-y-3">
              {account.missoes.map((m) => {
                const pct = Math.min(100, Math.round((m.atual / m.meta) * 100));
                return (
                  <div key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-[#F4EFE6]">
                        {m.id === "m-xp" ? (
                          <Zap className="h-3.5 w-3.5 text-[#5A8F49]" />
                        ) : m.id === "m-combo" ? (
                          <Shield className="h-3.5 w-3.5 text-[#E5A93B]" />
                        ) : (
                          <BookOpen className="h-3.5 w-3.5 text-[#5A8F49]" />
                        )}
                        {m.titulo}
                      </span>
                      <span
                        className={
                          m.atual >= m.meta ? "text-[#8CE070]" : "text-[#E5A93B]"
                        }
                      >
                        {m.atual} / {m.meta}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#0C0810]">
                      <div
                        className={`h-full rounded-full ${
                          m.cor === "emerald" ? "bg-[#5A8F49]" : "bg-[#E5A93B]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Mini Card do Herói com sprite animado ao vivo */}
          <div className="jq-slot rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 overflow-hidden rounded-xl border border-[#E5A93B]/45 bg-[#0C0810]">
                <PixelSpritePreview
                  kind="HERO"
                  weapon={account.armamentoAtual}
                  size={66}
                />
              </div>
              <div>
                <div className="font-display text-base font-bold uppercase tracking-wider text-[#F4EFE6]">
                  {account.apelido} • {account.armamentoAtual}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[#B08A6E]">
                  <span>MELHOR: {account.melhorTempoBloco}</span>
                  <span>•</span>
                  <span className="text-[#8CE070]">PRECISÃO: {accuracyPercent}%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Link
                href="/perfil"
                className="jq-btn-stone flex-1 rounded-xl py-2 text-center font-display text-xs font-bold uppercase tracking-wider"
              >
                PERFIL COMPLETO
              </Link>
              <Link
                href="/jogar"
                className="jq-btn-crimson flex items-center justify-center gap-1 rounded-xl px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider"
                title="Ir direto para a Arena 2.5D"
              >
                <Flame className="h-3.5 w-3.5" />
                <span>ARENA</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </PlatformShell>
  );
}
