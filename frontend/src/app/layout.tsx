import type { Metadata } from "next";
import { PlayerAccountProvider } from "@platform/controllers/PlayerAccountContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "JavaQuest — Aprenda Java em Combate RPG",
  description:
    "Plataforma web gamificada JavaQuest em Next.js: trilha guiada, grimório de sintaxe, treino livre, ranking, perfil do herói e arena de combate 2.5D pixel-art.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased selection:bg-[#E5A93B]/30 selection:text-[#F4EFE6]">
        <PlayerAccountProvider>{children}</PlayerAccountProvider>
      </body>
    </html>
  );
}
