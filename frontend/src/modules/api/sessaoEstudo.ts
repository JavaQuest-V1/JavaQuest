/**
 * Guarda o id da sessão de estudo ativa (RF-24) devolvido pelo backend em
 * `POST /autenticacao/sessao` ou `POST /sessoes-estudo/abrir`.
 * Compartilhado entre a plataforma (logout) e o cronômetro do gameplay.
 */
const STORAGE_KEY = "javaquest_sessao_estudo";

let emMemoria: string | undefined;

export const sessaoEstudo = {
  obter(): string | undefined {
    if (emMemoria) return emMemoria;
    if (typeof window === "undefined") return undefined;
    try {
      emMemoria = window.sessionStorage.getItem(STORAGE_KEY) ?? undefined;
    } catch {
      // sessionStorage indisponível
    }
    return emMemoria;
  },

  definir(id: string | null | undefined): void {
    emMemoria = id || undefined;
    if (typeof window === "undefined") return;
    try {
      if (emMemoria) window.sessionStorage.setItem(STORAGE_KEY, emMemoria);
      else window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignora
    }
  },
};
