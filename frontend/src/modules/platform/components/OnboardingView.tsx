"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Instagram,
  PlaySquare,
  Shield,
  Sparkles,
  Sword,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import {
  ARMAMENTOS_CONFIG,
  NivelExperiencia,
  TipoArmamento,
} from "@gameplay/types/gameplay";
import { PixelSpritePreview } from "@gameplay/components/arena/PixelSpritePreview";
import {
  OctagonBadge,
  StitchedLeatherPanel,
} from "@gameplay/components/ui/DesignSystemPrimitives";
import {
  APELIDO_MAX,
  useJogadorController,
} from "@platform/controllers/useJogadorController";
import { CanalAquisicao } from "@platform/types/platform";

const TOTAL_STEPS = 4;

/**
 * Onboarding limpo em 4 passos ligado 1-para-1 ao `JogadorService.java`:
 * 1) Apelido (RF-02/RF-06)
 * 2) CanalAquisicao — YOUTUBE | TIKTOK | INDICACAO | INSTAGRAM | OUTROS (RF-04)
 * 3) NivelExperiencia — INICIANTE | INTERMEDIARIO | AVANCADO (RF-03)
 * 4) Armamento Inicial — ESPADA | CAJADO (RF-07) -> começa no Andar 1!
 */
export function OnboardingView() {
  const router = useRouter();
  const { salvando, erro, setErro, sugerirApelido, validarApelido, registrarOnboarding } =
    useJogadorController();

  const [step, setStep] = useState<number>(1);
  const [apelido, setApelido] = useState<string>(sugerirApelido);
  const [canal, setCanal] = useState<CanalAquisicao>("INDICACAO");
  const [nivel, setNivel] = useState<NivelExperiencia>("INICIANTE");
  const [armamento, setArmamento] = useState<TipoArmamento>("ESPADA");

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);

  const stepTitles: Record<number, string> = {
    1: "SEU APELIDO",
    2: "ONDE CONHECEU",
    3: "SEU NÍVEL EM JAVA",
    4: "SUA ARMA INICIAL",
  };

  const canAdvance = !salvando && (step !== 1 || apelido.trim().length > 0);

  const handleNext = async () => {
    if (!canAdvance) return;
    if (step === 1) {
      const falha = validarApelido(apelido);
      if (falha) {
        setErro(falha);
        return;
      }
      setErro(null);
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    const ok = await registrarOnboarding({
      apelido,
      nivelExperiencia: nivel,
      canalAquisicao: canal,
      armamentoAtual: armamento,
      pontoPartida: "ZERO",
    });
    if (ok) router.push("/trilha");
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-between bg-[#0C0810] px-6 py-8">
      {/* Barra de progresso limpa */}
      <div className="relative flex w-full max-w-4xl items-center justify-center">
        <div className="h-3 w-full max-w-md overflow-hidden rounded-full bg-[#1B1118]">
          <div
            className="h-full rounded-full bg-[#5A8F49] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="font-display absolute right-0 hidden text-base font-bold uppercase tracking-widest text-[#6C6877] sm:inline">
          JAVAQUEST
        </span>
      </div>

      {/* Painel Central */}
      <div className="my-auto flex w-full max-w-4xl items-center justify-center gap-4 py-8">
        <button
          type="button"
          onClick={() => step > 1 && setStep((s) => s - 1)}
          aria-label="Voltar"
          className={`hidden h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-[#6C6877] hover:text-[#F4EFE6] md:flex ${
            step === 1 ? "invisible" : ""
          }`}
        >
          <ArrowLeft className="h-8 w-8 stroke-[2.8]" />
        </button>

        <div className="relative w-full max-w-2xl">
          <StitchedLeatherPanel
            title={stepTitles[step]}
            innerClassName="space-y-6 p-6 pb-12 pt-10"
          >
            {/* PASSO 1 — APELIDO */}
            {step === 1 && (
              <div className="space-y-5 text-center">
                <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                  QUAL SERÁ O NOME DO SEU HERÓI?
                </h1>
                <div className="flex justify-center">
                  <div className="overflow-hidden rounded-2xl border-2 border-[#E5A93B]/60 bg-[#0C0810] p-1">
                    <PixelSpritePreview kind="HERO" weapon={armamento} size={108} />
                  </div>
                </div>
                <input
                  type="text"
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  maxLength={APELIDO_MAX}
                  placeholder="Digite seu apelido"
                  className="mx-auto block w-full max-w-sm rounded-2xl border-2 border-[#E5A93B] bg-[#1B1118] px-4 py-3 text-center font-display text-2xl font-bold uppercase tracking-wider text-[#F4EFE6] outline-none"
                />
              </div>
            )}

            {/* PASSO 2 — CANAL DE AQUISIÇÃO (Enum Java CanalAquisicao) */}
            {step === 2 && (
              <div className="space-y-5">
                <h1 className="text-center font-display text-3xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                  ONDE VOCÊ DESCOBRIU O JAVAQUEST?
                </h1>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { id: "YOUTUBE" as CanalAquisicao, label: "YOUTUBE", icon: PlaySquare },
                    { id: "TIKTOK" as CanalAquisicao, label: "TIKTOK", icon: Sparkles },
                    { id: "INDICACAO" as CanalAquisicao, label: "INDICAÇÃO (AMIGOS / PROF)", icon: Users },
                    { id: "INSTAGRAM" as CanalAquisicao, label: "INSTAGRAM", icon: Instagram },
                    { id: "OUTROS" as CanalAquisicao, label: "OUTROS", icon: Compass },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = canal === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCanal(opt.id)}
                        className={`flex cursor-pointer items-center gap-3.5 rounded-2xl p-4 text-left transition-all ${
                          active ? "jq-slot-selected" : "jq-slot"
                        }`}
                      >
                        <OctagonBadge tone={active ? "gold" : "stone"} size={44}>
                          <Icon className="h-5 w-5" />
                        </OctagonBadge>
                        <span
                          className={`font-display text-lg font-bold uppercase tracking-wider ${
                            active ? "text-[#E5A93B]" : "text-[#F4EFE6]"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PASSO 3 — NÍVEL DE EXPERIÊNCIA (Enum Java NivelExperiencia) */}
            {step === 3 && (
              <div className="space-y-5">
                <h1 className="text-center font-display text-3xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                  QUAL É O SEU NÍVEL EM JAVA?
                </h1>

                <div className="space-y-3">
                  {[
                    {
                      id: "INICIANTE" as NivelExperiencia,
                      title: "INICIANTE",
                      desc: "Estou dando meus primeiros passos em programação",
                      icon: Sword,
                    },
                    {
                      id: "INTERMEDIARIO" as NivelExperiencia,
                      title: "INTERMEDIÁRIO",
                      desc: "Já conheço variáveis, tipos e condicionais if/else",
                      icon: Zap,
                    },
                    {
                      id: "AVANCADO" as NivelExperiencia,
                      title: "AVANÇADO",
                      desc: "Já programo com laços, arrays e orientação a objetos",
                      icon: Shield,
                    },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = nivel === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNivel(opt.id)}
                        className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl p-4 text-left transition-all ${
                          active ? "jq-slot-selected" : "jq-slot"
                        }`}
                      >
                        <OctagonBadge tone={active ? "gold" : "stone"} size={46}>
                          <Icon className="h-5 w-5" />
                        </OctagonBadge>
                        <div>
                          <div
                            className={`font-display text-xl font-bold uppercase tracking-wider ${
                              active ? "text-[#E5A93B]" : "text-[#F4EFE6]"
                            }`}
                          >
                            {opt.title}
                          </div>
                          <div className="text-xs font-semibold text-[#B08A6E]">
                            {opt.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PASSO 4 — ESCOLHA DE ARMAMENTO (RF-07: ESPADA OU CAJADO) */}
            {step === 4 && (
              <div className="space-y-5">
                <h1 className="text-center font-display text-3xl font-bold uppercase tracking-wider text-[#F4EFE6]">
                  ESCOLHA SUA ARMA INICIAL
                </h1>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(["ESPADA", "CAJADO"] as TipoArmamento[]).map((tipo) => {
                    const cfg = ARMAMENTOS_CONFIG[tipo];
                    const active = armamento === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setArmamento(tipo)}
                        className={`flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl p-5 text-center transition-all ${
                          active ? "jq-slot-selected" : "jq-slot"
                        }`}
                      >
                        <PixelSpritePreview kind="HERO" weapon={tipo} size={112} />
                        <div
                          className={`flex items-center gap-1.5 font-display text-2xl font-bold uppercase tracking-wider ${
                            active ? "text-[#E5A93B]" : "text-[#F4EFE6]"
                          }`}
                        >
                          {tipo === "ESPADA" ? (
                            <Sword className="h-5 w-5" />
                          ) : (
                            <Wand2 className="h-5 w-5 text-[#7DF9FF]" />
                          )}
                          <span>{cfg.nome}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#B08A6E]">
                          {cfg.alcance === "CURTO"
                            ? "Combate corpo a corpo (curto alcance)"
                            : "Combate mágico (longa distância)"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </StitchedLeatherPanel>

          {/* CTA Inferior */}
          <div className="relative z-20 -mt-6 flex justify-center">
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => void handleNext()}
              className="jq-btn-crimson cursor-pointer rounded-2xl px-12 py-3.5 font-display text-lg font-bold uppercase tracking-wider shadow-2xl"
            >
              {salvando ? "SALVANDO..." : step === TOTAL_STEPS ? "COMEÇAR NO ANDAR 1" : "CONTINUAR"}
            </button>
          </div>

          {erro && (
            <p
              role="alert"
              className="mt-4 text-center text-sm font-bold text-[#FF8A7A]"
            >
              {erro}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleNext()}
          aria-label="Avançar"
          className={`hidden h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-[#6C6877] hover:text-[#F4EFE6] md:flex ${
            step === TOTAL_STEPS ? "invisible" : ""
          }`}
        >
          <ArrowRight className="h-8 w-8 stroke-[2.8]" />
        </button>
      </div>

      <div className="text-xs font-bold uppercase tracking-widest text-[#6C6877]">
        Passo {step} de {TOTAL_STEPS}
      </div>
    </main>
  );
}
