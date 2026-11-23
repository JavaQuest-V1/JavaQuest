package com.javaquest.seguranca;

import java.util.Map;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;

// representa o jogador autenticado extraido do JWT emitido pelo Supabase Auth (stateless)
public record UsuarioAutenticadoJwt(
        UUID identificadorUnicoJogador,
        String emailContaGoogle,
        String nomeCompletoContaGoogle,
        String urlFotoPerfilGoogle) {

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
        Object metadadosBrutos = tokenJwtValidado.getClaims().get("user_metadata");
        if (metadadosBrutos instanceof Map<?, ?> mapaMetadados) {
            nomeGoogle = primeiroTextoValido(mapaMetadados.get("full_name"), mapaMetadados.get("name"));
            fotoGoogle = primeiroTextoValido(mapaMetadados.get("avatar_url"), mapaMetadados.get("picture"));
        }

        return new UsuarioAutenticadoJwt(identificadorJogador, emailGoogle, nomeGoogle, fotoGoogle);
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
