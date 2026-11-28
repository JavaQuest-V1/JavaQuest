"use client";

import { useCallback, useEffect, useState } from "react";
import { callApi } from "@api/callApi";
import { metricasDashboardService } from "../services/metricasDashboardService";
import { accountService } from "../services/accountService";
import { usePlayerAccount } from "./PlayerAccountContext";

export type FonteDashboard = "SERVIDOR" | "LOCAL";

/**
 * @controller — Métricas (espelha `MetricasController` do Spring Boot).
 * RF-22 (dashboard), RF-23 (streak), RF-24 (tempo de estudo) e ranking.
 *
 * Ao montar, busca `GET /api/v1/metricas/dashboard` (andar, checkpoint, streak,
 * tempo de estudo, vitórias). Se o servidor estiver fora, segue com o cache local.
 * XP e ranking ainda são só do front (próxima atualização no back).
 */
export function useMetricasController({ carregarAoMontar = true } = {}) {
  const {
    account,
    ranking,
    userRankPosition,
    accuracyPercent,
    conceptMastery,
    refreshRanking,
    syncFromServer,
  } = usePlayerAccount();

  const [carregando, setCarregando] = useState(false);
  const [fonte, setFonte] = useState<FonteDashboard>("LOCAL");

  const email = account.email;
  const podeConsultar = account.autenticado && account.onboardingConcluido;

  const obterDashboard = useCallback(async () => {
    if (!email || !podeConsultar) return;
    setCarregando(true);
    const [dashboard] = await Promise.all([
      callApi(() => metricasDashboardService.obterDashboard()),
      refreshRanking(),
    ]);
    if (dashboard.ok && dashboard.data) {
      const dto = dashboard.data;
      syncFromServer((prev) => accountService.fromDashboard(prev, dto));
      setFonte("SERVIDOR");
    } else {
      setFonte("LOCAL");
    }
    setCarregando(false);
  }, [email, podeConsultar, refreshRanking, syncFromServer]);

  useEffect(() => {
    if (carregarAoMontar) void obterDashboard();
  }, [carregarAoMontar, obterDashboard]);

  return {
    carregando,
    fonte,
    obterDashboard,
    ranking,
    posicaoRanking: userRankPosition,
    precisao: accuracyPercent,
    dominioConceitos: conceptMastery,
    streakDias: account.streakDias,
    tempoEstudoMinutos: account.tempoEstudoMinutos,
  };
}
