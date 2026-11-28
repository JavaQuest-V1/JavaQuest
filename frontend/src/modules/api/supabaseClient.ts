import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase Auth do front (RF-01 / RNF-10).
 *
 * O backend Spring Boot é um Resource Server que só aceita o JWT emitido pelo
 * Supabase Auth com provedor Google. Por isso o login acontece aqui no front
 * (OAuth Google via Supabase) e o `access_token` da sessão vai no header
 * `Authorization: Bearer` de todas as chamadas ao backend.
 */

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_PUBLISHABLE_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

let client: SupabaseClient | null = null;

export function isSupabaseConfigurado(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined" || !isSupabaseConfigurado()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return client;
}

/** Token atual da sessão Supabase (já renovado automaticamente pelo SDK). */
export async function obterTokenSupabase(): Promise<string | undefined> {
  const supabase = getSupabase();
  if (!supabase) return undefined;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? undefined;
}
