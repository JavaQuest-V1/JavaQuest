"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { metricasService } from "@services/metricasService";

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // RF-24: pausa automática após 5 minutos sem interação
const SYNC_INTERVAL_SECONDS = 30;

/**
 * Camada @controllers (RF-24 / RNF-02):
 * Controla o cronômetro ativo da sessão e do andar atual com pausa automática
 * após 5 minutos sem interação do usuário e sincronização periódica via @services.
 */
export function useSessionTimerController(email: string, active: boolean) {
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [floorSeconds, setFloorSeconds] = useState(0);
  const [isPausedByInactivity, setIsPausedByInactivity] = useState(false);

  const lastActivityAtRef = useRef<number>(Date.now());
  const pendingSyncDeltaRef = useRef<number>(0);
  const floorSecondsRef = useRef<number>(0);

  const registerActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now();
    setIsPausedByInactivity((wasPaused) => (wasPaused ? false : wasPaused));
  }, []);

  const resetFloorTimer = useCallback(() => {
    floorSecondsRef.current = 0;
    setFloorSeconds(0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let throttleTimer: number | null = null;
    const handlePointerOrKey = () => {
      if (throttleTimer !== null) return;
      registerActivity();
      throttleTimer = window.setTimeout(() => {
        throttleTimer = null;
      }, 600);
    };

    window.addEventListener("pointerdown", handlePointerOrKey, { passive: true });
    window.addEventListener("keydown", handlePointerOrKey, { passive: true });
    window.addEventListener("mousemove", handlePointerOrKey, { passive: true });
    window.addEventListener("touchstart", handlePointerOrKey, { passive: true });

    return () => {
      if (throttleTimer !== null) window.clearTimeout(throttleTimer);
      window.removeEventListener("pointerdown", handlePointerOrKey);
      window.removeEventListener("keydown", handlePointerOrKey);
      window.removeEventListener("mousemove", handlePointerOrKey);
      window.removeEventListener("touchstart", handlePointerOrKey);
    };
  }, [registerActivity]);

  useEffect(() => {
    if (!active) return;

    const interval = window.setInterval(() => {
      const idleMs = Date.now() - lastActivityAtRef.current;
      if (idleMs >= INACTIVITY_LIMIT_MS) {
        setIsPausedByInactivity(true);
        return;
      }

      setSessionSeconds((s) => s + 1);
      setFloorSeconds((f) => {
        const next = f + 1;
        floorSecondsRef.current = next;
        return next;
      });
      pendingSyncDeltaRef.current += 1;

      if (pendingSyncDeltaRef.current >= SYNC_INTERVAL_SECONDS) {
        const delta = pendingSyncDeltaRef.current;
        pendingSyncDeltaRef.current = 0;
        void metricasService
          .registrarTempoSessao({
            email,
            segundosSessaoDelta: delta,
            segundosNoAndarAtual: floorSecondsRef.current,
          })
          .catch(() => {
            // Silencioso em quedas momentâneas — RNF-21 mantém o estado local íntegro
          });
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [active, email]);

  return {
    sessionSeconds,
    floorSeconds,
    isPausedByInactivity,
    resetFloorTimer,
    registerActivity,
  };
}

export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
