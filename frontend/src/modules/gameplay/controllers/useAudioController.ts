"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Camada @controllers (RNF-02 / RNF-17):
 * Sintetizador Web Audio API leve e sem dependências externas para feedback
 * sonoro imediato de combate, blocos, dicas, vitória, checkpoint e derrota.
 */
export function useAudioController() {
  const [isMuted, setIsMuted] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureContext = useCallback((): AudioContext | null => {
    if (isMuted || typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;

    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, [isMuted]);

  const playTone = useCallback(
    (
      freq: number,
      duration: number,
      type: OscillatorType = "triangle",
      gainPeak = 0.14,
      delay = 0,
      endFreq?: number
    ) => {
      const ctx = ensureContext();
      if (!ctx) return;

      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (endFreq !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
      }

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(gainPeak, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration + 0.02);
    },
    [ensureContext]
  );

  const playNoiseBurst = useCallback(
    (duration: number, gainPeak = 0.12, delay = 0, highpassHz = 900) => {
      const ctx = ensureContext();
      if (!ctx) return;

      const sampleCount = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = highpassHz;

      const gain = ctx.createGain();
      const start = ctx.currentTime + delay;
      gain.gain.setValueAtTime(gainPeak, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(start);
      source.stop(start + duration + 0.02);
    },
    [ensureContext]
  );

  const playBlockSnap = useCallback(() => {
    playTone(520, 0.07, "square", 0.06, 0, 740);
  }, [playTone]);

  const playBlockRemove = useCallback(() => {
    playTone(380, 0.07, "triangle", 0.06, 0, 240);
  }, [playTone]);

  const playSpellTelegraph = useCallback(() => {
    playTone(330, 0.16, "sine", 0.08, 0, 440);
    playTone(494, 0.22, "triangle", 0.07, 0.09, 659);
  }, [playTone]);

  const playSwordAttack = useCallback(() => {
    // Dash + corte metálico + impacto pesado
    playNoiseBurst(0.14, 0.14, 0.12, 1600);
    playTone(620, 0.13, "sawtooth", 0.09, 0.12, 140);
    playTone(130, 0.22, "square", 0.14, 0.24, 55);
  }, [playNoiseBurst, playTone]);

  const playStaffAttack = useCallback(() => {
    // Carga arcana + disparo elemental + explosão cristalina
    playTone(420, 0.18, "sine", 0.09, 0, 980);
    playTone(740, 0.24, "triangle", 0.1, 0.16, 360);
    playNoiseBurst(0.16, 0.1, 0.36, 1200);
    playTone(880, 0.18, "sine", 0.08, 0.36, 520);
  }, [playNoiseBurst, playTone]);

  const playEnemyCounter = useCallback(() => {
    // Contra-ataque sombrio + quebra de coração
    playTone(210, 0.22, "sawtooth", 0.13, 0, 72);
    playNoiseBurst(0.18, 0.13, 0.12, 500);
    playTone(160, 0.26, "square", 0.1, 0.2, 65);
  }, [playNoiseBurst, playTone]);

  const playHintChime = useCallback(() => {
    playTone(587.33, 0.18, "sine", 0.09, 0);
    playTone(880, 0.25, "triangle", 0.08, 0.09);
  }, [playTone]);

  const playFloorVictory = useCallback(() => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      playTone(n, 0.18, "triangle", 0.1, idx * 0.09);
    });
  }, [playTone]);

  const playCheckpointUnlock = useCallback(() => {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((n, idx) => {
      playTone(n, 0.32, "triangle", 0.11, idx * 0.085);
    });
  }, [playTone]);

  const playDefeat = useCallback(() => {
    const notes = [349.23, 311.13, 277.18, 220];
    notes.forEach((n, idx) => {
      playTone(n, 0.26, "sawtooth", 0.09, idx * 0.14);
    });
  }, [playTone]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return {
    isMuted,
    toggleMute,
    playBlockSnap,
    playBlockRemove,
    playSpellTelegraph,
    playSwordAttack,
    playStaffAttack,
    playEnemyCounter,
    playHintChime,
    playFloorVictory,
    playCheckpointUnlock,
    playDefeat,
  };
}
