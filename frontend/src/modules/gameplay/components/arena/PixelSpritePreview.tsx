"use client";

import React, { useEffect, useRef } from "react";
import { EnemyArchetype, TipoArmamento } from "../../types/gameplay";
import { drawAnimatedEnemy, drawHeroWithWeapon } from "./pixelSprites";

/**
 * Mini-canvas pixel-art animado reutilizável para exibir o Herói (com Espada ou Cajado)
 * ou qualquer monstro/Chefe vivo em telas de Onboarding, Perfil, Preparação e Tutorial.
 */
export function PixelSpritePreview({
  kind,
  weapon = "ESPADA",
  enemy = "boss_dragon",
  size = 112,
  className = "",
}: {
  kind: "HERO" | "ENEMY";
  weapon?: TipoArmamento;
  enemy?: EnemyArchetype;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    let rafId = 0;

    const draw = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, size, size);

      // Halo suave de masmorra atrás do personagem
      const grad = ctx.createRadialGradient(
        size / 2,
        size * 0.56,
        4,
        size / 2,
        size * 0.56,
        size * 0.45
      );
      grad.addColorStop(
        0,
        kind === "HERO"
          ? weapon === "ESPADA"
            ? "rgba(229, 169, 59, 0.28)"
            : "rgba(125, 249, 255, 0.28)"
          : "rgba(202, 28, 8, 0.30)"
      );
      grad.addColorStop(1, "rgba(12, 8, 16, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Sombra no chão
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(size / 2, size * 0.88, size * 0.26, size * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      const bob = Math.round(Math.sin(t * 3.8) * 2.2);

      if (kind === "HERO") {
        const px = Math.max(2.5, size / 28);
        drawHeroWithWeapon(ctx, weapon, t, size * 0.44, size * 0.88, px, {
          bobY: bob,
          swingAngle: Math.sin(t * 2.8) * 0.08,
          flashColor: null,
          chargeGlow: weapon === "CAJADO" ? 0.55 : 0,
        });
      } else {
        const px = Math.max(2, size / (enemy === "boss_dragon" ? 32 : 22));
        drawAnimatedEnemy(ctx, enemy, t, size / 2, size * 0.87, px, {
          bobOffsetY: bob,
        });
      }

      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(rafId);
  }, [enemy, kind, size, weapon]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`pixel-canvas block select-none ${className}`}
      aria-hidden="true"
    />
  );
}
