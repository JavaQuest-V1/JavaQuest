/**
 * Conversões entre os códigos do backend/banco e os tipos usados nas telas.
 * Mantém as telas intactas: elas continuam falando ESPADA/CAJADO etc.
 */

export type ArmamentoTela = "ESPADA" | "CAJADO";
export type NivelTela = "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";
export type CanalTela = "YOUTUBE" | "TIKTOK" | "INDICACAO" | "INSTAGRAM" | "OUTROS";

export const ANDARES_POR_CICLO = 10;

/** SWORD/STAFF (banco) ou ESPADA/CAJADO -> ESPADA/CAJADO */
export function armamentoParaTela(codigo: string | null | undefined, padrao: ArmamentoTela = "ESPADA"): ArmamentoTela {
  const c = (codigo ?? "").trim().toUpperCase();
  if (c === "STAFF" || c === "CAJADO") return "CAJADO";
  if (c === "SWORD" || c === "ESPADA") return "ESPADA";
  return padrao;
}

/** O backend aceita ESPADA/CAJADO e converte para SWORD/STAFF. */
export function armamentoParaBackend(arma: ArmamentoTela): string {
  return arma;
}

export function nivelParaTela(valor: string | null | undefined, padrao: NivelTela = "INICIANTE"): NivelTela {
  const v = (valor ?? "").trim().toUpperCase();
  return v === "INICIANTE" || v === "INTERMEDIARIO" || v === "AVANCADO" ? v : padrao;
}

export function canalParaTela(valor: string | null | undefined, padrao: CanalTela = "INDICACAO"): CanalTela {
  const v = (valor ?? "").trim().toUpperCase();
  return v === "YOUTUBE" || v === "TIKTOK" || v === "INDICACAO" || v === "INSTAGRAM" || v === "OUTROS"
    ? v
    : padrao;
}

export function cicloDoAndar(andar: number): number {
  return Math.floor((Math.max(1, andar) - 1) / ANDARES_POR_CICLO) + 1;
}

/** Checkpoint (andar inicial) de um ciclo: 1, 11, 21, 31... */
export function andarCheckpointDoCiclo(ciclo: number): number {
  return (Math.max(1, ciclo) - 1) * ANDARES_POR_CICLO + 1;
}

/** Andares já vencidos antes do andar atual (o backend não devolve a lista). */
export function andaresAntesDe(andar: number): number[] {
  return Array.from({ length: Math.max(0, andar - 1) }, (_, i) => i + 1);
}
