"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Crown,
  Dumbbell,
  Flame,
  Heart,
  HelpCircle,
  Home,
  Shield,
  Star,
  Sword,
  Trophy,
  User,
  Wand2,
} from "lucide-react";
import { ARMAMENTOS_CONFIG } from "@gameplay/types/gameplay";
import { OctagonBadge } from "@gameplay/components/ui/DesignSystemPrimitives";
import { usePlayerAccount } from "@platform/controllers/PlayerAccountContext";
import { TutorialModal } from "./TutorialModal";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/trilha", label: "TRILHA GUIADA", icon: Home },
  { href: "/dicas", label: "DICAS DE JAVA", icon: BookOpen },
  { href: "/praticar", label: "PRATICAR LIVRE", icon: Dumbbell },
  { href: "/ranking", label: "PONTUAÇÃO & LIGAS", icon: Trophy },
  { href: "/perfil", label: "PERFIL DO HERÓI", icon: User },
  { href: "/login", label: "SALVAR CONTA", icon: Shield },
];

/**
 * Shell compartilhado da UI do Usuário (Sidebar esquerda + Barra Superior + Tutorial Inicial).
 * Aplica guarda de sessão (RF-05) redirecionando rotas internas para `/login` após logout.
 *
 * Layout de altura fixa (100dvh): a janela não rola. Sidebar e barra superior ficam
 * sempre visíveis e apenas a área de conteúdo rola.
 * - `contentScroll` (padrão): a área de conteúdo inteira rola.
 * - `contentScroll={false}`: a página controla o próprio scroll (ex.: Trilha, onde
 *   só a coluna central rola e a lateral direita fica parada).
 */
export function PlatformShell({
  pageTitle,
  contentScroll = true,
  children,
}: {
  pageTitle?: string;
  contentScroll?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    account,
    hydrated,
    isTutorialOpen,
    openTutorial,
    closeTutorial,
    switchWeapon,
  } = usePlayerAccount();

  // RF-01 / RF-05: rotas internas exigem autenticação Google e conclusão do onboarding
  useEffect(() => {
    if (!hydrated) return;
    if (!account.autenticado) {
      router.replace("/login");
    } else if (!account.onboardingConcluido) {
      router.replace("/onboarding");
    }
  }, [account.autenticado, account.onboardingConcluido, hydrated, router]);

  const weaponCfg = ARMAMENTOS_CONFIG[account.armamentoAtual];

  if (!hydrated || !account.autenticado || !account.onboardingConcluido) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0C0810] font-display text-lg uppercase tracking-widest text-[#E5A93B]">
        Preparando sua jornada no JavaQuest...
      </div>
    );
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#0C0810] text-[#F4EFE6]">
      {/* Sidebar Esquerda Fixa (não acompanha o scroll do conteúdo) */}
      <aside className="jq-scroll flex h-full w-[236px] shrink-0 flex-col justify-between overflow-y-auto border-r border-[#262134] bg-[#0C0810] px-4 py-5">
        <div>
          {/* Logo JAVAQUEST */}
          <Link href="/trilha" className="mb-8 flex items-center gap-3 px-2">
            <OctagonBadge tone="gold" size={38}>
              <Crown className="h-4 w-4 text-[#F4EFE6]" />
            </OctagonBadge>
            <span className="font-display text-2xl font-bold uppercase tracking-wider text-[#F4EFE6]">
              JAVAQUEST
            </span>
          </Link>

          {/* Menu Principal */}
          <nav className="flex flex-col gap-2" aria-label="Navegação Principal">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/trilha" && pathname === "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-full border px-3 py-2 transition-all ${
                    isActive
                      ? "border-[#7D4362] bg-[#291522] text-[#E5A93B] shadow-md"
                      : "border-transparent text-[#F4EFE6]/90 hover:bg-[#1B1118]"
                  }`}
                >
                  <OctagonBadge tone={isActive ? "gold" : "stone"} size={30}>
                    <Icon className="h-3.5 w-3.5" />
                  </OctagonBadge>
                  <span className="font-display text-[15px] font-bold uppercase tracking-wider">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Arma ativa + Botão Tutorial + Onboarding */}
        <div className="space-y-2.5 border-t border-[#262134] pt-4">
          <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-[#B08A6E]">
            {account.armamentoAtual === "ESPADA" ? (
              <Sword className="h-3.5 w-3.5 text-[#E5A93B]" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 text-[#7DF9FF]" />
            )}
            <span>{weaponCfg.nome.toUpperCase()}</span>
          </div>

          <button
            type="button"
            onClick={openTutorial}
            className="jq-btn-stone flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2 font-display text-xs font-bold uppercase tracking-wider text-[#E5A93B]"
          >
            <HelpCircle className="h-4 w-4" />
            <span>VER TUTORIAL</span>
          </button>

          <Link
            href="/onboarding"
            className="block px-2 text-center text-[11px] font-semibold text-[#6C6877] transition-colors hover:text-[#E5A93B]"
          >
            Refazer onboarding →
          </Link>
        </div>
      </aside>

      {/* Conteúdo Principal + Barra de Status Superior */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="z-20 flex shrink-0 items-center justify-between gap-4 border-b border-[#1B1118] bg-[#0C0810] px-8 py-4">
          <div>
            {pageTitle ? (
              <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                {pageTitle}
              </h1>
            ) : (
              <div className="text-xs font-bold uppercase tracking-widest text-[#B08A6E]">
                Checkpoint Ativo: Andar {account.checkpointAtual}
              </div>
            )}
          </div>

          {/* Barra de status idêntica às telas oficiais + botão de Tutorial */}
          <div className="flex items-center gap-5 text-sm font-extrabold">
            <div className="flex items-center gap-1.5 text-[#F4EFE6]">
              <BookOpen className="h-4 w-4 text-[#5A8F49]" />
              <span className="font-display tracking-wider">JAVA</span>
            </div>

            <div
              className="flex items-center gap-1 text-[#E5A93B]"
              title="Dias consecutivos (RF-23)"
            >
              <Flame className="h-4 w-4 fill-[#E5A93B]" />
              <span>{account.streakDias}</span>
            </div>

            <div
              className="flex items-center gap-1 text-[#8CE070]"
              title="Pontuação total"
            >
              <Star className="h-4 w-4 fill-[#5A8F49] text-[#5A8F49]" />
              <span>{account.xpTotal.toLocaleString("pt-BR")} XP</span>
            </div>

            <div
              className="flex items-center gap-1 text-[#FF5E4D]"
              title="Vidas no ciclo atual (RF-13)"
            >
              <Heart className="h-4 w-4 fill-[#CA1C08] text-[#CA1C08]" />
              <span>{account.vidasAtuais}/3</span>
            </div>

            <button
              type="button"
              onClick={openTutorial}
              title="Abrir tutorial inicial interativo"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#6C6877]/50 bg-[#1B1118] text-[#E5A93B] transition-colors hover:border-[#E5A93B]"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </header>

        {contentScroll ? (
          <div className="jq-scroll min-h-0 flex-1 overflow-y-auto px-8 py-6">{children}</div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden px-8">{children}</div>
        )}
      </div>

      {/* Modal do Tutorial Inicial Interativo */}
      <TutorialModal
        isOpen={isTutorialOpen}
        activeWeapon={account.armamentoAtual}
        onSelectWeapon={switchWeapon}
        onClose={closeTutorial}
      />
    </div>
  );
}
