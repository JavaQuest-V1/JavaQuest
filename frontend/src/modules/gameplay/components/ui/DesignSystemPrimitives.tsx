"use client";

import React from "react";
import { X } from "lucide-react";

type OctagonTone = "gold" | "emerald" | "crimson" | "stone" | "dark";

const OCTAGON_COLORS: Record<OctagonTone, { outer: string; inner: string }> = {
  gold: { outer: "#E5A93B", inner: "#20122E" },
  emerald: { outer: "#5A8F49", inner: "#264A2B" },
  crimson: { outer: "#CA1C08", inner: "#4A1112" },
  stone: { outer: "#6C6877", inner: "#20122E" },
  dark: { outer: "#382940", inner: "#160D1A" },
};

/**
 * Medalhão octogonal facetado (Pedra Facetada) do JavaQuest UI System.
 */
export function OctagonBadge({
  tone = "stone",
  size = 44,
  children,
  className = "",
}: {
  tone?: OctagonTone;
  size?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const palette = OCTAGON_COLORS[tone];
  const inset = Math.max(3, Math.round(size * 0.1));

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="jq-octagon absolute inset-0"
        style={{ backgroundColor: palette.outer }}
      />
      <div
        className="jq-octagon relative flex items-center justify-center text-[#F4EFE6]"
        style={{
          width: size - inset * 2,
          height: size - inset * 2,
          backgroundColor: palette.inner,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Painel de Couro Costurado (#552840) com costura pontilhada (#B08A6E),
 * alça de couro (#70443C), fivela metálica (#6C6877) e placa de pedra (#262134),
 * replicando o componente principal de `Desing system.png`.
 */
export function StitchedLeatherPanel({
  title,
  onClose,
  closeLabel = "Fechar",
  children,
  className = "",
  innerClassName = "",
}: {
  title: string;
  onClose?: () => void;
  closeLabel?: string;
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={`jq-leather-panel rounded-[22px] p-2.5 ${className}`}>
      {/* Alça de couro superior + fivela + placa de pedra */}
      <div className="pointer-events-none absolute -top-5 left-1/2 z-20 flex -translate-x-1/2 items-center">
        <div className="jq-belt-strap flex h-8 items-center rounded-full px-3.5">
          {/* 3 furinhos do cinto à esquerda */}
          <div className="mr-3 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2A1414]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#2A1414]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#2A1414]" />
          </div>

          {/* Placa central de pedra facetada */}
          <div className="jq-stone-plaque -my-1.5 rounded-xl px-5 py-1.5">
            <span className="font-display whitespace-nowrap text-base font-bold uppercase tracking-wider text-[#F4EFE6]">
              {title}
            </span>
          </div>

          {/* Fivela metálica à direita */}
          <div className="ml-3 flex h-6 w-5 items-center justify-end rounded-[5px] border-[3px] border-[#9A96A6] pr-0.5">
            <span className="h-0.5 w-2 rounded-full bg-[#9A96A6]" />
          </div>
        </div>
      </div>

      {/* Botão octogonal vermelho de fechar (X) */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          title={closeLabel}
          className="jq-octagon absolute -right-3 -top-3 z-30 flex h-10 w-10 cursor-pointer items-center justify-center bg-[#CA1C08] text-[#F4EFE6] shadow-lg transition-transform hover:scale-105 hover:bg-[#E32B16]"
        >
          <X className="h-5 w-5 stroke-[3]" />
        </button>
      )}

      {/* Borda interna de costura pontilhada */}
      <div className={`jq-leather-stitch h-full w-full p-4 pt-6 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * Syntax highlighter Java leve para blocos e preview de código (RNF-16:
 * fonte monoespaçada >= 14px, alto contraste sobre fundo escuro, sem ambiguidade).
 */
const JAVA_KEYWORDS = new Set([
  "int",
  "double",
  "boolean",
  "void",
  "if",
  "else",
  "while",
  "for",
  "return",
  "new",
  "true",
  "false",
  "public",
  "static",
]);

const JAVA_TYPES = new Set(["String", "System", "out"]);

export function JavaSyntaxHighlight({
  code,
  className = "",
}: {
  code: string;
  className?: string;
}) {
  const tokenRegex =
    /("(?:[^"\\]|\\.)*"|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b|[{}()[\];.=<>!+\-*/]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = tokenRegex.exec(code)) !== null) {
    if (match.index > lastIdx) {
      parts.push(
        <span key={`ws-${keyCounter++}`}>{code.slice(lastIdx, match.index)}</span>
      );
    }

    const token = match[0];
    let colorClass = "text-[#F4EFE6]";

    if (token.startsWith('"')) {
      colorClass = "text-[#8CE070]";
    } else if (/^\d/.test(token)) {
      colorClass = "text-[#F7B955]";
    } else if (JAVA_KEYWORDS.has(token)) {
      colorClass = "text-[#E5A93B] font-bold";
    } else if (JAVA_TYPES.has(token)) {
      colorClass = "text-[#79C0FF] font-semibold";
    } else if (
      code.slice(match.index + token.length).trimStart().startsWith("(")
    ) {
      colorClass = "text-[#D4A6FF] font-semibold";
    } else if (/^[{}()[\];]+$/.test(token)) {
      colorClass = "text-[#B08A6E]";
    } else if (/^[=<>!+\-*/]+$/.test(token)) {
      colorClass = "text-[#FF8A7A]";
    }

    parts.push(
      <span key={`tk-${keyCounter++}`} className={colorClass}>
        {token}
      </span>
    );
    lastIdx = match.index + token.length;
  }

  if (lastIdx < code.length) {
    parts.push(<span key={`tail-${keyCounter++}`}>{code.slice(lastIdx)}</span>);
  }

  return <span className={`font-code ${className}`}>{parts}</span>;
}
