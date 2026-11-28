"use client";

import React from "react";
import { Monitor, RefreshCw, WifiOff } from "lucide-react";
import { ConnectionStatus } from "../../types/gameplay";

/**
 * Indicador de reconexão de rede (RNF-21) e aviso orientativo para
 * dispositivos móveis de tela reduzida (RNF-19).
 */
export function ReconnectionBanner({
  connectionStatus,
  isMobileViewport,
  mobileNoticeDismissed,
  onDismissMobileNotice,
}: {
  connectionStatus: ConnectionStatus;
  isMobileViewport: boolean;
  mobileNoticeDismissed: boolean;
  onDismissMobileNotice: () => void;
}) {
  return (
    <>
      {(connectionStatus === "RECONNECTING" || connectionStatus === "OFFLINE") && (
        <div
          role="status"
          className="fixed left-1/2 top-16 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#E5A93B] bg-[#5A3E18]/95 px-4 py-1.5 text-xs font-bold text-[#F4EFE6] shadow-xl backdrop-blur-md"
        >
          {connectionStatus === "RECONNECTING" ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#E5A93B]" />
              <span>
                Instabilidade detectada — reconectando ao servidor Java sem perder seu checkpoint...
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-[#FF8A7A]" />
              <span>
                Sem conexão com a API Java. Seu último checkpoint permanece salvo com segurança.
              </span>
            </>
          )}
        </div>
      )}

      {isMobileViewport && !mobileNoticeDismissed && (
        <div className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-between gap-3 rounded-2xl border-2 border-[#E5A93B] bg-[#1B1118]/95 p-3.5 text-xs text-[#F4EFE6] shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <Monitor className="h-5 w-5 shrink-0 text-[#E5A93B]" />
            <p className="leading-snug">
              <strong className="text-[#E5A93B]">Melhor em Desktop/Notebook:</strong>{" "}
              A interface do JavaQuest foi otimizada para telas maiores e atalhos de teclado (RNF-19).
            </p>
          </div>
          <button
            type="button"
            onClick={onDismissMobileNotice}
            className="jq-btn-stone shrink-0 cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase"
          >
            Entendi
          </button>
        </div>
      )}
    </>
  );
}
