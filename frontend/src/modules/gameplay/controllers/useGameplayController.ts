"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gameplayApiClient } from "@services/apiClient";
import { checkpointService } from "@services/checkpointService";
import { combateService } from "@services/combateService";
import { metricasService } from "@services/metricasService";
import { vidasDicasService } from "@services/vidasDicasService";
import {
  ArenaAnimationEvent,
  BlocoCodigo,
  CategoriaErro,
  ConnectionStatus,
  DesafioAndar,
  DicaPedagogica,
  GameplayPhase,
  GameplayScreenProps,
  ProgressoJogadorDTO,
  ResultadoTurnoDTO,
  TipoArmamento,
} from "../types/gameplay";
import { useAudioController } from "./useAudioController";
import { useSessionTimerController } from "./useSessionTimerController";

/**
 * Camada @controllers (RNF-02):
 * Orquestra estado do combate em turnos, painel lateral retrátil, montagem de
 * blocos Java (direto na arena, sem prévia das palavras), animações 2.5D,
 * dicas pedagógicas, checkpoints (11, 21, 31...), trava de arma (RF-08),
 * proteção beforeunload (RNF-18) e áudio reativo (RNF-17).
 */
export function useGameplayController(props: GameplayScreenProps) {
  const playerEmail = props.playerEmail ?? "";
  const playerNickname = props.playerNickname ?? "HEROI";
  const initialFloor = props.initialFloor ?? 1;
  const initialCheckpoint = props.initialCheckpoint ?? 1;
  const initialWeapon = props.initialWeapon ?? "ESPADA";
  const initialXp = props.initialXp ?? 0;
  const initialStreak = props.initialStreak ?? 1;

  const audio = useAudioController();

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("SANDBOX");
  const [progresso, setProgresso] = useState<ProgressoJogadorDTO>({
    email: playerEmail,
    apelido: playerNickname,
    nivelExperiencia: "INICIANTE",
    armamentoAtual: initialWeapon,
    andarAtual: initialFloor,
    checkpointAtual: initialCheckpoint,
    vidasRestantes: 3,
    dicasRestantes: 3,
    andarEmAndamento: false,
    xpTotal: initialXp,
    streakDias: initialStreak,
    andaresConcluidosNoCiclo: [],
    vidasGastasNoCiclo: 0,
    dicasUsadasNoCiclo: 0,
  });

  const [phase, setPhase] = useState<GameplayPhase>(
    props.skipPreCombatModal ? "ASSEMBLING" : "PRE_COMBAT"
  );
  const [desafio, setDesafio] = useState<DesafioAndar | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ResultadoTurnoDTO | null>(null);
  const [lastErrorCategory, setLastErrorCategory] = useState<CategoriaErro | null>(null);
  const [consoleLog, setConsoleLog] = useState<{
    tone: "neutral" | "success" | "error";
    text: string;
  }>({
    tone: "neutral",
    text: "",
  });

  const [activeHint, setActiveHint] = useState<DicaPedagogica | null>(null);
  const [isHintModalOpen, setIsHintModalOpen] = useState<boolean>(false);
  const [heartBreakPulse, setHeartBreakPulse] = useState<number>(0);

  const [arenaEvent, setArenaEvent] = useState<ArenaAnimationEvent>({
    id: 1,
    type: "IDLE",
  });

  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);
  const [mobileNoticeDismissed, setMobileNoticeDismissed] = useState<boolean>(false);

  const animCounterRef = useRef<number>(1);
  const pendingTimeoutsRef = useRef<number[]>([]);
  const initializedRef = useRef<boolean>(false);

  const timer = useSessionTimerController(playerEmail, phase === "ASSEMBLING");

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    pendingTimeoutsRef.current.push(id);
  }, []);

  const clearScheduledTimeouts = useCallback(() => {
    for (const id of pendingTimeoutsRef.current) {
      window.clearTimeout(id);
    }
    pendingTimeoutsRef.current = [];
  }, []);

  const emitArenaEvent = useCallback(
    (type: ArenaAnimationEvent["type"], extra?: Partial<ArenaAnimationEvent>) => {
      animCounterRef.current += 1;
      setArenaEvent({
        id: animCounterRef.current,
        type,
        ...extra,
      });
    },
    []
  );

  useEffect(() => {
    gameplayApiClient.configure({
      baseUrl: props.apiBaseUrl,
      authToken: props.authToken,
    });
    return gameplayApiClient.subscribeStatus(setConnectionStatus);
  }, [props.apiBaseUrl, props.authToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => setIsMobileViewport(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (progresso.andarEmAndamento) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [progresso.andarEmAndamento]);

  useEffect(() => {
    return () => clearScheduledTimeouts();
  }, [clearScheduledTimeouts]);

  const loadFloor = useCallback(
    async (numeroAndar: number, evitarVariacaoAnterior = true) => {
      clearScheduledTimeouts();
      setIsSubmitting(false);
      setSelectedBlockIds([]);
      setLastErrorCategory(null);
      setActiveHint(null);
      setIsHintModalOpen(false);
      timer.resetFloorTimer();

      const { desafio: novoDesafio, progresso: novoProgresso } =
        await combateService.iniciarAndar(
          playerEmail,
          numeroAndar,
          evitarVariacaoAnterior
        );

      setDesafio(novoDesafio);
      setProgresso(novoProgresso);
      setPhase("ASSEMBLING");
      setIsDrawerOpen(true);
      setConsoleLog({ tone: "neutral", text: "" });

      emitArenaEvent("SPELL_TELEGRAPH");
      scheduleTimeout(() => emitArenaEvent("IDLE"), 350);
    },
    [clearScheduledTimeouts, emitArenaEvent, playerEmail, scheduleTimeout, timer]
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    void (async () => {
      const initial = await combateService.inicializarSessao({
        email: playerEmail,
        apelido: playerNickname,
        andarInicial: initialFloor,
        checkpointInicial: initialCheckpoint,
        armamentoInicial: initialWeapon,
        xpInicial: initialXp,
        streakInicial: initialStreak,
        forceReset: true,
      });
      setProgresso(initial);
      if (props.skipPreCombatModal) {
        await loadFloor(initial.andarAtual, false);
      }
    })();
  }, [
    initialCheckpoint,
    initialFloor,
    initialStreak,
    initialWeapon,
    initialXp,
    loadFloor,
    playerEmail,
    playerNickname,
    props.skipPreCombatModal,
  ]);

  const startBattleFromPreCombat = useCallback(
    async (customFloor?: number) => {
      const targetFloor = customFloor ?? progresso.andarAtual;
      await loadFloor(targetFloor, false);
    },
    [loadFloor, progresso.andarAtual]
  );

  const selectedBlocks = useMemo<BlocoCodigo[]>(() => {
    if (!desafio) return [];
    const byId = new Map(desafio.blocosEmbaralhados.map((b) => [b.id, b]));
    return selectedBlockIds
      .map((id) => byId.get(id))
      .filter((b): b is BlocoCodigo => Boolean(b));
  }, [desafio, selectedBlockIds]);

  const availableBlocks = useMemo<BlocoCodigo[]>(() => {
    if (!desafio) return [];
    const chosen = new Set(selectedBlockIds);
    return desafio.blocosEmbaralhados.filter((b) => !chosen.has(b.id));
  }, [desafio, selectedBlockIds]);

  const addBlock = useCallback(
    (blockId: string) => {
      if (phase !== "ASSEMBLING" || isSubmitting) return;
      setSelectedBlockIds((prev) => (prev.includes(blockId) ? prev : [...prev, blockId]));
      audio.playBlockSnap();
    },
    [audio, isSubmitting, phase]
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      if (phase !== "ASSEMBLING" || isSubmitting) return;
      setSelectedBlockIds((prev) => prev.filter((id) => id !== blockId));
      audio.playBlockRemove();
    },
    [audio, isSubmitting, phase]
  );

  const reorderSelectedBlocks = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (phase !== "ASSEMBLING" || isSubmitting) return;
      if (fromIndex === toIndex) return;
      setSelectedBlockIds((prev) => {
        if (
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= prev.length ||
          toIndex >= prev.length
        ) {
          return prev;
        }
        const copy = [...prev];
        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(toIndex, 0, moved);
        return copy;
      });
      audio.playBlockSnap();
    },
    [audio, isSubmitting, phase]
  );

  const clearSelectedBlocks = useCallback(() => {
    if (phase !== "ASSEMBLING" || isSubmitting) return;
    if (selectedBlockIds.length === 0) return;
    setSelectedBlockIds([]);
    audio.playBlockRemove();
  }, [audio, isSubmitting, phase, selectedBlockIds.length]);

  const undoLastBlock = useCallback(() => {
    if (phase !== "ASSEMBLING" || isSubmitting) return;
    setSelectedBlockIds((prev) => {
      if (prev.length === 0) return prev;
      audio.playBlockRemove();
      return prev.slice(0, -1);
    });
  }, [audio, isSubmitting, phase]);

  const executeTurn = useCallback(async () => {
    if (!desafio || phase !== "ASSEMBLING" || isSubmitting) return;
    if (selectedBlocks.length === 0) {
      setConsoleLog({
        tone: "error",
        text: "Selecione os blocos de código antes de atacar.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const blocosTextos = selectedBlocks.map((b) => b.texto);
      const { resultado, progresso: progressoAtualizado } =
        await combateService.submeterTurno({
          email: playerEmail,
          desafioId: desafio.id,
          numeroAndar: desafio.numeroAndar,
          blocosMontados: blocosTextos,
          codigoJava: blocosTextos.join(" "),
        });

      setLastResult(resultado);

      if (resultado.vitoriaTurno) {
        setPhase("ANIMATING_HERO_ATTACK");
        setConsoleLog({
          tone: "success",
          text: resultado.submissao.diagnostico,
        });

        const isSword = progresso.armamentoAtual === "ESPADA";
        if (isSword) {
          audio.playSwordAttack();
          emitArenaEvent("HERO_SWORD_ATTACK", {
            damageValue: desafio.inimigo.hpMaximo,
          });
        } else {
          audio.playStaffAttack();
          emitArenaEvent("HERO_STAFF_ATTACK", {
            damageValue: desafio.inimigo.hpMaximo,
          });
        }

        scheduleTimeout(() => {
          emitArenaEvent("ENEMY_DEFEATED");
        }, 720);

        scheduleTimeout(() => {
          setProgresso(progressoAtualizado);
          setIsSubmitting(false);
          props.onFloorCompleted?.(resultado);

          if (resultado.checkpointRegistrado && resultado.novoCheckpointAndar) {
            audio.playCheckpointUnlock();
            emitArenaEvent("CHECKPOINT_CELEBRATION");
            setPhase("CHECKPOINT_UNLOCKED");
            void metricasService
              .registrarConclusaoCiclo({
                email: playerEmail,
                andarInicial: Math.max(1, resultado.novoCheckpointAndar - 10),
                andarFinal: resultado.novoCheckpointAndar - 1,
                vidasGastas: progresso.vidasGastasNoCiclo,
                dicasUsadas: progresso.dicasUsadasNoCiclo,
              })
              .catch(() => {});
            props.onCheckpointUnlocked?.(
              resultado.novoCheckpointAndar,
              progressoAtualizado
            );
          } else {
            audio.playFloorVictory();
            setPhase("FLOOR_VICTORY");
          }
        }, 1250);
      } else {
        setPhase("ANIMATING_ENEMY_COUNTER");
        setLastErrorCategory(resultado.submissao.categoriaErro ?? "SINTAXE");
        setConsoleLog({
          tone: "error",
          text: resultado.submissao.diagnostico,
        });

        audio.playEnemyCounter();
        emitArenaEvent("ENEMY_COUNTERATTACK", { damageValue: 1 });
        setHeartBreakPulse((p) => p + 1);
        props.onTurnMistake?.();

        scheduleTimeout(() => {
          if (props.practiceMode) {
            setProgresso({
              ...progressoAtualizado,
              vidasRestantes: 3,
              dicasRestantes: 3,
              andarEmAndamento: true,
              andarAtual: desafio.numeroAndar,
            });
            setIsSubmitting(false);
            emitArenaEvent("IDLE");
            setPhase("ASSEMBLING");
            return;
          }

          setProgresso(progressoAtualizado);
          setIsSubmitting(false);

          if (resultado.reiniciouNoCheckpoint || resultado.vidasRestantes <= 0) {
            audio.playDefeat();
            emitArenaEvent("HERO_DEFEATED");
            setPhase("DEFEAT_GAMEOVER");
          } else {
            emitArenaEvent("IDLE");
            setPhase("ASSEMBLING");
          }
        }, 980);
      }
    } catch (err) {
      setIsSubmitting(false);
      setConsoleLog({
        tone: "error",
        text:
          err instanceof Error
            ? err.message
            : "Erro inesperado ao validar código.",
      });
    }
  }, [
    audio,
    desafio,
    emitArenaEvent,
    isSubmitting,
    phase,
    playerEmail,
    progresso.armamentoAtual,
    progresso.dicasUsadasNoCiclo,
    progresso.vidasGastasNoCiclo,
    props,
    scheduleTimeout,
    selectedBlocks,
  ]);

  const requestHint = useCallback(async () => {
    if (!desafio || progresso.dicasRestantes <= 0) return;

    const categoria = lastErrorCategory ?? "SINTAXE";
    try {
      const { dica, progresso: atualizado } = await vidasDicasService.solicitarDica(
        playerEmail,
        desafio.numeroAndar,
        categoria
      );
      setActiveHint(dica);
      setProgresso(atualizado);
      setIsHintModalOpen(true);
      audio.playHintChime();
    } catch (err) {
      setConsoleLog({
        tone: "error",
        text: err instanceof Error ? err.message : "Não foi possível carregar a dica.",
      });
    }
  }, [audio, desafio, lastErrorCategory, playerEmail, progresso.dicasRestantes]);

  const advanceToNextFloor = useCallback(async () => {
    await loadFloor(progresso.andarAtual, true);
  }, [loadFloor, progresso.andarAtual]);

  const restartFromCheckpoint = useCallback(async () => {
    const restaurado = await checkpointService.retomarUltimoCheckpoint(playerEmail);
    setProgresso(restaurado);
    await loadFloor(restaurado.andarAtual, true);
  }, [loadFloor, playerEmail]);

  const switchWeapon = useCallback(
    async (novoArmamento: TipoArmamento) => {
      if (progresso.andarEmAndamento) return;
      const atualizado = await checkpointService.trocarArmamentoNoCheckpoint(
        playerEmail,
        novoArmamento
      );
      setProgresso(atualizado);
      audio.playBlockSnap();
    },
    [audio, playerEmail, progresso.andarEmAndamento]
  );

  // Atalhos de teclado desktop (RNF-19): 1-9 selecionam blocos, Backspace desfaz, Enter executa, Tab retrai painel
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isHintModalOpen) {
        if (e.key === "Escape") setIsHintModalOpen(false);
        return;
      }

      if (e.key === "Tab" && phase === "ASSEMBLING") {
        e.preventDefault();
        setIsDrawerOpen((o) => !o);
        return;
      }

      if (phase !== "ASSEMBLING" || isSubmitting) return;

      if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        if (idx < availableBlocks.length) {
          e.preventDefault();
          addBlock(availableBlocks[idx].id);
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        undoLastBlock();
      } else if (e.key === "Enter" && selectedBlocks.length > 0) {
        e.preventDefault();
        void executeTurn();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    addBlock,
    availableBlocks,
    executeTurn,
    isHintModalOpen,
    isSubmitting,
    phase,
    selectedBlocks.length,
    undoLastBlock,
  ]);

  const cycleNumber = Math.floor((progresso.andarAtual - 1) / 10) + 1;
  const cycleStartFloor = (cycleNumber - 1) * 10 + 1;
  const canSwitchWeapon = !progresso.andarEmAndamento;
  const hintUnlockedByError = lastErrorCategory !== null;

  return {
    progresso,
    desafio,
    phase,
    cycleNumber,
    cycleStartFloor,
    connectionStatus,
    isDrawerOpen,
    setIsDrawerOpen,
    toggleDrawer: () => setIsDrawerOpen((v) => !v),
    selectedBlocks,
    availableBlocks,
    addBlock,
    removeBlock,
    reorderSelectedBlocks,
    clearSelectedBlocks,
    executeTurn,
    isSubmitting,
    consoleLog,
    lastResult,
    lastErrorCategory,
    hintUnlockedByError,
    activeHint,
    isHintModalOpen,
    setIsHintModalOpen,
    requestHint,
    advanceToNextFloor,
    restartFromCheckpoint,
    startBattleFromPreCombat,
    switchWeapon,
    canSwitchWeapon,
    arenaEvent,
    heartBreakPulse,
    timer,
    audio,
    isMobileViewport,
    mobileNoticeDismissed,
    dismissMobileNotice: () => setMobileNoticeDismissed(true),
    exitToTrail: () => props.onExitToTrail?.(progresso),
  };
}
