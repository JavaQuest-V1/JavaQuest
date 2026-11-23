"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Crown, RotateCcw } from "lucide-react";
import {
  OctagonBadge,
  StitchedLeatherPanel,
} from "@gameplay/components/ui/DesignSystemPrimitives";
import { usePlayerAccount } from "@platform/controllers/PlayerAccountContext";
import { useAutenticacaoController } from "@platform/controllers/useAutenticacaoController";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim();

/**
 * Tela Inicial de Login / Conta do Herói (`Tela login.png`, RF-01 / RF-05):
 * - Se `NEXT_PUBLIC_GOOGLE_CLIENT_ID` estiver configurado no `.env.local`,
 *   carrega o botão oficial Google OAuth 2.0 (Google Identity Services) e valida
 *   o ID Token no backend Java (`AutenticacaoService`).
 * - Sem Client ID configurado, exige um endereço `@gmail.com` válido (sem dados
 *   fictícios pré-preenchidos) para testes locais integrados ao backend Java.
 */
export function LoginView() {
  const router = useRouter();
  const { account } = usePlayerAccount();
  const {
    carregando: isLoading,
    erro: errorMsg,
    possuiJornadaSalva: hasSavedJourney,
    entrarComGoogleLocal,
    entrarComTokenGoogle,
  } = useAutenticacaoController();

  const [googleName, setGoogleName] = useState(account.nomeGoogle || "");
  const [googleEmail, setGoogleEmail] = useState(account.email || "");

  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  // Carrega Google Identity Services oficial quando NEXT_PUBLIC_GOOGLE_CLIENT_ID estiver preenchido
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === "undefined") return;

    const initGsi = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          void entrarComTokenGoogle(response.credential);
        },
      });
      googleBtnRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "signin_with",
        width: 340,
      });
    };

    if (window.google?.accounts?.id) {
      initGsi();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGsi;
    document.head.appendChild(script);
  }, [entrarComTokenGoogle]);

  const handleLocalGmailLogin = (forceNew = false) =>
    entrarComGoogleLocal(googleName, googleEmail, forceNew);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0C0810] px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Lado Esquerdo: Medalhão pendurado */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="pointer-events-none relative h-44 w-48">
            <div className="absolute -top-32 left-10 h-72 w-2.5 origin-bottom -rotate-[15deg] bg-[#6E5C3E]" />
            <div className="absolute -top-32 right-10 h-72 w-2.5 origin-bottom rotate-[15deg] bg-[#6E5C3E]" />
          </div>

          <div className="relative -mt-6 flex flex-col items-center">
            <div className="h-5 w-7 rounded-t-md bg-[#6C6877]" />
            <div className="jq-octagon -mt-1 flex h-44 w-44 items-center justify-center bg-[#6C6877] shadow-2xl">
              <div className="jq-octagon flex h-34 w-34 items-center justify-center bg-[#3C374A]">
                <OctagonBadge tone="stone" size={84}>
                  <Crown className="h-10 w-10 text-[#F4EFE6]" />
                </OctagonBadge>
              </div>
            </div>

            <div className="font-display mt-6 text-xl font-bold uppercase tracking-[0.28em] text-[#6C6877]">
              JAVA QUEST
            </div>
          </div>
        </div>

        {/* Lado Direito: Painel Couro Costurado `CONTA DO HERÓI` */}
        <StitchedLeatherPanel
          title="CONTA DO HERÓI"
          onClose={
            account.autenticado && account.onboardingConcluido
              ? () => router.push("/trilha")
              : undefined
          }
          closeLabel="Voltar para a trilha"
          innerClassName="space-y-5 p-7 pt-10 text-center"
        >
          <div>
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-[#F4EFE6]">
              {hasSavedJourney ? "CONTINUAR JORNADA" : "ENTRAR NO JAVAQUEST"}
            </h1>
            <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-[#B08A6E]">
              ACESSO COM CONTA GOOGLE (GMAIL) • SEM SENHAS LOCAIS
            </p>
          </div>

          {/* Botão Google OAuth 2.0 real quando NEXT_PUBLIC_GOOGLE_CLIENT_ID estiver configurado */}
          {GOOGLE_CLIENT_ID ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div ref={googleBtnRef} />
            </div>
          ) : (
            <>
              <div className="jq-slot grid grid-cols-1 gap-3 rounded-2xl p-4 text-left sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-[#B08A6E]">
                    Seu Nome
                  </label>
                  <input
                    type="text"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    placeholder="Ex.: João Silva"
                    className="w-full rounded-xl border border-[#6C6877]/45 bg-[#0C0810] px-3 py-2.5 text-sm font-semibold text-[#F4EFE6] outline-none focus:border-[#E5A93B]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-[#B08A6E]">
                    Seu Gmail
                  </label>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleLocalGmailLogin(false);
                    }}
                    placeholder="seunome@gmail.com"
                    className="w-full rounded-xl border border-[#6C6877]/45 bg-[#0C0810] px-3 py-2.5 text-sm font-semibold text-[#F4EFE6] outline-none focus:border-[#E5A93B]"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => void handleLocalGmailLogin(false)}
                className="jq-slot-selected flex w-full cursor-pointer items-center gap-4 rounded-2xl p-5 text-left transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                <OctagonBadge tone="gold" size={54}>
                  <span className="font-display text-2xl font-extrabold text-[#F4EFE6]">
                    G
                  </span>
                </OctagonBadge>
                <div>
                  <div className="font-display text-2xl font-bold uppercase tracking-wider text-[#E5A93B]">
                    {isLoading ? "AUTENTICANDO..." : "ENTRAR COM GOOGLE"}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#B08A6E]">
                    {hasSavedJourney
                      ? `RETOMAR NO ANDAR ${account.andarAtual}`
                      : "PRIMEIRO ACESSO • COMEÇA NO ANDAR 1"}
                  </div>
                </div>
              </button>

              <p className="text-[11px] text-[#B08A6E]/80">
                Modo de desenvolvimento local. Para ativar o popup oficial do Google, defina{" "}
                <code className="font-code text-[#E5A93B]">
                  NEXT_PUBLIC_GOOGLE_CLIENT_ID
                </code>{" "}
                em <code className="font-code">.env.local</code>.
              </p>
            </>
          )}

          {errorMsg && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#CA1C08] bg-[#4A1112]/85 px-4 py-2.5 text-xs font-bold text-[#FFD5CF]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {account.autenticado && account.onboardingConcluido && (
              <Link
                href="/trilha"
                className="jq-btn-stone inline-flex items-center justify-center rounded-xl px-6 py-2.5 font-display text-sm font-bold uppercase tracking-wider"
              >
                VOLTAR PARA A TRILHA
              </Link>
            )}

            {hasSavedJourney && !GOOGLE_CLIENT_ID && (
              <button
                type="button"
                onClick={() => void handleLocalGmailLogin(true)}
                className="jq-btn-stone inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wider text-[#FF8A7A]"
              >
                <RotateCcw className="h-4 w-4" />
                <span>NOVA CONTA DO ZERO</span>
              </button>
            )}
          </div>
        </StitchedLeatherPanel>
      </div>
    </main>
  );
}
