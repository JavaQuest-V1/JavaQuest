"use client";

import { useCallback, useState } from "react";
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
  const { account, loginWithGoogle, loginWithGoogleToken, logout } = usePlayerAccount();

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

  /** Modo local (sem Client ID do Google): e-mail Gmail + nome. */
  const entrarComGoogleLocal = useCallback(
    async (nome: string, email: string, forcarNovaJornada = false) => {
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
    [loginWithGoogle, possuiJornadaSalva, router, validarCredenciaisLocais]
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
    entrarComGoogleLocal,
    entrarComTokenGoogle,
    sair,
  };
}
