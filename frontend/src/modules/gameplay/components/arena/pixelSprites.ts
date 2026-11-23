import { EnemyArchetype, TipoArmamento } from "../../types/gameplay";

/**
 * Sprites pixel-art detalhados em alta definição artesanal com 2 quadros de
 * animação (respiração, balanço de capa, bater de asas, brilho rúnico)
 * para o Herói (Espada/Cajado) e todos os monstros + Chefe Dragão.
 */

export type SpritePalette = Record<string, string>;

export interface AnimatedPixelSprite {
  frames: string[][];
  palette: SpritePalette;
}

export interface PixelSpriteDef {
  grid: string[];
  palette: SpritePalette;
}

const HERO_PALETTE: SpritePalette = {
  K: "#0C0810", // contorno obsidiana profundo
  H: "#2D213B", // capuz/elmo sombra
  h: "#4B3863", // capuz/elmo médio
  P: "#735A94", // brilho lilás do elmo
  G: "#E5A93B", // ouro JavaQuest
  Y: "#FFE27A", // brilho dourado
  g: "#9A691E", // ouro sombra
  S: "#F2C9A0", // pele
  s: "#D6A176", // sombra pele
  E: "#7DF9FF", // olhos determinados
  C: "#552840", // capa bordô oficial
  c: "#371628", // dobra escura da capa
  R: "#7B3A5C", // luz da capa
  A: "#262134", // peitoral pedra facetada
  a: "#5A5569", // luz da armadura
  M: "#8C879B", // brilho metálico
  L: "#70443C", // cinto couro
  B: "#1B1118", // botas escuras
  b: "#3A2C38", // brilho bota
};

export const HERO_ANIMATED_SPRITE: AnimatedPixelSprite = {
  palette: HERO_PALETTE,
  frames: [
    // Frame 0: postura firme, capa estendida
    [
      "......KKKKKKKK......",
      ".....KHHhPPhHHK.....",
      "....KHhPPPPPPPhK....",
      "...KHHGGYYYYGGHHK...",
      "...KHhGSSSSSSGhHK...",
      "...KHSESSSSSESsHK...",
      "....KHsSSSSSSsHK....",
      "...KKRCCCCCCCCRKK...",
      "..KCRaAMGGGGMAaRCK..",
      "..KCRaAAMaaMAAaRCK..",
      ".KCCcAAALLLLAACcCK..",
      ".KCccAaALGGLaACccK..",
      ".KCCcAAAaMMaAACcCK..",
      "..KCCKAAAAAAAAKCK...",
      "..KcCKAAaKKaAAKCcK..",
      "...KK.KAAKKAAK.KK...",
      "......KBbKKbBK......",
      "......KBBKKBBK......",
      ".....KKKKKKKKKK.....",
    ],
    // Frame 1: respiração + ondulação da capa
    [
      "....................",
      "......KKKKKKKK......",
      ".....KHHhPPhHHK.....",
      "....KHhPPPPPPPhK....",
      "...KHHGGYYYYGGHHK...",
      "...KHhGSSSSSSGhHK...",
      "...KHSESSSSSESsHK...",
      "....KHsSSSSSSsHK....",
      "..KKRRCCCCCCCCRKK...",
      ".KCCRaAMGGGGMAaRCK..",
      ".KCcRaAAMaaMAAaRCK..",
      "KCCccAAALLLLAACcCK..",
      ".KCccAaALGGLaACcCK..",
      "..KCCAAAaMMaAACK....",
      "..KcKKAAAAAAAAKK....",
      "...KK.KAAKKAAK......",
      "......KBbKKbBK......",
      "......KBBKKBBK......",
      ".....KKKKKKKKKK.....",
    ],
  ],
};

export const SWORD_SPRITE: PixelSpriteDef = {
  palette: {
    K: "#0C0810",
    W: "#FFFFFF",
    I: "#CBD6E6",
    i: "#7D889E",
    G: "#E5A93B",
    Y: "#FFE27A",
    L: "#70443C",
  },
  grid: [
    "........KKK",
    ".......KWWK",
    "......KWYIK",
    ".....KWIiK.",
    "....KWYIK..",
    "...KWIiK...",
    ".KKGYIK....",
    "KYYGGK.....",
    ".KLGK......",
    "KLGK.......",
    "KKK........",
  ],
};

export const STAFF_SPRITE: PixelSpriteDef = {
  palette: {
    K: "#0C0810",
    W: "#F4EFE6",
    C: "#7DF9FF",
    c: "#2DA8C8",
    B: "#1B5E8A",
    G: "#E5A93B",
    Y: "#FFE27A",
    T: "#70443C",
    t: "#4A2A24",
  },
  grid: [
    "...KKKK...",
    "..KCCWWK..",
    ".KCWWCCcK.",
    ".KCccCBBK.",
    ".KGYccYGK.",
    "..KGGGGK..",
    "...KTTK...",
    "...KTtK...",
    "...KTTK...",
    "...KTtK...",
    "...KTTK...",
    "...KTtK...",
    "...KGGK...",
    "....KK....",
  ],
};

export const ENEMY_ANIMATED_SPRITES: Record<EnemyArchetype, AnimatedPixelSprite> = {
  slime: {
    palette: {
      K: "#0C0810",
      W: "#E8FFE0",
      L: "#8CE070",
      M: "#5A8F49",
      D: "#264A2B",
      d: "#162E1A",
      R: "#CA1C08",
      Y: "#FFE27A",
    },
    frames: [
      [
        "......KKKKKKKK......",
        "....KKLLWWWWLLKK....",
        "...KLLMMMMMMMMLLK...",
        "..KLMMWMMMMMMMMLMK..",
        ".KLMKKYYKMMKKYYKMLK.",
        ".KMMKRYRKMMKRYRKMMK.",
        "KMMMMKKKKMMKKKKMMMMK",
        "KMMMLMMMMMMMMMMLMMMK",
        "KMMDDDDMDDDDMDDDDMMK",
        "KDDDDddDDDDDDddDDDDK",
        ".KDDDDddddddddDDDDK.",
        "..KKKKKKKKKKKKKKKK..",
      ],
      [
        "....................",
        ".....KKKKKKKKKK.....",
        "...KKLLWWWWWWLLKK...",
        "..KLLMMMMMMMMMMLLK..",
        ".KLMMWMMMMMMMMMMLMK.",
        "KLMMKKYYKMMKKYYKMMLK",
        "KMMMKRYRKMMKRYRKMMMK",
        "KMMMMKKKKMMKKKKMMMMK",
        "KMMDDDDDDDDDDDDDDMMK",
        "KDDDDddDDDDDDddDDDDK",
        "KDDDDddddddddddDDDDK",
        ".KKKKKKKKKKKKKKKKKK.",
      ],
    ],
  },
  wisp: {
    palette: {
      K: "#0C0810",
      W: "#FFFFFF",
      C: "#7DF9FF",
      B: "#3A7BD5",
      D: "#20122E",
      G: "#E5A93B",
      Y: "#FFE27A",
    },
    frames: [
      [
        ".......KK.......",
        "......KCCK......",
        ".....KCWWCK.....",
        "....KCCWWCCK....",
        "..GKCBCCCCBCKG..",
        ".KYYKCKWWKCKYYK.",
        "..K.KCKGGKCK.K..",
        "....KCBCCBCK....",
        "....KBBDDDBK....",
        ".....KBDDDK.....",
        "......KBBK......",
        ".......KK.......",
      ],
      [
        "......K..K......",
        "......KWWK......",
        ".....KCWWCK.....",
        ".K..KCCWWCCK..K.",
        "KYK.KCBCCBCK.KYK",
        ".K..KCKWWKCK..K.",
        "....KCKGGKCK....",
        "....KCBCCBCK....",
        ".....KBDDBK.....",
        "......KBBK......",
        ".......KK.......",
        "................",
      ],
    ],
  },
  phantom: {
    palette: {
      K: "#0C0810",
      P: "#6E3AA8",
      p: "#3A1A60",
      G: "#5A8F49",
      g: "#8CE070",
      R: "#CA1C08",
      r: "#FF6E5E",
      W: "#F4EFE6",
      Y: "#E5A93B",
    },
    frames: [
      [
        ".....KKYYKK.....",
        "...KKPPPPPPKK...",
        "..KPPgGGGGRRrPK.",
        ".KPPgGWWGGRWWRPK",
        ".KPPGGGGGGGRRRPK",
        ".KPPppppppppppPK",
        "KPPPppWWKKWWppPPK",
        "KPPppppppppppppPK",
        "KPPppPPppppPPppPK",
        ".KppK..KppK..KppK",
        "..KK....KK....KK.",
      ],
      [
        ".....KKYYKK.....",
        "...KKPPPPPPKK...",
        "..KPPgGGGGRRrPK.",
        ".KPPgGWWGGRWWRPK",
        ".KPPGGGGGGGRRRPK",
        ".KPPppppppppppPK",
        "KPPPppWWKKWWppPPK",
        "KPPppppppppppppPK",
        ".KPPppPPppPPppPK.",
        "..KppK.KppK.KppK.",
        "...KK...KK...KK..",
      ],
    ],
  },
  golem: {
    palette: {
      K: "#0C0810",
      L: "#9D98AC",
      S: "#6C6877",
      s: "#3E3A4C",
      G: "#E5A93B",
      Y: "#FFE27A",
      W: "#FFFFFF",
    },
    frames: [
      [
        ".....KKKKKKKK.....",
        "...KKLLLLLLLLKK...",
        "..KLLSSSSSSSSLLK..",
        ".KKLsKGGKKGGKsLKK.",
        "KLLSssYYssYYssSLLK",
        "KLSSSSSSGGSSSSSSLK",
        "KssSSGGYWWYGGSSssK",
        "KssSSSSGYYGSSSSssK",
        "KssSSsSSSSSSsSSssK",
        ".KKssSSSSSSSSssKK.",
        "..KssSSKKKKSSssK..",
        "..KssSK....KssSK..",
        "..KKKK......KKKK..",
      ],
      [
        "....................",
        ".....KKKKKKKK.....",
        "...KKLLLLLLLLKK...",
        "..KLLSSSSSSSSLLK..",
        "KKKLsKGGKKGGKsLKKK",
        "KLLSssYYssYYssSLLK",
        "KLSSSSSGGGGSSSSLK.",
        "KssSSGYWWWWYGSSssK",
        "KssSSSSGYYGSSSSssK",
        ".KKssSSSSSSSSssKK.",
        "..KssSSKKKKSSssK..",
        "..KssSK....KssSK..",
        "..KKKK......KKKK..",
      ],
    ],
  },
  gargoyle: {
    palette: {
      K: "#0C0810",
      L: "#8D889E",
      S: "#5A5569",
      s: "#2F2B3B",
      G: "#E5A93B",
      Y: "#FFE27A",
      R: "#CA1C08",
    },
    frames: [
      // Asas abertas para cima
      [
        "KKK............KKK",
        "KssKK...KK...KKssK",
        "KsSSKKKLLLLKKKSSsK",
        "KSSsSLSSSSSSLSsSSK",
        ".KsSSKYYKKYYKSSsK.",
        "..KssSRRSSRRKssK..",
        "...KSSSSSSSSSSK...",
        "...KssSLLLLSssK...",
        "....KssSSSSssK....",
        "....KssK..KssK....",
        "....KKK....KKK....",
      ],
      // Asas recolhidas para baixo
      [
        "........KK........",
        "......KKLLKK......",
        "....KKLLLLLLKK....",
        "..KKsSLSSSSLSsKK..",
        ".KssSKYYKKYYKSSsK.",
        "KssSSSRRSSRRSSSssK",
        "KssSKSSSSSSSSKSssK",
        ".KK.KssSLLSssK.KK.",
        "....KssSSSSssK....",
        "....KssK..KssK....",
        "....KKK....KKK....",
      ],
    ],
  },
  knight: {
    palette: {
      K: "#0C0810",
      R: "#CA1C08",
      r: "#7E1105",
      A: "#3E384E",
      a: "#7F7992",
      M: "#B8B3C8",
      G: "#E5A93B",
      Y: "#FFE27A",
      W: "#FFFFFF",
    },
    frames: [
      [
        "......KRRRK.......",
        ".....KRRRRrK......",
        "....KKaMMMaKK.....",
        "...KaMAAAAAMaK....",
        "...KaAKWWKAAaK....",
        "...KaAKRRKAAaK....",
        "..KKAAAGGGGAAKK...",
        ".KaMAAaGYYGaAMaK..",
        "KMAAaaAAGGAAaaAMK.",
        "KAAaKAAAAAAAAKaAK.",
        ".KK.KAAaKKaAAK.KK.",
        "....KAAK..KAAK....",
        "....KKKK..KKKK....",
      ],
      [
        ".....KRRRRK.......",
        "....KRRRRrrK......",
        "....KKaMMMaKK.....",
        "...KaMAAAAAMaK....",
        "...KaAKWWKAAaK....",
        "...KaAKRRKAAaK....",
        "..KKAAAGGGGAAKK...",
        ".KaMAAaGYYGaAMaK..",
        ".KMAAaaAGGAAaaMK..",
        ".KAAKAAAAAAAAKAAK.",
        "..KK.KAAKKAAK.KK..",
        "....KAAK..KAAK....",
        "....KKKK..KKKK....",
      ],
    ],
  },
  vortex: {
    palette: {
      K: "#0C0810",
      V: "#9B5DE5",
      v: "#4E2285",
      C: "#7DF9FF",
      G: "#E5A93B",
      Y: "#FFE27A",
      W: "#FFFFFF",
    },
    frames: [
      [
        "....KKKKKKKK....",
        "..KKVVVCCCCVKK..",
        ".KVVvvCCWWCCvVK.",
        "KVvCCWWKYYKWWCvK",
        "KVvCWWKGGGGKWCvK",
        "KVVvvCCWWWWCCvVK",
        ".KKVVvvCCCCvVKK.",
        "...KKVVvvvvKK...",
        ".....KVVVVK.....",
        "......KvvK......",
        ".......KK.......",
      ],
      [
        "....KKKKKKKK....",
        "..KKCCVVVVCCKK..",
        ".KCCvVVWWWWVvCK.",
        "KCvVVWWKGGKWWvCK",
        "KCvVWWKYYYYKWvCK",
        "KCCvvVVWWWWvvCCK",
        ".KKCCvvVVVVvCKK.",
        "...KKvvVVvvKK...",
        ".....KvvVVK.....",
        "......KvvK......",
        ".......KK.......",
      ],
    ],
  },
  skeleton: {
    palette: {
      K: "#0C0810",
      B: "#F4EFE6",
      b: "#B08A6E",
      H: "#552840",
      h: "#7A3A5C",
      G: "#E5A93B",
      R: "#CA1C08",
      Y: "#FFE27A",
    },
    frames: [
      [
        ".....KKKKKKKK.....",
        "...KKHhhhhhhHKK...",
        "..KHHBBBBBBBBHHK..",
        "..KHBKRYKKYRKBBK..",
        "..KHBBBbKKbBBHBK..",
        "...KHBBBBBBBBHK...",
        "..KKHHHHHHHHHHKK..",
        ".KHhHBGYYYYGBHhHK.",
        ".KHhHBBBBBBBBHhHK.",
        "..KHHBbKKKKbBHHK..",
        "...KHBK....KBHK...",
        "...KKKK....KKKK...",
      ],
      [
        ".....KKKKKKKK.....",
        "...KKHhhhhhhHKK...",
        "..KHHBBBBBBBBHHK..",
        "..KHBKRRKKRRKBBK..",
        "..KHBBBbKKbBBHBK..",
        "...KHBBBBBBBBHK...",
        "..KKHHHHHHHHHHKK..",
        ".KHHhBGYYYYGBhHHK.",
        ".KHHhBBBBBBBBhHHK.",
        "..KHHBbKKKKbBHHK..",
        "...KHBK....KBHK...",
        "...KKKK....KKKK...",
      ],
    ],
  },
  boss_dragon: {
    palette: {
      K: "#0C0810",
      R: "#CA1C08",
      r: "#7C1005",
      O: "#FF5C28",
      D: "#2A1525",
      d: "#180B15",
      W: "#552840",
      w: "#7D3C5F",
      G: "#E5A93B",
      Y: "#FFE27A",
      W2: "#FFFFFF",
    },
    frames: [
      // Asas erguidas, boca flamejante
      [
        "KKK......................KKK",
        "KGGKK......KKKKKK......KKGGK",
        "KrrRKK....KDDwwDDK....KKRrrK",
        "KrRRrKK..KDDWWWWDDK..KKrRRrK",
        "KRRRRrKKKDDDRRRRDDDKKKrRRRRK",
        "KrrRRRDDDDKYYKKYYKDDDDRRRrrK",
        ".KrrRRDDDDKRRKKRRKDDDDRRrrK.",
        "..KRRrDDDDDOOOOOODDDDDrRRK..",
        "...KrrDDDDDOYYYYODDDDDrrK...",
        "....KDDDDDDGGGGGGDDDDDDK....",
        "...KDDWWwGGYYYYYYGGwWWDDK...",
        "..KDDWWwDDDGGGGGGDDDwWWDDK..",
        "..KDDWWDDDDDDDDDDDDDDWWDDK..",
        "...KDDDDdKDDDDDDDDKdDDDDK...",
        "...KDDDDK..KKKKKK..KDDDDK...",
        "...KGGGK............KGGGK...",
        "...KKKK..............KKKK...",
      ],
      // Asas batendo para baixo, peito incandescente
      [
        "...........KKKKKK...........",
        "......KK..KDDwwDDK..KK......",
        "....KKGGKKDDWWWWDDKKGGKK....",
        "..KKrrRRKDDDRRRRDDDKRRrrKK..",
        ".KrrRRRRDDKYYKKYYKDDRRRRrrK.",
        "KRRRRrDDDDKRRKKRRKDDDDrRRRRK",
        "KrrRRDDDDDDOYYYYODDDDDDRRrrK",
        "KrrRDDDDDDDOOOOOODDDDDDDRrrK",
        ".KK.KDDDDDDGGGGGGDDDDDDK.KK.",
        "....KDDWWGGYYYYYYGGWWDDK....",
        "...KDDWWwDDGGGGGGDDwWWDDK...",
        "...KDDWWDDDDDDDDDDDDWWDDK...",
        "...KDDDDdKDDDDDDDDKdDDDDK...",
        "...KDDDDK..KKKKKK..KDDDDK...",
        "...KGGGK............KGGGK...",
        "...KKKK..............KKKK...",
        "............................",
      ],
    ],
  },
};

export function drawPixelGrid(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  palette: SpritePalette,
  centerX: number,
  bottomY: number,
  pixelSize: number,
  options?: {
    flipX?: boolean;
    flashColor?: string | null;
    opacity?: number;
    bobOffsetY?: number;
  }
) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const width = cols * pixelSize;
  const height = rows * pixelSize;
  const startX = Math.round(centerX - width / 2);
  const startY = Math.round(bottomY - height + (options?.bobOffsetY ?? 0));

  ctx.save();
  if (options?.opacity !== undefined) {
    ctx.globalAlpha = options.opacity;
  }

  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    for (let c = 0; c < cols; c++) {
      const ch = row[c];
      if (ch === "." || ch === " ") continue;
      const color = options?.flashColor ?? palette[ch];
      if (!color) continue;

      const drawCol = options?.flipX ? cols - 1 - c : c;
      ctx.fillStyle = color;
      ctx.fillRect(
        startX + drawCol * pixelSize,
        startY + r * pixelSize,
        pixelSize,
        pixelSize
      );
    }
  }

  ctx.restore();
}

export function drawAnimatedEnemy(
  ctx: CanvasRenderingContext2D,
  archetype: EnemyArchetype,
  timeSeconds: number,
  centerX: number,
  bottomY: number,
  pixelSize: number,
  options?: {
    flipX?: boolean;
    flashColor?: string | null;
    opacity?: number;
    bobOffsetY?: number;
  }
) {
  const sprite = ENEMY_ANIMATED_SPRITES[archetype] ?? ENEMY_ANIMATED_SPRITES.slime;
  const speed = archetype === "boss_dragon" || archetype === "gargoyle" ? 3.2 : 2.4;
  const frameIdx = Math.floor(timeSeconds * speed) % sprite.frames.length;
  drawPixelGrid(
    ctx,
    sprite.frames[frameIdx],
    sprite.palette,
    centerX,
    bottomY,
    pixelSize,
    options
  );
}

export function drawHeroWithWeapon(
  ctx: CanvasRenderingContext2D,
  weapon: TipoArmamento,
  timeSeconds: number,
  centerX: number,
  bottomY: number,
  pixelSize: number,
  opts: {
    bobY: number;
    swingAngle: number;
    flashColor: string | null;
    opacity?: number;
    chargeGlow?: number;
  }
) {
  const frameIdx = Math.floor(timeSeconds * 2.5) % HERO_ANIMATED_SPRITE.frames.length;
  drawPixelGrid(
    ctx,
    HERO_ANIMATED_SPRITE.frames[frameIdx],
    HERO_ANIMATED_SPRITE.palette,
    centerX,
    bottomY,
    pixelSize,
    {
      bobOffsetY: opts.bobY,
      flashColor: opts.flashColor,
      opacity: opts.opacity,
    }
  );

  // Arma equipada (RF-07: estritamente Espada ou Cajado)
  const handX = centerX + pixelSize * 6.4;
  const handY = bottomY - pixelSize * 7.6 + opts.bobY;

  ctx.save();
  if (opts.opacity !== undefined) ctx.globalAlpha = opts.opacity;
  ctx.translate(handX, handY);
  ctx.rotate(opts.swingAngle);

  if (weapon === "ESPADA") {
    drawPixelGrid(
      ctx,
      SWORD_SPRITE.grid,
      SWORD_SPRITE.palette,
      pixelSize * 3.0,
      pixelSize * 2.4,
      pixelSize * 0.85,
      { flashColor: opts.flashColor }
    );
  } else {
    const idlePulse = 0.25 + Math.sin(timeSeconds * 4.5) * 0.1;
    const totalGlow = Math.max(idlePulse, opts.chargeGlow ?? 0);
    const glowR = pixelSize * (3.8 + totalGlow * 4.2);
    const orbX = pixelSize * 1.3;
    const orbY = -pixelSize * 6.2;

    const glow = ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, glowR);
    glow.addColorStop(0, `rgba(125, 249, 255, ${Math.min(0.95, 0.45 + totalGlow * 0.5)})`);
    glow.addColorStop(0.55, `rgba(229, 169, 59, ${totalGlow * 0.4})`);
    glow.addColorStop(1, "rgba(125, 249, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(orbX, orbY, glowR, 0, Math.PI * 2);
    ctx.fill();

    drawPixelGrid(
      ctx,
      STAFF_SPRITE.grid,
      STAFF_SPRITE.palette,
      pixelSize * 1.3,
      pixelSize * 3.4,
      pixelSize * 0.85,
      { flashColor: opts.flashColor }
    );
  }

  ctx.restore();
}
