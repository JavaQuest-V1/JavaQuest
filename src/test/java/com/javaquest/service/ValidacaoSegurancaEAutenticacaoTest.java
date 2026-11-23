package com.javaquest.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.javaquest.dominio.CanalAquisicao;
import com.javaquest.dominio.NivelExperiencia;
import com.javaquest.dominio.TipoArmamentoHeroi;
import com.javaquest.repository.ExecutorComandoBancoJogador;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroAparenciaHeroi2D;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroArmamentoCatalogo2D;
import com.javaquest.repository.RepositorioMetricasEstudoSupabase;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import com.javaquest.seguranca.ValidadorClaimsTokenSupabase;
import java.time.Instant;
import java.time.OffsetDateTime;
import com.javaquest.repository.RepositorioSessoesAutenticadas;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import tools.jackson.databind.ObjectMapper;

// testa validacao de JWT do Supabase Google Auth + AutenticacaoService + JogadorService
class ValidacaoSegurancaEAutenticacaoTest {

    private static final UUID JOGADOR_TESTE_ID = UUID.fromString("12345678-1234-4123-8123-1234567890ab");

    @Test
    void deveRejeitarOutraIdentidadeVinculadaESessaoEncerrada() {
        var sessoes = mock(RepositorioSessoesAutenticadas.class);
        var validador = new ValidadorClaimsTokenSupabase(true, sessoes);
        Jwt vinculado = criarJwtMock(JOGADOR_TESTE_ID.toString(), List.of("authenticated"), "authenticated",
                Map.of("provider", "google", "providers", List.of("google", "email")), Map.of());
        assertTrue(validador.validate(vinculado).hasErrors());
        Jwt encerrado = criarJwtMock(JOGADOR_TESTE_ID.toString(), List.of("authenticated"), "authenticated",
                Map.of("provider", "google"), Map.of());
        when(sessoes.sessaoEncerrada(JOGADOR_TESTE_ID, UUID.fromString(encerrado.getClaimAsString("session_id"))))
                .thenReturn(true);
        assertTrue(validador.validate(encerrado).hasErrors());
    }

    @Test
    void deveAceitarJwtValidoDoSupabaseComProvedorGoogle() {
        Jwt jwtValidoGoogle = criarJwtMock(
                JOGADOR_TESTE_ID.toString(),
                List.of("authenticated"),
                "authenticated",
                Map.of("provider", "google", "providers", List.of("google")),
                Map.of("full_name", "Marcos Vinicius", "avatar_url", "https://foto.test/avatar.png"));

        ValidadorClaimsTokenSupabase validador = new ValidadorClaimsTokenSupabase(true, mock(RepositorioSessoesAutenticadas.class));
        OAuth2TokenValidatorResult resultado = validador.validate(jwtValidoGoogle);

        assertFalse(resultado.hasErrors());

        UsuarioAutenticadoJwt usuario = UsuarioAutenticadoJwt.extrairDeTokenJwt(jwtValidoGoogle);
        assertEquals(JOGADOR_TESTE_ID, usuario.identificadorUnicoJogador());
        assertEquals("Marcos", usuario.sugerirPrimeiroNomeApelido());
        assertEquals("google", usuario.provedorAutenticacao());
    }

    @Test
    void deveRejeitarJwtQueNaoSejaGoogleOuQueTenhaRoleAnonOuAudienciaErrada() {
        ValidadorClaimsTokenSupabase validadorEstrito = new ValidadorClaimsTokenSupabase(true, mock(RepositorioSessoesAutenticadas.class));

        // bloqueia login por email/senha (viola RF-01 e RNF-10)
        Jwt jwtEmailSenha = criarJwtMock(
                JOGADOR_TESTE_ID.toString(),
                List.of("authenticated"),
                "authenticated",
                Map.of("provider", "email"),
                Map.of());
        assertTrue(validadorEstrito.validate(jwtEmailSenha).hasErrors());

        // bloqueia chave anon
        Jwt jwtAnon = criarJwtMock(
                JOGADOR_TESTE_ID.toString(),
                List.of("authenticated"),
                "anon",
                Map.of("provider", "google"),
                Map.of());
        assertTrue(validadorEstrito.validate(jwtAnon).hasErrors());

        // bloqueia sub q nao eh UUID valido
        Jwt jwtSubInvalido = criarJwtMock(
                "nao-eh-uuid",
                List.of("authenticated"),
                "authenticated",
                Map.of("provider", "google"),
                Map.of());
        assertTrue(validadorEstrito.validate(jwtSubInvalido).hasErrors());

        // bloqueia audiencia diferente de authenticated
        Jwt jwtAudienciaErrada = criarJwtMock(
                JOGADOR_TESTE_ID.toString(),
                List.of("outro-servico"),
                "authenticated",
                Map.of("provider", "google"),
                Map.of());
        assertTrue(validadorEstrito.validate(jwtAudienciaErrada).hasErrors());
    }

    @Test
    void deveSincronizarPrimeiroAcessoViaRegisterEAbrirSessaoDeEstudo() {
        ExecutorComandoBancoJogador executorMock = mock(ExecutorComandoBancoJogador.class);
        RepositorioPerfilEProgressoSupabase perfilRepoMock = mock(RepositorioPerfilEProgressoSupabase.class);
        RepositorioCatalogoBancoSupabase catalogoRepoMock = mock(RepositorioCatalogoBancoSupabase.class);
        RepositorioMetricasEstudoSupabase metricasRepoMock = mock(RepositorioMetricasEstudoSupabase.class);

        UUID sessaoEstudoId = UUID.randomUUID();
        UUID chaveIdempotencia = UUID.randomUUID();

        RegistroPerfilComProgresso perfilRecemCriado = new RegistroPerfilComProgresso(
                JOGADOR_TESTE_ID, null, null, null, "HERO_DEFAULT_2D", null, null, 1);

        when(perfilRepoMock.buscarPerfilComProgresso(JOGADOR_TESTE_ID))
                .thenReturn(Optional.of(perfilRecemCriado));
        when(executorMock.executarComandoIdempotente(eq(JOGADOR_TESTE_ID), eq(chaveIdempotencia), eq("register"), any()))
                .thenReturn(new ObjectMapper().createObjectNode().put("created", true));
        when(metricasRepoMock.abrirOuRecuperarSessaoEstudo(JOGADOR_TESTE_ID)).thenReturn(sessaoEstudoId);
        when(catalogoRepoMock.buscarAparenciaPadraoHeroi()).thenReturn(Optional.of(
                new RegistroAparenciaHeroi2D("HERO_DEFAULT_2D", "Aprendiz Java", null, 32, 32, "{}")));

        AutenticacaoService autenticacaoService = new AutenticacaoService(
                executorMock, perfilRepoMock, catalogoRepoMock, metricasRepoMock,
                new MetricasService(metricasRepoMock, perfilRepoMock, catalogoRepoMock), mock(RepositorioSessoesAutenticadas.class));
        when(metricasRepoMock.buscarMetricasConsolidadas(JOGADOR_TESTE_ID)).thenReturn(Optional.of(
                new RepositorioMetricasEstudoSupabase.RegistroMetricasConsolidadasJogador(JOGADOR_TESTE_ID, 0, 0, 0, 0, 0)));

        UsuarioAutenticadoJwt usuario = new UsuarioAutenticadoJwt(
                JOGADOR_TESTE_ID, "marcos@test.com", "Marcos Vinicius", "https://foto.test/a.png", "google", Instant.now().plusSeconds(3600), UUID.randomUUID());

        AutenticacaoService.ResultadoSincronizacaoGoogle resposta =
                autenticacaoService.sincronizarSessaoComGoogle(usuario, chaveIdempotencia);

        assertTrue(resposta.primeiroAcesso());
        assertTrue(resposta.onboardingPendente());
        assertEquals("Marcos", resposta.apelidoSugerido());
        assertEquals(sessaoEstudoId, resposta.identificadorSessaoEstudoAtiva());
        assertEquals(1, resposta.perfilComProgresso().calcularAndarMaiorCheckpoint());

        // testa encerramento de sessao no logout
        autenticacaoService.encerrarSessaoJogador(usuario, sessaoEstudoId);
        verify(metricasRepoMock).encerrarSessaoEstudo(JOGADOR_TESTE_ID, sessaoEstudoId);
    }

    @Test
    @SuppressWarnings("unchecked")
    void deveConcluirOnboardingEnviandoPayloadExatoParaOBancoEValidarLimiteDeApelido() {
        ExecutorComandoBancoJogador executorMock = mock(ExecutorComandoBancoJogador.class);
        RepositorioPerfilEProgressoSupabase perfilRepoMock = mock(RepositorioPerfilEProgressoSupabase.class);
        RepositorioCatalogoBancoSupabase catalogoRepoMock = mock(RepositorioCatalogoBancoSupabase.class);

        UUID chaveIdempotencia = UUID.randomUUID();
        RegistroPerfilComProgresso perfilPosOnboarding = new RegistroPerfilComProgresso(
                JOGADOR_TESTE_ID, "MarcosDev", "INTERMEDIARIO", "YOUTUBE",
                "HERO_DEFAULT_2D", "SWORD", OffsetDateTime.now(), 1);

        when(executorMock.executarComandoIdempotente(eq(JOGADOR_TESTE_ID), eq(chaveIdempotencia), eq("onboarding"), any()))
                .thenReturn(new ObjectMapper().createObjectNode());
        when(perfilRepoMock.buscarPerfilComProgresso(JOGADOR_TESTE_ID)).thenReturn(Optional.of(perfilPosOnboarding));
        when(catalogoRepoMock.buscarAparenciaPadraoHeroi()).thenReturn(Optional.empty());
        when(catalogoRepoMock.listarArmamentosAtivos()).thenReturn(List.of(
                new RegistroArmamentoCatalogo2D("SWORD", "Espada", "PHYSICAL", "MELEE", null, "{}", true)));

        JogadorService jogadorService = new JogadorService(executorMock, perfilRepoMock, catalogoRepoMock);
        UsuarioAutenticadoJwt usuario = new UsuarioAutenticadoJwt(
                JOGADOR_TESTE_ID, "marcos@test.com", "Marcos Vinicius", null, "google", Instant.now().plusSeconds(3600), UUID.randomUUID());

        JogadorService.PerfilCompletoJogador perfilSalvo = jogadorService.concluirOnboardingJogador(
                usuario,
                chaveIdempotencia,
                new JogadorService.DadosOnboardingJogador(
                        "  MarcosDev  ",
                        NivelExperiencia.INTERMEDIARIO,
                        CanalAquisicao.YOUTUBE,
                        TipoArmamentoHeroi.ESPADA));

        assertTrue(perfilSalvo.perfilComProgresso().onboardingFoiConcluido());
        assertEquals("SWORD", perfilSalvo.perfilComProgresso().codigoArmamentoPreferido());

        ArgumentCaptor<Map<String, Object>> capturadorPayload = ArgumentCaptor.forClass(Map.class);
        verify(executorMock).executarComandoIdempotente(
                eq(JOGADOR_TESTE_ID), eq(chaveIdempotencia), eq("onboarding"), capturadorPayload.capture());

        Map<String, Object> payloadEnviado = capturadorPayload.getValue();
        assertEquals("MarcosDev", payloadEnviado.get("nickname"));
        assertEquals("INTERMEDIARIO", payloadEnviado.get("experience"));
        assertEquals("YOUTUBE", payloadEnviado.get("channel"));
        assertEquals("SWORD", payloadEnviado.get("weapon"));

        // barra apelido acima de 30 caracteres (constraint varchar(30) do banco)
        assertThrows(IllegalArgumentException.class, () -> jogadorService.concluirOnboardingJogador(
                usuario,
                UUID.randomUUID(),
                new JogadorService.DadosOnboardingJogador(
                        "ApelidoExtremamenteGiganteComMaisDeTrintaCaracteres",
                        NivelExperiencia.INICIANTE,
                        CanalAquisicao.OUTROS,
                        TipoArmamentoHeroi.CAJADO)));
    }

    private Jwt criarJwtMock(
            String sub,
            List<String> audiencias,
            String role,
            Map<String, Object> appMetadata,
            Map<String, Object> userMetadata) {
        return Jwt.withTokenValue("token-simulado")
                .header("alg", "ES256")
                .subject(sub)
                .claim("session_id", UUID.randomUUID().toString())
                .issuer("https://ktksibdcggnpcyxgmfvf.supabase.co/auth/v1")
                .audience(audiencias)
                .issuedAt(Instant.now().minusSeconds(10))
                .expiresAt(Instant.now().plusSeconds(3600))
                .claim("role", role)
                .claim("email", "marcos@test.com")
                .claim("app_metadata", appMetadata)
                .claim("user_metadata", userMetadata)
                .build();
    }
}
