"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlayerAccount } from "@platform/controllers/PlayerAccountContext";

/**
 * Ponto de entrada raiz (`/`):
 * garante que o fluxo comece sempre pelo começo (RF-01):
 * 1. Não autenticado -> `/login` (Conta Google OAuth 2.0)
 * 2. Primeiro acesso -> `/onboarding` (Apelido, Origem, Nível, Espada/Cajado)
 * 3. Jogador recorrente -> `/trilha` (Andar 1 ou último progresso salvo)
 */
export default function HomePage() {
  const router = useRouter();
  const { account, hydrated } = usePlayerAccount();

  useEffect(() => {
    if (!hydrated) return;
    if (!account.autenticado) {
      router.replace("/login");
    } else if (!account.onboardingConcluido) {
      router.replace("/onboarding");
    } else {
      router.replace("/trilha");
    }
  }, [account.autenticado, account.onboardingConcluido, hydrated, router]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#0C0810] font-display text-lg uppercase tracking-widest text-[#E5A93B]">
      Carregando JavaQuest...
    </main>
  );
}
