"use client";

import React, { useMemo, useState } from "react";
import { BlocoCodigo } from "../../types/gameplay";
import { JavaSyntaxHighlight } from "../ui/DesignSystemPrimitives";

const LACUNA_REGEX = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

/** Dados arrastados: bloco da bandeja ou bloco já encaixado em uma lacuna. */
export const DRAG_BLOCO = "application/x-jq-bloco";
export const DRAG_LACUNA = "application/x-jq-lacuna";

type Segmento = { tipo: "codigo"; texto: string } | { tipo: "lacuna"; indice: number };

function dividirTemplate(template: string, lacunas: string[]): Segmento[] {
  const segmentos: Segmento[] = [];
  let ultimo = 0;
  let ordem = 0;
  for (const match of template.matchAll(LACUNA_REGEX)) {
    const inicio = match.index ?? 0;
    if (inicio > ultimo) segmentos.push({ tipo: "codigo", texto: template.slice(ultimo, inicio) });
    const pelaChave = lacunas.indexOf(match[1]);
    segmentos.push({ tipo: "lacuna", indice: pelaChave >= 0 ? pelaChave : ordem });
    ordem += 1;
    ultimo = inicio + match[0].length;
  }
  if (ultimo < template.length) segmentos.push({ tipo: "codigo", texto: template.slice(ultimo) });
  return segmentos;
}

interface TemplateCodeEditorProps {
  template: string;
  lacunas: string[];
  slotBlocks: (BlocoCodigo | null)[];
  editavel: boolean;
  completo: boolean;
  /** Lacuna selecionada: o próximo bloco clicado na bandeja vai para ela. */
  lacunaAtiva: number | null;
  onSelecionarLacuna: (indice: number | null) => void;
  onEncaixar: (blockId: string, indice: number) => void;
  onTrocarLacunas: (de: number, para: number) => void;
  onRemover: (blockId: string) => void;
}

/**
 * Código Java inteiro com as lacunas no lugar: o jogador completa o código
 * clicando/arrastando os blocos direto para o espaço vazio.
 */
export function TemplateCodeEditor({
  template,
  lacunas,
  slotBlocks,
  editavel,
  completo,
  lacunaAtiva,
  onSelecionarLacuna,
  onEncaixar,
  onTrocarLacunas,
  onRemover,
}: TemplateCodeEditorProps) {
  const segmentos = useMemo(() => dividirTemplate(template, lacunas), [template, lacunas]);
  const [lacunaSobre, setLacunaSobre] = useState<number | null>(null);

  const soltarNaLacuna = (e: React.DragEvent, indice: number) => {
    e.preventDefault();
    setLacunaSobre(null);
    if (!editavel) return;
    const bloco = e.dataTransfer.getData(DRAG_BLOCO);
    const origem = e.dataTransfer.getData(DRAG_LACUNA);
    if (bloco) onEncaixar(bloco, indice);
    else if (origem !== "") onTrocarLacunas(Number(origem), indice);
  };

  return (
    <div
      className={`font-code overflow-x-auto whitespace-pre-wrap break-words rounded-xl border-2 bg-[#0C0810] p-3.5 text-[14px] leading-[2.4] transition-colors ${
        completo ? "border-[#5A8F49]" : "border-[#6C6877]/45"
      }`}
    >
      {segmentos.map((seg, i) => {
        if (seg.tipo === "codigo") {
          return <JavaSyntaxHighlight key={`c-${i}`} code={seg.texto} />;
        }

        const bloco = slotBlocks[seg.indice] ?? null;
        const ativa = lacunaAtiva === seg.indice;
        const sobre = lacunaSobre === seg.indice;
        const handlers = {
          onDragOver: (e: React.DragEvent) => {
            if (!editavel) return;
            e.preventDefault();
            setLacunaSobre(seg.indice);
          },
          onDragLeave: () => setLacunaSobre((v) => (v === seg.indice ? null : v)),
          onDrop: (e: React.DragEvent) => soltarNaLacuna(e, seg.indice),
        };

        if (bloco) {
          return (
            <button
              key={`l-${i}`}
              type="button"
              draggable={editavel}
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_LACUNA, String(seg.indice));
                e.dataTransfer.effectAllowed = "move";
              }}
              {...handlers}
              onClick={() => onRemover(bloco.id)}
              disabled={!editavel}
              title="Clique para tirar o bloco ou arraste para outra lacuna"
              className={`mx-0.5 inline cursor-pointer rounded-md border-2 bg-[#1B1118] px-1.5 py-0.5 align-baseline transition-colors hover:border-[#CA1C08] ${
                sobre ? "border-[#8CE070]" : "border-[#E5A93B]/80"
              }`}
            >
              <JavaSyntaxHighlight code={bloco.texto} />
            </button>
          );
        }

        return (
          <button
            key={`l-${i}`}
            type="button"
            {...handlers}
            onClick={() => onSelecionarLacuna(ativa ? null : seg.indice)}
            disabled={!editavel}
            title="Lacuna vazia: clique e escolha um bloco, ou arraste um bloco até aqui"
            aria-label={`Lacuna ${seg.indice + 1} vazia`}
            className={`mx-0.5 inline-block min-w-[64px] cursor-pointer rounded-md border-2 border-dashed px-2 align-middle leading-[1.6] transition-colors ${
              sobre || ativa
                ? "border-[#E5A93B] bg-[#E5A93B]/15"
                : "border-[#6C6877] bg-[#1B1118]/60 hover:border-[#B08A6E]"
            }`}
          >
            <span className="text-[11px] font-bold text-[#6C6877]">{seg.indice + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
