"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  NivelExperiencia,
  ProgressoJogadorDTO,
  ResultadoTurnoDTO,
  TipoArmamento,
} from "@gameplay/types/gameplay";
import { callApi } from "@api/callApi";
import { apiClient } from "@api/httpClient";
import {
  accountService,
  DEFAULT_ACCOUNT_STATE,
} from "../services/accountService";
import { autenticacaoService } from "../services/autenticacaoService";
import { jogadorService } from "../services/jogadorService";
import { metricasDashboardService } from "../services/metricasDashboardService";
import {
  CanalAquisicao,
  PlayerAccountState,
  RankingEntry,
} from "../types/platform";

interface PlayerAccountContextValue {
  account: PlayerAccountState;
  hydrated: boolean;
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
  ranking: RankingEntry[];
  userRankPosition: number;
  accuracyPercent: number;
  conceptMastery: {
    variaveis: number;
    operadores: number;
    condicionais: number;
    lacos: number;
  };
  loginWithGoogle: (
    mode: "NOVO" | "RECORRENTE",
    email: string,
    nome: string
  ) => Promise<{ destino: "ONBOARDING" | "TRILHA"; erro?: string }>;
  loginWithGoogleToken: (
    googleIdToken: string
  ) => Promise<{ destino: "ONBOARDING" | "TRILHA"; erro?: string }>;
  completeOnboarding: (payload: {
    apelido: string;
    nivelExperiencia: NivelExperiencia;
    canalAquisicao: CanalAquisicao;
    armamentoAtual: TipoArmamento;
    pontoPartida: "ZERO" | "NIVELAMENTO";
  }) => Promise<ActionResult>;
  logout: () => Promise<void>;
  switchWeapon: (arma: TipoArmamento) => Promise<ActionResult>;
  refreshRanking: () => Promise<void>;
  /** Aplica dados vindos do backend (MySQL) sobre o cache local — RF-22 */
  syncFromServer: (patch: Partial<PlayerAccountState>) => void;
  markTopicStudied: (topicId: string) => void;
  claimTrailChest: (chestId: string, bonusXp: number) => boolean;
  recordTurnMistake: () => void;
  syncFloorVictory: (resultado: ResultadoTurnoDTO, isPracticeMode?: boolean) => void;
  syncCheckpointUnlocked: (
    checkpointFloor: number,
    snapshot: ProgressoJogadorDTO
  ) => void;
}

export interface ActionResult {
  ok: boolean;
  erro?: string;
}

const PlayerAccountContext = createContext<PlayerAccountContextValue | null>(null);

function decodeJwtPayload(token: string): { email?: string; name?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(json) as { email?: string; name?: string };
  } catch {
    return null;
  }
}

export function PlayerAccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<PlayerAccountState>(DEFAULT_ACCOUNT_STATE);
  const [serverRanking, setServerRanking] = useState<RankingEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const refreshRanking = useCallback(async () => {
    const res = await callApi(() => metricasDashboardService.listarRanking());
    if (res.ok && res.data) {
      setServerRanking(res.data);
    }
  }, []);

  useEffect(() => {
    const loaded = accountService.load();
    setAccount(loaded);
    setHydrated(true);
    if (loaded.autenticado && loaded.onboardingConcluido && !loaded.tutorialConcluido) {
      setIsTutorialOpen(true);
    }
    void refreshRanking();
  }, [refreshRanking]);

  const updateAccount = useCallback(
    (updater: (prev: PlayerAccountState) => PlayerAccountState) => {
      setAccount((prev) => {
        const next = updater(prev);
        accountService.save(next);
        return next;
      });
    },
    []
  );

  // RNF-10 / RF-05: JWT expirado ou inválido -> volta para o login
  useEffect(
    () =>
      apiClient.onUnauthorized(() => {
        setIsTutorialOpen(false);
        updateAccount((prev) => ({ ...prev, autenticado: false }));
      }),
    [updateAccount]
  );

  const syncFromServer = useCallback(
    (patch: Partial<PlayerAccountState>) => {
      updateAccount((prev) => ({ ...prev, ...patch }));
    },
    [updateAccount]
  );

  const openTutorial = useCallback(() => setIsTutorialOpen(true), []);

  const closeTutorial = useCallback(() => {
    setIsTutorialOpen(false);
    updateAccount((prev) =>
      prev.tutorialConcluido ? prev : { ...prev, tutorialConcluido: true }
    );
  }, [updateAccount]);

  const loginWithGoogle = useCallback(
    async (mode: "NOVO" | "RECORRENTE", email: string, nome: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = nome.trim();
      const isNew =
        mode === "NOVO" ||
        !account.onboardingConcluido ||
        account.email.toLowerCase() !== cleanEmail;

      const api = await callApi(() =>
        autenticacaoService.entrarComGoogle({
          email: cleanEmail,
          nome: cleanName,
          forceNew: isNew,
        })
      );
      if (!api.ok) return { destino: "ONBOARDING" as const, erro: api.erro };

      if (isNew || api.data?.primeiroAcesso === true) {
        const fresh = accountService.buildOnboardingReset(cleanEmail, cleanName);
        accountService.save(fresh);
        setAccount(fresh);
        void refreshRanking();
        return { destino: "ONBOARDING" as const };
      }

      updateAccount((prev) => ({
        ...prev,
        autenticado: true,
        email: cleanEmail,
        nomeGoogle: cleanName || prev.nomeGoogle,
      }));
      void refreshRanking();
      return { destino: "TRILHA" as const };
    },
    [account.email, account.onboardingConcluido, refreshRanking, updateAccount]
  );

  const loginWithGoogleToken = useCallback(
    async (
      googleIdToken: string
    ): Promise<{ destino: "ONBOARDING" | "TRILHA"; erro?: string }> => {
      const api = await callApi(() => autenticacaoService.entrarComGoogle({ googleIdToken }));
      if (!api.ok) return { destino: "ONBOARDING", erro: api.erro };
      const apiRes = api.data;
      const decoded = decodeJwtPayload(googleIdToken);

      const email = (apiRes?.email ?? decoded?.email ?? "").trim().toLowerCase();
      const nome = (apiRes?.nome ?? decoded?.name ?? "").trim();

      if (!email) {
        return {
          destino: "ONBOARDING",
          erro: "Não foi possível obter o e-mail da Conta Google.",
        };
      }

      const isNew =
        apiRes?.primeiroAcesso === true ||
        !account.onboardingConcluido ||
        account.email.toLowerCase() !== email;

      if (isNew) {
        const fresh = accountService.buildOnboardingReset(email, nome || email.split("@")[0]);
        accountService.save(fresh);
        setAccount(fresh);
        void refreshRanking();
        return { destino: "ONBOARDING" };
      }

      updateAccount((prev) => ({
        ...prev,
        autenticado: true,
        email,
        nomeGoogle: nome || prev.nomeGoogle,
      }));
      void refreshRanking();
      return { destino: "TRILHA" };
    },
    [account.email, account.onboardingConcluido, refreshRanking, updateAccount]
  );

  const completeOnboarding = useCallback(
    async (payload: {
      apelido: string;
      nivelExperiencia: NivelExperiencia;
      canalAquisicao: CanalAquisicao;
      armamentoAtual: TipoArmamento;
      pontoPartida: "ZERO" | "NIVELAMENTO";
    }): Promise<ActionResult> => {
      const api = await callApi(() =>
        jogadorService.registrarOnboarding({
          email: account.email,
          nome: account.nomeGoogle || payload.apelido,
          apelido: payload.apelido,
          nivelExperiencia: payload.nivelExperiencia,
          canalAquisicao: payload.canalAquisicao,
          armamentoAtual: payload.armamentoAtual,
        })
      );
      if (!api.ok) return { ok: false, erro: api.erro };

      updateAccount((prev) => accountService.applyOnboarding(prev, payload));
      setIsTutorialOpen(true);
      void refreshRanking();
      return { ok: true };
    },
    [account.email, account.nomeGoogle, refreshRanking, updateAccount]
  );

  const logout = useCallback(async () => {
    setIsTutorialOpen(false);
    updateAccount((prev) => ({
      ...prev,
      autenticado: false,
    }));
    await autenticacaoService.sair().catch(() => undefined);
  }, [updateAccount]);

  const switchWeapon = useCallback(
    async (arma: TipoArmamento): Promise<ActionResult> => {
      if (arma === account.armamentoAtual) return { ok: true };
      if (account.email) {
        // RF-08 / RNF-11: o backend decide se a troca é permitida (ex.: 409 em combate)
        const api = await callApi(() =>
          jogadorService.trocarArmamento({ email: account.email, armamento: arma })
        );
        if (!api.ok) return { ok: false, erro: api.erro };
      }
      updateAccount((prev) => ({
        ...prev,
        armamentoAtual: arma,
      }));
      return { ok: true };
    },
    [account.armamentoAtual, account.email, updateAccount]
  );

  const markTopicStudied = useCallback(
    (topicId: string) => {
      updateAccount((prev) => {
        const topicos = prev.topicosEstudados.includes(topicId)
          ? prev.topicosEstudados
          : [...prev.topicosEstudados, topicId];
        return {
          ...prev,
          topicosEstudados: topicos,
          missoes: prev.missoes.map((m) =>
            m.id === "m-dica" ? { ...m, atual: Math.min(m.meta, topicos.length) } : m
          ),
        };
      });
    },
    [updateAccount]
  );

  const claimTrailChest = useCallback(
    (chestId: string, bonusXp: number): boolean => {
      if (account.bausResgatados.includes(chestId)) return false;
      updateAccount((prev) => {
        if (prev.bausResgatados.includes(chestId)) return prev;
        return {
          ...prev,
          bausResgatados: [...prev.bausResgatados, chestId],
          xpTotal: prev.xpTotal + bonusXp,
          xpSemana: prev.xpSemana + bonusXp,
          xpHoje: prev.xpHoje + bonusXp,
          dicasAtuais: Math.min(3, prev.dicasAtuais + 1),
        };
      });
      return true;
    },
    [account.bausResgatados, updateAccount]
  );

  const recordTurnMistake = useCallback(() => {
    updateAccount((prev) => ({
      ...prev,
      totalTentativas: prev.totalTentativas + 1,
    }));
  }, [updateAccount]);

  const syncFloorVictory = useCallback(
    (resultado: ResultadoTurnoDTO, isPracticeMode = false) => {
      updateAccount((prev) => {
        const gained = isPracticeMode ? 15 : resultado.xpGanho || 25;
        const nextXpHoje = prev.xpHoje + gained;
        const noErrorBonus = resultado.vidasRestantes === 3 ? 1 : 0;
        const nextCombos = prev.combatesSemErroHoje + noErrorBonus;

        if (isPracticeMode) {
          return {
            ...prev,
            xpTotal: prev.xpTotal + gained,
            xpSemana: prev.xpSemana + gained,
            xpHoje: nextXpHoje,
            tempoEstudoMinutos: prev.tempoEstudoMinutos + 1,
            totalTentativas: prev.totalTentativas + 1,
            totalAcertos: prev.totalAcertos + 1,
            combatesSemErroHoje: nextCombos,
            missoes: prev.missoes.map((m) => {
              if (m.id === "m-xp") {
                return { ...m, atual: Math.min(m.meta, m.atual + gained) };
              }
              if (m.id === "m-combo") {
                return { ...m, atual: Math.min(m.meta, nextCombos) };
              }
              return m;
            }),
          };
        }

        const clearedFloor = Math.max(1, resultado.andarAtual - 1);
        const completed = prev.andaresConcluidos.includes(clearedFloor)
          ? prev.andaresConcluidos
          : [...prev.andaresConcluidos, clearedFloor].sort((a, b) => a - b);

        return {
          ...prev,
          andarAtual: Math.max(prev.andarAtual, resultado.andarAtual),
          checkpointAtual: Math.max(prev.checkpointAtual, resultado.checkpointAtual),
          andaresConcluidos: completed,
          vidasAtuais: resultado.vidasRestantes,
          dicasAtuais: resultado.dicasRestantes,
          xpTotal: prev.xpTotal + gained,
          xpSemana: prev.xpSemana + gained,
          xpHoje: nextXpHoje,
          tempoEstudoMinutos: prev.tempoEstudoMinutos + 2,
          totalTentativas: prev.totalTentativas + 1,
          totalAcertos: prev.totalAcertos + 1,
          combatesSemErroHoje: nextCombos,
          missoes: prev.missoes.map((m) => {
            if (m.id === "m-xp") {
              return { ...m, atual: Math.min(m.meta, m.atual + gained) };
            }
            if (m.id === "m-combo") {
              return { ...m, atual: Math.min(m.meta, nextCombos) };
            }
            return m;
          }),
        };
      });
      void refreshRanking();
    },
    [refreshRanking, updateAccount]
  );

  const syncCheckpointUnlocked = useCallback(
    (checkpointFloor: number, snapshot: ProgressoJogadorDTO) => {
      updateAccount((prev) => ({
        ...prev,
        checkpointAtual: Math.max(prev.checkpointAtual, checkpointFloor),
        andarAtual: Math.max(prev.andarAtual, checkpointFloor),
        armamentoAtual: snapshot.armamentoAtual,
        vidasAtuais: 3,
        dicasAtuais: 3,
      }));
      void refreshRanking();
    },
    [refreshRanking, updateAccount]
  );

  // Ranking real sem bots fictícios (combina jogadores reais da API Java + jogador atual)
  const ranking = useMemo<RankingEntry[]>(() => {
    const emailLower = account.email.toLowerCase();
    const others = serverRanking.filter(
      (r) => r.id.toLowerCase() !== emailLower
    );

    const selfEntry: RankingEntry = {
      id: emailLower || "current-user",
      apelido: account.apelido ? `VOCÊ (${account.apelido})` : "VOCÊ",
      arma: account.armamentoAtual,
      xpSemana: account.xpSemana,
      isCurrentUser: true,
    };

    return [...others, selfEntry].sort((a, b) => b.xpSemana - a.xpSemana);
  }, [account.apelido, account.armamentoAtual, account.email, account.xpSemana, serverRanking]);

  const userRankPosition = useMemo(
    () => Math.max(1, ranking.findIndex((r) => r.isCurrentUser) + 1),
    [ranking]
  );

  const accuracyPercent = useMemo(() => {
    if (account.totalTentativas <= 0) return 100;
    return Math.round((account.totalAcertos / account.totalTentativas) * 100);
  }, [account.totalAcertos, account.totalTentativas]);

  const conceptMastery = useMemo(() => {
    const done = new Set(account.andaresConcluidos);
    const pct = (floors: number[]) => {
      const hits = floors.filter((f) => done.has(f)).length;
      return Math.min(100, Math.round((hits / floors.length) * 100));
    };
    return {
      variaveis: pct([1, 2, 3]),
      operadores: pct([4, 5]),
      condicionais: pct([6, 7]),
      lacos: pct([8, 9, 10]),
    };
  }, [account.andaresConcluidos]);

  return (
    <PlayerAccountContext.Provider
      value={{
        account,
        hydrated,
        isTutorialOpen,
        openTutorial,
        closeTutorial,
        ranking,
        userRankPosition,
        accuracyPercent,
        conceptMastery,
        loginWithGoogle,
        loginWithGoogleToken,
        completeOnboarding,
        logout,
        switchWeapon,
        refreshRanking,
        syncFromServer,
        markTopicStudied,
        claimTrailChest,
        recordTurnMistake,
        syncFloorVictory,
        syncCheckpointUnlocked,
      }}
    >
      {children}
    </PlayerAccountContext.Provider>
  );
}

export function usePlayerAccount() {
  const ctx = useContext(PlayerAccountContext);
  if (!ctx) {
    throw new Error("usePlayerAccount deve ser usado dentro de PlayerAccountProvider");
  }
  return ctx;
}
