package com.javaquest.seguranca;

import com.javaquest.repository.RepositorioSessoesAutenticadas;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

// valida claims obrigatorias do JWT do Supabase Auth (aud, role, sub UUID e provedor Google em app_metadata)
public class ValidadorClaimsTokenSupabase implements OAuth2TokenValidator<Jwt> {

    private static final String AUDIENCIA_ESPERADA = "authenticated";
    private static final String PAPEL_ESPERADO = "authenticated";
    private static final String PROVEDOR_GOOGLE = "google";

    private final boolean exigirProvedorGoogle;

    private final RepositorioSessoesAutenticadas sessoesAutenticadas;

    public ValidadorClaimsTokenSupabase(boolean exigirProvedorGoogle, RepositorioSessoesAutenticadas sessoesAutenticadas) {
        this.sessoesAutenticadas = sessoesAutenticadas;
        this.exigirProvedorGoogle = exigirProvedorGoogle;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt tokenJwt) {
        // 1. confere se a audiencia tem "authenticated" (evita token de outro servico)
        List<String> audienciasToken = tokenJwt.getAudience();
        if (audienciasToken == null || !audienciasToken.contains(AUDIENCIA_ESPERADA)) {
            return erroValidacao("Audiencia do token JWT invalida; esperado 'authenticated'.");
        }

        // 2. barra chave anon ou qualquer role q nn seja usuario autenticado msm
        String papelToken = tokenJwt.getClaimAsString("role");
        if (!PAPEL_ESPERADO.equals(papelToken)) {
            return erroValidacao("Role do token JWT invalida; esperado 'authenticated'.");
        }

        // 3. o sub precisa ser um UUID valido pq o RLS do banco faz cast pra uuid
        String assuntoSub = tokenJwt.getSubject();
        if (assuntoSub == null || assuntoSub.isBlank()) {
            return erroValidacao("Token JWT sem claim sub.");
        }
        try {
            UUID.fromString(assuntoSub);
        } catch (IllegalArgumentException erroConversao) {
            return erroValidacao("Claim sub do token JWT nao eh um UUID valido.");
        }

        // 4. login só via Google! sempre le app_metadata (nunca user_metadata q o user pode editar)
        if (exigirProvedorGoogle && !provedorTokenEhGoogle(tokenJwt)) {
            return erroValidacao("Autenticacao permitida apenas via provedor Google.");
        }

        String sessaoInformada = tokenJwt.getClaimAsString("session_id");
        if (sessaoInformada == null) {
            return erroValidacao("Token sem identificador de sessao.");
        }
        UUID identificadorSessao;
        try {
            identificadorSessao = UUID.fromString(sessaoInformada);
        } catch (IllegalArgumentException erro) {
            return erroValidacao("Identificador de sessao invalido.");
        }
        if (sessoesAutenticadas.sessaoEncerrada(UUID.fromString(assuntoSub), identificadorSessao)) {
            return erroValidacao("Sessao encerrada.");
        }
        return OAuth2TokenValidatorResult.success();
    }

    private boolean provedorTokenEhGoogle(Jwt tokenJwt) {
        Object metadadosAppBrutos = tokenJwt.getClaims().get("app_metadata");
        if (!(metadadosAppBrutos instanceof Map<?, ?> mapaMetadadosApp)) {
            return false;
        }
        Object provedorPrincipal = mapaMetadadosApp.get("provider");
        if (!PROVEDOR_GOOGLE.equals(provedorPrincipal)) {
            return false;
        }
        Object provedoresVinculados = mapaMetadadosApp.get("providers");
        return provedoresVinculados == null || (provedoresVinculados instanceof List<?> provedores
                && !provedores.isEmpty() && provedores.stream().allMatch(PROVEDOR_GOOGLE::equals));
    }

    private OAuth2TokenValidatorResult erroValidacao(String descricaoErro) {
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", descricaoErro, null));
    }
}
