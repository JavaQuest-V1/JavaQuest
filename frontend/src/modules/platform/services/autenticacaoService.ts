import { API_ROUTES } from "@api/endpoints";
import { apiClient, novaChaveIdempotencia } from "@api/httpClient";
import { getSupabase } from "@api/supabaseClient";
import { ResultadoSincronizacaoGoogle } from "@api/backendTypes";

/**
 * @service — espelha o `AutenticacaoController` do Spring Boot (RF-01, RF-05, RNF-10).
 *
 * Fluxo: o login Google acontece no Supabase Auth (OAuth com redirect). Ao
 * voltar para `/login`, o front chama `POST /api/v1/autenticacao/sessao` com o
 * JWT do Supabase, e o backend cria o perfil (1º acesso), abre a sessão de
 * estudo e informa se o onboarding está pendente.
 */
export const autenticacaoService = {
  /** Redireciona para o consentimento Google do Supabase Auth. */
  async entrarComGoogle(redirectPath = "/login"): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error(
        "Supabase Auth não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local."
      );
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    });
    if (error) throw new Error(error.message);
  },

  /** true quando já existe sessão Supabase (ex.: voltando do redirect do Google). */
  async possuiSessaoAtiva(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session?.access_token);
  },

  /** Sincroniza a sessão Google com o backend (idempotente). */
  async sincronizarSessao(): Promise<ResultadoSincronizacaoGoogle> {
    return apiClient.requestJson<ResultadoSincronizacaoGoogle>(
      API_ROUTES.autenticacao.sincronizarSessao(),
      { method: "POST", headers: { "Idempotency-Key": novaChaveIdempotencia() } }
    );
  },

  /** Fecha a sessão de estudo no backend e encerra o token no Supabase (mesmo se o servidor falhar). */
  async sair(identificadorSessaoEstudo?: string): Promise<void> {
    try {
      if (apiClient.isApiMode()) {
        await apiClient.requestJson<void>(API_ROUTES.autenticacao.sair(), {
          method: "POST",
          body: identificadorSessaoEstudo ? { identificadorSessaoEstudo } : {},
          retries: 0,
        });
      }
    } finally {
      apiClient.clearAuthToken();
      await getSupabase()?.auth.signOut().catch(() => undefined);
    }
  },
};
