"use client";

import React, { useEffect, useRef } from "react";
import {
  ArenaAnimationEvent,
  GameplayPhase,
  InimigoArena,
  TipoArmamento,
} from "../../types/gameplay";
import { drawAnimatedEnemy, drawHeroWithWeapon } from "./pixelSprites";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

interface AmbientEmber {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  phase: number;
}

interface DungeonArenaCanvasProps {
  floorNumber: number;
  weapon: TipoArmamento;
  heroNickname: string;
  heroLives: number;
  enemy: InimigoArena | null;
  phase: GameplayPhase;
  arenaEvent: ArenaAnimationEvent;
  isDrawerOpen: boolean;
}

/**
 * Arena 2.5D Pixel-Art em Tela Cheia (Canvas 2D a 60 FPS — RNF-05 / RF-16).
 * Versão polida com pilares góticos, raios de luz volumétricos, fissuras de lava
 * no andar do Chefe, hit-stop de impacto, ondas de choque, barras de HP com
 * dreno suave, círculo mágico arcano e vinheta de perigo com 1 vida.
 */
export function DungeonArenaCanvas({
  floorNumber,
  weapon,
  heroNickname,
  heroLives,
  enemy,
  phase,
  arenaEvent,
  isDrawerOpen,
}: DungeonArenaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    floorNumber,
    weapon,
    heroNickname,
    heroLives,
    enemy,
    phase,
    isDrawerOpen,
  });

  useEffect(() => {
    stateRef.current = {
      floorNumber,
      weapon,
      heroNickname,
      heroLives,
      enemy,
      phase,
      isDrawerOpen,
    };
  }, [enemy, floorNumber, heroLives, heroNickname, isDrawerOpen, phase, weapon]);

  const animRef = useRef({
    activeEventId: 0,
    eventType: "IDLE" as ArenaAnimationEvent["type"],
    eventProgress: 0,
    eventDuration: 0.9,
    cameraShift: 0,
    shakeTime: 0,
    shakeMagnitude: 0,
    hitStopTime: 0,
    enemyHpRatio: 1,
    enemyGhostHpRatio: 1,
    enemyAlive: true,
    heroAlive: true,
    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    floatingTexts: [] as FloatingText[],
    embers: [] as AmbientEmber[],
  });

  useEffect(() => {
    const anim = animRef.current;
    if (arenaEvent.id === anim.activeEventId) return;

    anim.activeEventId = arenaEvent.id;
    anim.eventType = arenaEvent.type;
    anim.eventProgress = 0;

    if (arenaEvent.type === "SPELL_TELEGRAPH") {
      anim.eventDuration = 1.2;
      anim.enemyHpRatio = 1;
      anim.enemyGhostHpRatio = 1;
      anim.enemyAlive = true;
      anim.heroAlive = true;
    } else if (arenaEvent.type === "HERO_SWORD_ATTACK") {
      anim.eventDuration = 0.85;
    } else if (arenaEvent.type === "HERO_STAFF_ATTACK") {
      anim.eventDuration = 0.88;
    } else if (arenaEvent.type === "ENEMY_COUNTERATTACK") {
      anim.eventDuration = 0.88;
    } else if (arenaEvent.type === "ENEMY_DEFEATED") {
      anim.eventDuration = 0.72;
      anim.enemyHpRatio = 0;
      anim.enemyAlive = false;
    } else if (arenaEvent.type === "HERO_DEFEATED") {
      anim.eventDuration = 0.9;
      anim.heroAlive = false;
    } else if (arenaEvent.type === "CHECKPOINT_CELEBRATION") {
      anim.eventDuration = 2.0;
    }
  }, [arenaEvent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    let width = window.innerWidth;
    let height = window.innerHeight;
    let impactTriggeredForEvent = -1;

    const anim = animRef.current;
    if (anim.embers.length === 0) {
      for (let i = 0; i < 42; i++) {
        anim.embers.push({
          x: Math.random(),
          y: Math.random(),
          vy: 0.014 + Math.random() * 0.032,
          vx: (Math.random() - 0.5) * 0.012,
          size: Math.random() > 0.65 ? 3 : 2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };

    resize();
    window.addEventListener("resize", resize);

    const spawnBurst = (
      x: number,
      y: number,
      colors: string[],
      count: number,
      speed = 210
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const mag = speed * (0.4 + Math.random() * 0.9);
        anim.particles.push({
          x,
          y,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag - 50,
          size: Math.random() > 0.5 ? 5 : 3,
          color: colors[i % colors.length],
          life: 0,
          maxLife: 0.48 + Math.random() * 0.42,
          gravity: 270,
        });
      }
    };

    const spawnShockwave = (x: number, y: number, maxRadius: number, color: string) => {
      anim.shockwaves.push({
        x,
        y,
        radius: 10,
        maxRadius,
        color,
        life: 0,
        maxLife: 0.42,
      });
    };

    const spawnText = (
      x: number,
      y: number,
      text: string,
      color: string,
      scale = 1
    ) => {
      anim.floatingTexts.push({
        x,
        y,
        vy: -58,
        text,
        color,
        life: 0,
        maxLife: 1.2,
        scale,
      });
    };

    const drawDungeonBackdrop = (
      t: number,
      stageCenterX: number,
      horizonY: number,
      floorBottomY: number,
      isBoss: boolean
    ) => {
      // Fundo abissal
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#07040B");
      bgGrad.addColorStop(0.54, isBoss ? "#210B17" : "#150D1E");
      bgGrad.addColorStop(1, "#0C0810");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Parede de pedra da masmorra
      const wallTop = Math.max(54, horizonY - 310);
      const wallGrad = ctx.createLinearGradient(0, wallTop, 0, horizonY);
      wallGrad.addColorStop(0, isBoss ? "#190B14" : "#130D1B");
      wallGrad.addColorStop(1, isBoss ? "#2C1322" : "#221931");
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, wallTop, width, horizonY - wallTop);

      // Tijolos pixelados com variação sutil de pedra
      const brickW = 58;
      const brickH = 26;
      for (let row = 0; row * brickH < horizonY - wallTop; row++) {
        const y = wallTop + row * brickH;
        const offset = (row % 2) * (brickW / 2);
        for (let col = -1; col * brickW < width + brickW; col++) {
          const x = col * brickW + offset;
          if ((row * 7 + col * 13) % 5 === 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.022)";
            ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
          }
          ctx.strokeStyle = "rgba(8, 5, 12, 0.62)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, brickW, brickH);
        }
      }

      // Arcos góticos esculpidos na parede traseira
      const gateR = Math.min(98, width * 0.088);
      const archOffsets = [-gateR * 2.55, gateR * 2.55];
      archOffsets.forEach((dx) => {
        const ax = stageCenterX + dx;
        const aw = 78;
        const ah = 152;
        const ay = horizonY - ah;
        ctx.fillStyle = "rgba(8, 5, 13, 0.62)";
        ctx.beginPath();
        ctx.moveTo(ax - aw / 2, horizonY);
        ctx.lineTo(ax - aw / 2, ay + 36);
        ctx.quadraticCurveTo(ax, ay - 16, ax + aw / 2, ay + 36);
        ctx.lineTo(ax + aw / 2, horizonY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(108, 104, 119, 0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fenda de vitral luminoso
        ctx.fillStyle = isBoss
          ? "rgba(202, 28, 8, 0.28)"
          : "rgba(125, 249, 255, 0.14)";
        ctx.fillRect(ax - 7, ay + 34, 14, 56);
      });

      // Feixes diagonais volumétricos suaves de luz da masmorra
      ctx.save();
      const shaftGrad = ctx.createLinearGradient(
        stageCenterX - 180,
        wallTop,
        stageCenterX + 80,
        horizonY + 180
      );
      shaftGrad.addColorStop(
        0,
        isBoss ? "rgba(202, 28, 8, 0.11)" : "rgba(229, 169, 59, 0.09)"
      );
      shaftGrad.addColorStop(1, "rgba(12, 8, 16, 0)");
      ctx.fillStyle = shaftGrad;
      ctx.beginPath();
      ctx.moveTo(stageCenterX - 150, wallTop);
      ctx.lineTo(stageCenterX + 150, wallTop);
      ctx.lineTo(stageCenterX + 270, horizonY + 190);
      ctx.lineTo(stageCenterX - 270, horizonY + 190);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Portal octogonal central de pedra facetada
      const gateY = horizonY - gateR * 0.74;
      ctx.save();
      ctx.translate(stageCenterX, gateY);
      const drawOctagon = (r: number, fill: string, stroke?: string, lw = 3) => {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI / 4) * i + Math.PI / 8;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw;
          ctx.stroke();
        }
      };

      drawOctagon(gateR * 1.18, "#262134", "#6C6877", 4);
      drawOctagon(
        gateR * 0.9,
        isBoss ? "#3D0D12" : "#140D22",
        isBoss ? "#CA1C08" : "#E5A93B",
        3
      );

      // Vórtice luminoso giratório dentro do portal
      const portalGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, gateR * 0.85);
      portalGlow.addColorStop(
        0,
        isBoss
          ? `rgba(255, 92, 40, ${0.5 + Math.sin(t * 4.5) * 0.14})`
          : `rgba(229, 169, 59, ${0.34 + Math.sin(t * 2.8) * 0.1})`
      );
      portalGlow.addColorStop(0.65, isBoss ? "rgba(202, 28, 8, 0.18)" : "rgba(85, 40, 64, 0.22)");
      portalGlow.addColorStop(1, "rgba(12, 8, 16, 0)");
      ctx.fillStyle = portalGlow;
      ctx.fillRect(-gateR, -gateR, gateR * 2, gateR * 2);

      // Anel rúnico giratório
      ctx.save();
      ctx.rotate(t * (isBoss ? 0.6 : 0.25));
      ctx.strokeStyle = isBoss
        ? "rgba(255, 226, 122, 0.45)"
        : "rgba(229, 169, 59, 0.35)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, gateR * 0.64, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = isBoss ? "rgba(255, 190, 140, 0.6)" : "rgba(229, 169, 59, 0.5)";
      ctx.font = `700 ${Math.round(gateR * 0.44)}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("{ }", 0, 2);
      ctx.restore();

      // Estandartes bordô costurados oficiais (#552840 + costura #B08A6E + ouro #E5A93B)
      const bannerOffsets = [-gateR * 1.78, gateR * 1.78];
      bannerOffsets.forEach((dx) => {
        const bx = stageCenterX + dx;
        const bw = 42;
        const bh = 104;
        const by = horizonY - bh - 34;

        ctx.fillStyle = "#552840";
        ctx.beginPath();
        ctx.moveTo(bx - bw / 2, by);
        ctx.lineTo(bx + bw / 2, by);
        ctx.lineTo(bx + bw / 2, by + bh - 18);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx - bw / 2, by + bh - 18);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#E5A93B";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Emblema losango dourado no centro do estandarte
        ctx.fillStyle = "#E5A93B";
        ctx.beginPath();
        ctx.moveTo(bx, by + 26);
        ctx.lineTo(bx + 9, by + 40);
        ctx.lineTo(bx, by + 54);
        ctx.lineTo(bx - 9, by + 40);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#70443C";
        ctx.fillRect(bx - bw / 2 - 7, by - 5, bw + 14, 7);
      });

      // Tochas de parede cintilantes + halos dinâmicos
      const torchOffsets = [-gateR * 3.45, gateR * 3.45];
      torchOffsets.forEach((dx, idx) => {
        const tx = stageCenterX + dx;
        const ty = horizonY - 102;
        const flicker = Math.sin(t * 11 + idx * 2.4) * 0.16 + Math.cos(t * 19 + idx) * 0.06;

        const torchLight = ctx.createRadialGradient(
          tx,
          ty - 8,
          6,
          tx,
          ty - 8,
          195 + flicker * 30
        );
        torchLight.addColorStop(
          0,
          isBoss ? "rgba(255, 92, 40, 0.42)" : "rgba(229, 169, 59, 0.36)"
        );
        torchLight.addColorStop(0.45, "rgba(202, 28, 8, 0.14)");
        torchLight.addColorStop(1, "rgba(12, 8, 16, 0)");
        ctx.fillStyle = torchLight;
        ctx.beginPath();
        ctx.arc(tx, ty - 8, 220, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#70443C";
        ctx.fillRect(tx - 4, ty, 8, 26);
        ctx.fillStyle = "#6C6877";
        ctx.fillRect(tx - 8, ty - 2, 16, 5);

        const flameH = 16 + Math.round(flicker * 18);
        ctx.fillStyle = "#CA1C08";
        ctx.fillRect(tx - 6, ty - flameH, 12, flameH);
        ctx.fillStyle = "#E5A93B";
        ctx.fillRect(tx - 4, ty - flameH + 3, 8, Math.max(6, flameH - 4));
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(tx - 2, ty - 7, 4, 6);
      });

      // Pilares de pedra facetada enquadrando a sala
      const pillarOffsets = [-gateR * 4.5, gateR * 4.5];
      pillarOffsets.forEach((dx) => {
        const px = stageCenterX + dx;
        const pw = 54;
        ctx.fillStyle = "#181224";
        ctx.fillRect(px - pw / 2, wallTop - 20, pw, horizonY - wallTop + 28);
        ctx.fillStyle = "rgba(108, 104, 119, 0.22)";
        ctx.fillRect(px - pw / 2, wallTop - 20, 8, horizonY - wallTop + 28);
        ctx.fillStyle = "#262134";
        ctx.fillRect(px - pw / 2 - 6, horizonY - 14, pw + 12, 16);
      });

      // Chão da Arena em Perspectiva 2.5D
      const floorGrad = ctx.createLinearGradient(0, horizonY, 0, floorBottomY);
      floorGrad.addColorStop(0, isBoss ? "#311420" : "#251B34");
      floorGrad.addColorStop(0.55, "#191122");
      floorGrad.addColorStop(1, "#0B0710");
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      // Rodapé de pedra com filete dourado/carmesim
      ctx.fillStyle = isBoss ? "#681515" : "#3C2F4F";
      ctx.fillRect(0, horizonY - 4, width, 9);
      ctx.fillStyle = isBoss ? "rgba(255, 110, 64, 0.45)" : "rgba(229, 169, 59, 0.28)";
      ctx.fillRect(0, horizonY - 4, width, 2);

      // Grade 2.5D em perspectiva real
      const vanishX = stageCenterX;
      const vanishY = horizonY - 125;
      const tileRows = 8;

      ctx.strokeStyle = isBoss
        ? `rgba(255, 86, 40, ${0.26 + Math.sin(t * 3) * 0.08})`
        : "rgba(176, 138, 110, 0.16)";
      ctx.lineWidth = isBoss ? 2 : 1.5;

      for (let r = 1; r <= tileRows; r++) {
        const ratio = Math.pow(r / tileRows, 1.55);
        const y = horizonY + ratio * (height - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      for (let col = -9; col <= 9; col++) {
        const bottomX = stageCenterX + col * 145;
        const slope = (bottomX - vanishX) / (height - vanishY);
        const topX = vanishX + slope * (horizonY - vanishY);
        ctx.beginPath();
        ctx.moveTo(topX, horizonY);
        ctx.lineTo(bottomX, height);
        ctx.stroke();
      }

      // Círculo rúnico de batalha no chão 2.5D
      const arenaRx = Math.min(330, width * 0.27);
      const arenaRy = arenaRx * 0.25;
      const arenaCy = horizonY + (height - horizonY) * 0.48;

      ctx.save();
      ctx.translate(stageCenterX, arenaCy);
      ctx.scale(1, arenaRy / arenaRx);

      // Brilho central do círculo de combate
      const floorGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, arenaRx);
      floorGlow.addColorStop(
        0,
        isBoss ? "rgba(202, 28, 8, 0.18)" : "rgba(229, 169, 59, 0.1)"
      );
      floorGlow.addColorStop(1, "rgba(12, 8, 16, 0)");
      ctx.fillStyle = floorGlow;
      ctx.beginPath();
      ctx.arc(0, 0, arenaRx, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isBoss
        ? "rgba(202, 28, 8, 0.55)"
        : "rgba(229, 169, 59, 0.30)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, arenaRx, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([14, 10]);
      ctx.strokeStyle = isBoss
        ? "rgba(255, 226, 122, 0.42)"
        : "rgba(176, 138, 110, 0.32)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, arenaRx * 0.82, t * 0.18, t * 0.18 + Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    const drawDiegeticPlate = (
      x: number,
      y: number,
      label: string,
      hpRatio: number,
      ghostRatio: number,
      barColor: string,
      sublabel?: string
    ) => {
      const plateW = 164;
      const plateH = 12;

      ctx.save();
      ctx.textAlign = "center";
      ctx.font = '700 14px "Bahnschrift", "Barlow Condensed", sans-serif';
      ctx.fillStyle = "#F4EFE6";
      ctx.shadowColor = "#0C0810";
      ctx.shadowBlur = 8;
      ctx.fillText(label.toUpperCase(), x, y - 17);

      if (sublabel) {
        ctx.font = '700 10px "Nunito Sans", sans-serif';
        ctx.fillStyle = "#B08A6E";
        ctx.fillText(sublabel, x, y - 4);
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0C0810";
      ctx.fillRect(x - plateW / 2 - 3, y + 3, plateW + 6, plateH + 6);
      ctx.strokeStyle = "#6C6877";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - plateW / 2 - 2, y + 4, plateW + 4, plateH + 4);

      ctx.fillStyle = "#262134";
      ctx.fillRect(x - plateW / 2, y + 6, plateW, plateH);

      // Barra fantasma branca de dano recente (juice de RPG!)
      const clampedGhost = Math.max(0, Math.min(1, ghostRatio));
      ctx.fillStyle = "rgba(244, 239, 230, 0.72)";
      ctx.fillRect(x - plateW / 2, y + 6, Math.round(plateW * clampedGhost), plateH);

      const clamped = Math.max(0, Math.min(1, hpRatio));
      ctx.fillStyle = barColor;
      ctx.fillRect(x - plateW / 2, y + 6, Math.round(plateW * clamped), plateH);

      // Brilho pixelado superior
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.fillRect(x - plateW / 2, y + 6, Math.round(plateW * clamped), 3);
      ctx.restore();
    };

    const renderFrame = (now: number) => {
      const rawDt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const t = now / 1000;
      const st = stateRef.current;
      const isBoss = Boolean(st.enemy?.ehChefe || st.floorNumber % 10 === 0);

      // Hit-stop breve para impacto visceral
      let dt = rawDt;
      if (anim.hitStopTime > 0) {
        anim.hitStopTime = Math.max(0, anim.hitStopTime - rawDt);
        dt = rawDt * 0.12;
      }

      // Dreno suave da barra fantasma do inimigo
      anim.enemyGhostHpRatio +=
        (anim.enemyHpRatio - anim.enemyGhostHpRatio) * Math.min(1, rawDt * 4.5);

      // Transição suave do centro da câmera ao abrir/recolher o painel retrátil
      const targetShift =
        st.isDrawerOpen && width >= 960 ? -Math.min(235, width * 0.168) : 0;
      anim.cameraShift += (targetShift - anim.cameraShift) * Math.min(1, rawDt * 8);

      let shakeX = 0;
      let shakeY = 0;
      if (anim.shakeTime > 0) {
        anim.shakeTime = Math.max(0, anim.shakeTime - rawDt);
        const amp = anim.shakeMagnitude * (anim.shakeTime / 0.34);
        shakeX = (Math.random() - 0.5) * 2 * amp;
        shakeY = (Math.random() - 0.5) * 2 * amp;
      }

      if (anim.eventType !== "IDLE") {
        anim.eventProgress = Math.min(1, anim.eventProgress + dt / anim.eventDuration);
      }

      const stageCenterX = width * 0.5 + anim.cameraShift + shakeX;
      const horizonY = Math.round(height * 0.52 + shakeY);
      const battleGroundY = Math.round(horizonY + (height - horizonY) * 0.48);
      const spread = Math.min(220, width * (st.isDrawerOpen ? 0.155 : 0.205));

      const baseHeroX = stageCenterX - spread;
      const baseEnemyX = stageCenterX + spread;
      const pixelSize = Math.max(4.5, Math.min(7.5, Math.round(Math.min(width, height) / 122)));

      ctx.save();
      drawDungeonBackdrop(t, stageCenterX, horizonY, height, isBoss);

      // Brasas e fagulhas ambientes
      anim.embers.forEach((ember) => {
        ember.y -= ember.vy * rawDt;
        ember.x += (ember.vx + Math.sin(t * 2 + ember.phase) * 0.008) * rawDt;
        if (ember.y < 0.04) {
          ember.y = 0.96;
          ember.x = Math.random();
        }
        ctx.fillStyle = isBoss
          ? "rgba(255, 110, 64, 0.6)"
          : "rgba(229, 169, 59, 0.48)";
        ctx.fillRect(
          Math.round(ember.x * width),
          Math.round(ember.y * height),
          ember.size,
          ember.size
        );
      });

      let heroX = baseHeroX;
      let heroY = battleGroundY;
      let heroSwing = Math.sin(t * 3) * 0.06;
      let heroFlash: string | null = null;
      let heroCharge = 0;

      let enemyX = baseEnemyX;
      const enemyY = battleGroundY;
      let enemyFlash: string | null = null;
      let enemyOpacity = anim.enemyAlive ? 1 : 0;

      // === ESPADA (avanço corpo a corpo + corte dourado + hit-stop + onda de choque) ===
      if (anim.eventType === "HERO_SWORD_ATTACK") {
        const p = anim.eventProgress;
        if (p < 0.42) {
          const dash = p / 0.42;
          const ease = 1 - Math.pow(1 - dash, 3);
          heroX = baseHeroX + (baseEnemyX - baseHeroX - pixelSize * 12) * ease;
          heroY = battleGroundY - Math.sin(dash * Math.PI) * 28;
          heroSwing = -1.0 * ease;
          if (Math.random() > 0.35) {
            anim.particles.push({
              x: heroX - 18,
              y: heroY - 12,
              vx: -70,
              vy: -20 + Math.random() * 20,
              size: 4,
              color: "#E5A93B",
              life: 0,
              maxLife: 0.22,
              gravity: 40,
            });
          }
        } else if (p < 0.68) {
          const slash = (p - 0.42) / 0.26;
          heroX = baseEnemyX - pixelSize * 12;
          heroSwing = -1.0 + slash * 2.4;
          if (impactTriggeredForEvent !== anim.activeEventId) {
            impactTriggeredForEvent = anim.activeEventId;
            anim.hitStopTime = 0.055;
            anim.shakeTime = 0.34;
            anim.shakeMagnitude = 14;
            anim.enemyHpRatio = 0.1;
            spawnShockwave(baseEnemyX, battleGroundY - pixelSize * 8, 92, "#E5A93B");
            spawnBurst(
              baseEnemyX,
              battleGroundY - pixelSize * 8,
              ["#FFE27A", "#E5A93B", "#FFFFFF", "#CA1C08"],
              32,
              270
            );
            spawnText(
              baseEnemyX,
              battleGroundY - pixelSize * 17,
              `CRÍTICO -${st.enemy?.hpMaximo ?? 100}`,
              "#FFE27A",
              1.2
            );
          }
          enemyFlash = slash < 0.55 ? "#FFFFFF" : null;
          enemyX = baseEnemyX + Math.sin(slash * Math.PI) * 20;
        } else {
          const ret = (p - 0.68) / 0.32;
          heroX =
            baseEnemyX -
            pixelSize * 12 -
            (baseEnemyX - baseHeroX - pixelSize * 12) * ret;
          heroSwing = 1.4 * (1 - ret);
        }
      }

      // === CAJADO (círculo mágico sob o herói + cometa arcano + explosão elemental) ===
      let staffBoltPos: { x: number; y: number } | null = null;
      if (anim.eventType === "HERO_STAFF_ATTACK") {
        const p = anim.eventProgress;
        if (p < 0.34) {
          heroCharge = p / 0.34;
          heroSwing = -0.38 * heroCharge;
          // Círculo mágico de conjuração nos pés do herói
          ctx.save();
          ctx.translate(baseHeroX, battleGroundY + 2);
          ctx.scale(1, 0.28);
          ctx.strokeStyle = `rgba(125, 249, 255, ${0.85 * heroCharge})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, pixelSize * (7 + heroCharge * 5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (p < 0.72) {
          const flight = (p - 0.34) / 0.38;
          heroCharge = 1 - flight;
          heroSwing = -0.38 + flight * 0.6;
          const bx =
            baseHeroX +
            pixelSize * 8 +
            (baseEnemyX - baseHeroX - pixelSize * 8) * flight;
          const by =
            battleGroundY - pixelSize * 11 - Math.sin(flight * Math.PI) * 42;
          staffBoltPos = { x: bx, y: by };

          for (let k = 0; k < 2; k++) {
            anim.particles.push({
              x: bx,
              y: by,
              vx: -50 + (Math.random() - 0.5) * 40,
              vy: (Math.random() - 0.5) * 40,
              size: Math.random() > 0.5 ? 5 : 3,
              color: Math.random() > 0.45 ? "#7DF9FF" : "#FFE27A",
              life: 0,
              maxLife: 0.32,
              gravity: 0,
            });
          }
        } else {
          if (impactTriggeredForEvent !== anim.activeEventId) {
            impactTriggeredForEvent = anim.activeEventId;
            anim.hitStopTime = 0.055;
            anim.shakeTime = 0.36;
            anim.shakeMagnitude = 16;
            anim.enemyHpRatio = 0.06;
            spawnShockwave(baseEnemyX, battleGroundY - pixelSize * 8, 110, "#7DF9FF");
            spawnShockwave(baseEnemyX, battleGroundY - pixelSize * 8, 70, "#E5A93B");
            spawnBurst(
              baseEnemyX,
              battleGroundY - pixelSize * 8,
              ["#7DF9FF", "#FFFFFF", "#E5A93B", "#D4A6FF"],
              38,
              290
            );
            spawnText(
              baseEnemyX,
              battleGroundY - pixelSize * 18,
              `ARCANO -${st.enemy?.hpMaximo ?? 100}`,
              "#7DF9FF",
              1.2
            );
          }
          const post = (p - 0.72) / 0.28;
          enemyFlash = post < 0.6 ? "#7DF9FF" : null;
          enemyX = baseEnemyX + Math.sin(post * Math.PI) * 16;
        }
      }

      // === CONTRA-ATAQUE DO INIMIGO ===
      let enemyBoltPos: { x: number; y: number } | null = null;
      if (anim.eventType === "ENEMY_COUNTERATTACK") {
        const p = anim.eventProgress;
        if (p < 0.55) {
          const flight = p / 0.55;
          enemyX = baseEnemyX - Math.sin(flight * Math.PI) * 28;
          enemyBoltPos = {
            x: baseEnemyX - (baseEnemyX - baseHeroX) * flight,
            y:
              battleGroundY - pixelSize * 10 - Math.sin(flight * Math.PI) * 34,
          };
          anim.particles.push({
            x: enemyBoltPos.x,
            y: enemyBoltPos.y,
            vx: 45,
            vy: (Math.random() - 0.5) * 45,
            size: 5,
            color: "#CA1C08",
            life: 0,
            maxLife: 0.28,
            gravity: 0,
          });
        } else {
          if (impactTriggeredForEvent !== anim.activeEventId) {
            impactTriggeredForEvent = anim.activeEventId;
            anim.hitStopTime = 0.05;
            anim.shakeTime = 0.36;
            anim.shakeMagnitude = 16;
            spawnShockwave(baseHeroX, battleGroundY - pixelSize * 8, 86, "#CA1C08");
            spawnBurst(
              baseHeroX,
              battleGroundY - pixelSize * 8,
              ["#CA1C08", "#FF6B2B", "#FFE27A"],
              28,
              225
            );
            spawnText(
              baseHeroX,
              battleGroundY - pixelSize * 18,
              "-1 VIDA!",
              "#FF5E4D",
              1.2
            );
          }
          const recoil = (p - 0.55) / 0.45;
          heroX = baseHeroX - Math.sin(recoil * Math.PI) * 26;
          heroFlash = recoil < 0.6 ? "#CA1C08" : null;
        }
      }

      if (anim.eventType === "ENEMY_DEFEATED") {
        const p = anim.eventProgress;
        enemyOpacity = Math.max(0, 1 - p);
        if (impactTriggeredForEvent !== anim.activeEventId) {
          impactTriggeredForEvent = anim.activeEventId;
          spawnShockwave(baseEnemyX, battleGroundY - pixelSize * 8, 125, "#5A8F49");
          spawnBurst(
            baseEnemyX,
            battleGroundY - pixelSize * 8,
            ["#8CE070", "#E5A93B", "#FFFFFF"],
            42,
            280
          );
          spawnText(
            baseEnemyX,
            battleGroundY - pixelSize * 18,
            isBoss ? "CHEFE DERROTADO!" : "BUG ELIMINADO!",
            "#8CE070",
            1.25
          );
        }
      }

      // Sombras no piso 2.5D
      const drawGroundShadow = (cx: number, cy: number, radiusX: number, alpha = 0.6) => {
        ctx.fillStyle = `rgba(5, 2, 10, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, radiusX, radiusX * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
      };

      // Herói animado
      drawGroundShadow(heroX, battleGroundY, pixelSize * 8.2, anim.heroAlive ? 0.62 : 0.25);
      const heroBob = anim.heroAlive ? Math.round(Math.sin(t * 4.2) * 3) : 6;
      drawHeroWithWeapon(ctx, st.weapon, t, heroX, heroY, pixelSize, {
        bobY: heroBob,
        swingAngle: heroSwing,
        flashColor: heroFlash,
        opacity: anim.heroAlive ? 1 : 0.35,
        chargeGlow: heroCharge,
      });

      drawDiegeticPlate(
        heroX,
        battleGroundY + 42,
        st.heroNickname,
        st.heroLives / 3,
        st.heroLives / 3,
        st.heroLives <= 1 ? "#CA1C08" : "#5A8F49",
        st.weapon === "ESPADA" ? "ESPADA • CURTO ALCANCE" : "CAJADO • LONGO ALCANCE"
      );

      // Inimigo / Chefe animado
      if (st.enemy && enemyOpacity > 0.02) {
        const enemyScale = st.enemy.ehChefe ? pixelSize * 0.98 : pixelSize * 1.04;
        const enemyBob =
          st.enemy.arquetipo === "wisp" ||
          st.enemy.arquetipo === "phantom" ||
          st.enemy.arquetipo === "vortex"
            ? Math.round(Math.sin(t * 3.6) * 9 - 10)
            : Math.round(Math.sin(t * 3.2 + 1) * 3);

        // Aura do inimigo / Chefe
        const auraR = enemyScale * (st.enemy.ehChefe ? 16 : 10);
        const auraGrad = ctx.createRadialGradient(
          enemyX,
          enemyY - enemyScale * 7,
          6,
          enemyX,
          enemyY - enemyScale * 7,
          auraR
        );
        auraGrad.addColorStop(0, `${st.enemy.corAura}52`);
        auraGrad.addColorStop(1, "rgba(12, 8, 16, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(enemyX, enemyY - enemyScale * 7, auraR, 0, Math.PI * 2);
        ctx.fill();

        drawGroundShadow(
          enemyX,
          battleGroundY,
          enemyScale * (st.enemy.ehChefe ? 13 : 7.8),
          0.62 * enemyOpacity
        );

        drawAnimatedEnemy(ctx, st.enemy.arquetipo, t, enemyX, enemyY, enemyScale, {
          bobOffsetY: enemyBob,
          flashColor: enemyFlash,
          opacity: enemyOpacity,
        });

        drawDiegeticPlate(
          enemyX,
          battleGroundY + 42,
          st.enemy.nome,
          anim.enemyHpRatio,
          anim.enemyGhostHpRatio,
          st.enemy.ehChefe ? "#CA1C08" : "#E5A93B",
          st.enemy.titulo
        );
      }

      // Arco de corte duplo da Espada
      if (
        anim.eventType === "HERO_SWORD_ATTACK" &&
        anim.eventProgress > 0.43 &&
        anim.eventProgress < 0.68
      ) {
        const slashAlpha = 1 - (anim.eventProgress - 0.43) / 0.25;
        ctx.save();
        ctx.strokeStyle = `rgba(229, 169, 59, ${slashAlpha})`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(
          baseEnemyX - 8,
          battleGroundY - pixelSize * 8,
          pixelSize * 9.5,
          -Math.PI * 0.78,
          Math.PI * 0.28
        );
        ctx.stroke();
        ctx.strokeStyle = `rgba(255, 255, 255, ${slashAlpha})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      }

      // Projétil arcano do Cajado
      if (staffBoltPos) {
        const g = ctx.createRadialGradient(
          staffBoltPos.x,
          staffBoltPos.y,
          2,
          staffBoltPos.x,
          staffBoltPos.y,
          32
        );
        g.addColorStop(0, "#FFFFFF");
        g.addColorStop(0.32, "#7DF9FF");
        g.addColorStop(0.68, "#E5A93B");
        g.addColorStop(1, "rgba(125, 249, 255, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(staffBoltPos.x, staffBoltPos.y, 32, 0, Math.PI * 2);
        ctx.fill();
      }

      // Projétil de contra-ataque do Inimigo
      if (enemyBoltPos) {
        const g = ctx.createRadialGradient(
          enemyBoltPos.x,
          enemyBoltPos.y,
          2,
          enemyBoltPos.x,
          enemyBoltPos.y,
          28
        );
        g.addColorStop(0, "#FFE27A");
        g.addColorStop(0.38, "#CA1C08");
        g.addColorStop(1, "rgba(202, 28, 8, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(enemyBoltPos.x, enemyBoltPos.y, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ondas de choque expansivas
      for (let i = anim.shockwaves.length - 1; i >= 0; i--) {
        const sw = anim.shockwaves[i];
        sw.life += rawDt;
        if (sw.life >= sw.maxLife) {
          anim.shockwaves.splice(i, 1);
          continue;
        }
        const p = sw.life / sw.maxLife;
        sw.radius = 12 + (sw.maxRadius - 12) * (1 - Math.pow(1 - p, 2));
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = Math.max(1.5, 6 * (1 - p));
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Partículas
      for (let i = anim.particles.length - 1; i >= 0; i--) {
        const pt = anim.particles[i];
        pt.life += rawDt;
        if (pt.life >= pt.maxLife) {
          anim.particles.splice(i, 1);
          continue;
        }
        pt.vy += pt.gravity * rawDt;
        pt.x += pt.vx * rawDt;
        pt.y += pt.vy * rawDt;
        ctx.globalAlpha = 1 - pt.life / pt.maxLife;
        ctx.fillStyle = pt.color;
        ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
        ctx.globalAlpha = 1;
      }

      // Textos flutuantes de combate
      for (let i = anim.floatingTexts.length - 1; i >= 0; i--) {
        const ft = anim.floatingTexts[i];
        ft.life += rawDt;
        if (ft.life >= ft.maxLife) {
          anim.floatingTexts.splice(i, 1);
          continue;
        }
        ft.y += ft.vy * rawDt;
        ctx.save();
        ctx.globalAlpha = 1 - ft.life / ft.maxLife;
        ctx.font = `700 ${Math.round(23 * ft.scale)}px "Bahnschrift", "Barlow Condensed", sans-serif`;
        ctx.textAlign = "center";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#0C0810";
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // Vinheta atmosférica + pulso carmesim de perigo quando restar apenas 1 vida!
      const vig = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.34,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.74
      );
      vig.addColorStop(0, "rgba(0, 0, 0, 0)");
      if (st.heroLives === 1 && st.phase !== "PRE_COMBAT") {
        const danger = 0.28 + Math.sin(t * 5.5) * 0.12;
        vig.addColorStop(1, `rgba(202, 28, 8, ${danger})`);
      } else {
        vig.addColorStop(1, "rgba(6, 3, 10, 0.52)");
      }
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();
      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pixel-canvas fixed inset-0 h-full w-full select-none"
      aria-label="Arena 2.5D Pixel-Art do JavaQuest"
    />
  );
}
