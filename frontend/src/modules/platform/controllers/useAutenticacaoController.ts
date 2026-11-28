"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "@api/httpClient";
import { autenticacaoService } from "../services/autenticacaoService";
import { useRouter } from "next/navigation";
import { usePlayerAccount } from "./PlayerAccountContext";

const GMAIL_REGEX = /^[a-z0-9._%+-]+@gmail\.com$/i;

type Destino = "ONBOARDING" | "TRILHA";

const ROTA_DESTINO: Record<Destino, string> = {
  ONBOARDING: "/onboarding",
  TRILHA: "/trilha",
};

/**
 * @controller — Autenticação (espelha `AutenticacaoController` do Spring Boot).
 * RF-01 (login Google OAuth 2.0), RF-05 (logout), RNF-10 (JWT).
 *
 * Cuida do estado da tela (carregando / erro), valida a entrada e decide
 * para onde navegar. As chamadas HTTP ficam no `autenticacaoService`.
 */
export function useAutenticacaoController() {
  const router = useRouter();
  const { account, loginWithGoogle, loginWithGoogleToken, loginWithSupabaseSession, logout } =
    usePlayerAccount();
  const modoBackend = apiClient.isApiMode();

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const possuiJornadaSalva = account.onboardingConcluido && Boolean(account.email);

  const validarCredenciaisLocais = useCallback((nome: string, email: string): string | null => {
    if (!nome.trim()) return "Informe seu nome para continuar.";
    if (!GMAIL_REGEX.test(email.trim())) {
      return "Informe um e-mail Gmail válido (ex.: seunome@gmail.com).";
    }
    return null;
  }, []);

  // Volta do redirect do Google (Supabase Auth): sincroniza a sessão com o backend
  const sincronizacaoIniciada = useRef(false);
  useEffect(() => {
    if (!modoBackend || sincronizacaoIniciada.current) return;
    sincronizacaoIniciada.current = true;
    void (async () => {
      if (!(await autenticacaoService.possuiSessaoAtiva())) return;
      setCarregando(true);
      const res = await loginWithSupabaseSession();
      setCarregando(false);
      if (res.erro) {
        setErro(res.erro);
        return;
      }
      router.replace(ROTA_DESTINO[res.destino]);
    })();
  }, [loginWithSupabaseSession, modoBackend, router]);

  /** Com backend: OAuth Google do Supabase (redirect). Sem backend: e-mail Gmail + nome. */
  const entrarComGoogleLocal = useCallback(
    async (nome: string, email: string, forcarNovaJornada = false) => {
      if (modoBackend) {
        setErro(null);
        setCarregando(true);
        try {
          await autenticacaoService.entrarComGoogle("/login");
        } catch (err) {
          setCarregando(false);
          setErro(err instanceof Error ? err.message : "Falha ao abrir o login do Google.");
        }
        return;
      }

      const falha = validarCredenciaisLocais(nome, email);
      if (falha) {
        setErro(falha);
        return;
      }

      setErro(null);
      setCarregando(true);
      const res = await loginWithGoogle(
        forcarNovaJornada || !possuiJornadaSalva ? "NOVO" : "RECORRENTE",
        email.trim().toLowerCase(),
        nome.trim()
      );
      setCarregando(false);

      if (res.erro) {
        setErro(res.erro);
        return;
      }
      router.push(ROTA_DESTINO[res.destino]);
    },
    [loginWithGoogle, modoBackend, possuiJornadaSalva, router, validarCredenciaisLocais]
  );

  /** Fluxo oficial: ID Token devolvido pelo botão do Google Identity Services. */
  const entrarComTokenGoogle = useCallback(
    async (credential: string | undefined) => {
      if (!credential) {
        setErro("Autenticação Google cancelada.");
        return;
      }

      setErro(null);
      setCarregando(true);
      const res = await loginWithGoogleToken(credential);
      setCarregando(false);

      if (res.erro) {
        setErro(res.erro);
        return;
      }
      router.push(ROTA_DESTINO[res.destino]);
    },
    [loginWithGoogleToken, router]
  );

  /** RF-05: invalida o JWT e bloqueia as rotas internas até novo login. */
  const sair = useCallback(async () => {
    setCarregando(true);
    await logout();
    setCarregando(false);
    router.replace("/login");
  }, [logout, router]);

  return {
    carregando,
    erro,
    setErro,
    possuiJornadaSalva,
    /** true quando o login usa o Google via Supabase Auth (backend ativo). */
    modoBackend,
    entrarComGoogleLocal,
    entrarComTokenGoogle,
    sair,
  };
}
