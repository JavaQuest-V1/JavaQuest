"use client";

import { useCallback, useEffect, useState } from "react";
import { callApi } from "@api/callApi";
import { metricasDashboardService } from "../services/metricasDashboardService";
import { DashboardJogadorDTO } from "../types/api";
import { PlayerAccountState } from "../types/platform";
import { usePlayerAccount } from "./PlayerAccountContext";

export type FonteDashboard = "SERVIDOR" | "LOCAL";

function dashboardParaConta(dto: DashboardJogadorDTO): Partial<PlayerAccountState> {
  return {
    apelido: dto.apelido,
    armamentoAtual: dto.armamentoAtual,
    nivelExperiencia: dto.nivelExperiencia,
    andarAtual: dto.andarAtual,
    checkpointAtual: dto.checkpointAtual,
    xpTotal: dto.xpTotal,
    xpSemana: dto.xpSemana,
    streakDias: dto.streakDias,
    recordeStreakDias: dto.recordeStreakDias,
    tempoEstudoMinutos: dto.tempoEstudoMinutos,
    totalTentativas: dto.totalTentativas,
    totalAcertos: dto.totalAcertos,
    andaresConcluidos: dto.andaresConcluidos,
  };
}

/**
 * @controller — Métricas (espelha `MetricasController` do Spring Boot).
 * RF-22 (dashboard), RF-23 (streak), RF-24 (tempo de estudo) e ranking.
 *
 * Ao montar, busca o dashboard no backend (`obterDashboard`). Se a rota ainda
 * não existir ou o servidor estiver fora, segue com os dados locais.
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

  const obterDashboard = useCallback(async () => {
    if (!email) return;
    setCarregando(true);
    const [dashboard] = await Promise.all([
      callApi(() => metricasDashboardService.obterDashboard(email)),
      refreshRanking(),
    ]);
    if (dashboard.ok && dashboard.data) {
      syncFromServer(dashboardParaConta(dashboard.data));
      setFonte("SERVIDOR");
    } else {
      setFonte("LOCAL");
    }
    setCarregando(false);
  }, [email, refreshRanking, syncFromServer]);

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
