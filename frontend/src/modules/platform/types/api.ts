/**
 * DTOs da plataforma. Os DTOs que vêm do backend Spring Boot estão em
 * `@api/backendTypes` (espelho dos records Java).
 */
import { RankingEntry } from "./platform";

/**
 * GET /api/ranking — PRÓXIMA ATUALIZAÇÃO NO BACK (rota ainda não existe).
 * Formato esperado pelo front quando o backend implementar o ranking semanal.
 */
export type RankingResponse = RankingEntry[];
