package com.javaquest.seguranca;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;

// representa o jogador autenticado extraido do JWT emitido pelo Supabase Auth (stateless)
public record UsuarioAutenticadoJwt(
        UUID identificadorUnicoJogador,
        String emailContaGoogle,
        String nomeCompletoContaGoogle,
        String urlFotoPerfilGoogle,
        String provedorAutenticacao,
        Instant instanteExpiracaoToken,
        UUID identificadorSessaoAutenticada) {

    // pega soh o sub (UUID) pra autorizacao e RLS; user_metadata serve soh pra sugerir nome/foto na tela
    public static UsuarioAutenticadoJwt extrairDeTokenJwt(Jwt tokenJwtValidado) {
        String assuntoToken = tokenJwtValidado.getSubject();
        if (assuntoToken == null || assuntoToken.isBlank()) {
            throw new IllegalArgumentException("Token JWT sem identificador sub do jogador.");
        }
        UUID identificadorJogador = UUID.fromString(assuntoToken);
        String emailGoogle = tokenJwtValidado.getClaimAsString("email");

        String nomeGoogle = null;
        String fotoGoogle = null;
        Object metadadosUsuarioBrutos = tokenJwtValidado.getClaims().get("user_metadata");
        if (metadadosUsuarioBrutos instanceof Map<?, ?> mapaMetadadosUsuario) {
            nomeGoogle = primeiroTextoValido(mapaMetadadosUsuario.get("full_name"), mapaMetadadosUsuario.get("name"));
            fotoGoogle = primeiroTextoValido(mapaMetadadosUsuario.get("avatar_url"), mapaMetadadosUsuario.get("picture"));
        }

        // provedor vem de app_metadata (controlado pelo servidor do Supabase, nunca editavel pelo cliente)
        String provedorApp = null;
        Object metadadosAppBrutos = tokenJwtValidado.getClaims().get("app_metadata");
        if (metadadosAppBrutos instanceof Map<?, ?> mapaMetadadosApp) {
            provedorApp = primeiroTextoValido(mapaMetadadosApp.get("provider"), null);
        }

        return new UsuarioAutenticadoJwt(
                identificadorJogador,
                emailGoogle,
                nomeGoogle,
                fotoGoogle,
                provedorApp,
                tokenJwtValidado.getExpiresAt(),
                UUID.fromString(tokenJwtValidado.getClaimAsString("session_id")));
    }

    // sugere o primeiro nome da conta Google no onboarding (RF-02)
    public String sugerirPrimeiroNomeApelido() {
        if (nomeCompletoContaGoogle == null || nomeCompletoContaGoogle.isBlank()) {
            return "";
        }
        return nomeCompletoContaGoogle.trim().split("\\s+")[0];
    }

    private static String primeiroTextoValido(Object primeiraOpcao, Object segundaOpcao) {
        if (primeiraOpcao instanceof String texto && !texto.isBlank()) {
            return texto.trim();
        }
        if (segundaOpcao instanceof String texto && !texto.isBlank()) {
            return texto.trim();
        }
        return null;
    }
}
