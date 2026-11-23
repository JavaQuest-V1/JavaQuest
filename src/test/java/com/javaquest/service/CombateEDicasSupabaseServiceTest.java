package com.javaquest.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.javaquest.dominio.BlocoCodigoDisponivel;
import com.javaquest.dominio.CategoriaErro;
import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import com.javaquest.dominio.RespostaBlocosEnviadaJogador;
import com.javaquest.dominio.ResultadoExecucaoSubmissao;
import com.javaquest.dominio.TipoAcaoHeroi;
import com.javaquest.persistencia.ExecutorComandoBancoJogador;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase.RegistroInimigoAndar;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase.RegistroMetadadosDesafioBanco;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroTentativaAndar;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroTentativaCiclo;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.ObjectMapper;

// testa Prioridade 3: CombateService + VidasDicasService integrados aos comandos do Supabase
class CombateEDicasSupabaseServiceTest {

    private static final UUID JOGADOR_ID = UUID.fromString("bbbbbbbb-2222-4222-8222-222222222222");

    private ExecutorComandoBancoJogador executorMock;
    private RepositorioCatalogoBancoSupabase catalogoBancoMock;
    private RepositorioPerfilEProgressoSupabase perfilRepoMock;
    private CatalogoDesafiosBlocosPadrao catalogoBlocos;
    private GeradorInstanciaDesafioBlocos geradorInstancia;
    private CombateService combateService;
    private VidasDicasService vidasDicasService;
    private UsuarioAutenticadoJwt usuarioTeste;
    private ObjectMapper conversorJson;

    @BeforeEach
    void prepararCenarioTeste() {
        this.executorMock = mock(ExecutorComandoBancoJogador.class);
        this.catalogoBancoMock = mock(RepositorioCatalogoBancoSupabase.class);
        this.perfilRepoMock = mock(RepositorioPerfilEProgressoSupabase.class);
        this.catalogoBlocos = new CatalogoDesafiosBlocosPadrao();
        this.geradorInstancia = new GeradorInstanciaDesafioBlocos();
        SorteadorVarianteDesafioService sorteador = new SorteadorVarianteDesafioService();
        ValidacaoJavaService validacaoService = new ValidacaoJavaService(geradorInstancia);

        this.combateService = new CombateService(
                catalogoBlocos,
                sorteador,
                geradorInstancia,
                validacaoService,
                executorMock,
                catalogoBancoMock,
                perfilRepoMock);
        this.vidasDicasService = new VidasDicasService(executorMock, perfilRepoMock);
        this.usuarioTeste = new UsuarioAutenticadoJwt(
                JOGADOR_ID, "marcos@test.com", "Marcos", null, "google", Instant.now().plusSeconds(3600));
        this.conversorJson = new ObjectMapper();
    }

    @Test
    void deveIniciarAndarViaStartFloorEGerarBlocosEmbaralhadosComInimigos2D() {
        UUID runId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID chaveIdempotencia = UUID.randomUUID();

        when(executorMock.executarComandoIdempotente(eq(JOGADOR_ID), eq(chaveIdempotencia), eq("start_floor"), any()))
                .thenReturn(conversorJson.readTree(
                        "{\"attempt_id\":\"" + attemptId + "\",\"challenge_id\":2,\"floor\":1}"));
        when(catalogoBancoMock.buscarMetadadosDesafioPorId(2L)).thenReturn(Optional.of(
                new RegistroMetadadosDesafioBanco(2L, 1, "v2", 1, "Enunciado banco", "{}", true)));
        when(catalogoBancoMock.listarInimigosPorAndar(1)).thenReturn(List.of(
                new RegistroInimigoAndar(1L, "Guardiao dos fundamentos", false, null, "{}", 1)));
        when(perfilRepoMock.buscarTentativaCicloPorId(JOGADOR_ID, runId)).thenReturn(Optional.of(
                new RegistroTentativaCiclo(runId, JOGADOR_ID, 1, "SWORD", "ACTIVE", 1, 3, 3, OffsetDateTime.now(), null)));

        CombateService.AberturaAndarArenaSupabase abertura =
                combateService.iniciarAndarNaRunSupabase(usuarioTeste, chaveIdempotencia, runId);

        assertEquals(attemptId, abertura.identificadorTentativaAndar());
        assertEquals(1, abertura.numeroAndarNaTorre());
        assertFalse(abertura.andarDeChefe());
        assertEquals("SWORD", abertura.codigoArmamentoFixoDaRun());
        assertEquals("v2", abertura.desafioPublicoEmbaralhado().chaveVarianteNoAndar());
        assertFalse(abertura.desafioPublicoEmbaralhado().blocosDisponiveisEmbaralhados().isEmpty());
        assertEquals(1, abertura.inimigosDoAndar().size());
    }

    @Test
    @SuppressWarnings("unchecked")
    void deveSubmeterBlocosCorretosNoChefe10EConfirmarCheckpoint11SemEnviarErrorCategory() {
        UUID runId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();
        UUID chaveIdempotencia = UUID.randomUUID();

        DefinicaoVarianteDesafioBlocos varianteChefe10 = catalogoBlocos
                .buscarVariantePorAndarEChave(10, "v1")
                .orElseThrow();

        when(perfilRepoMock.buscarTentativaAndarPorId(JOGADOR_ID, attemptId)).thenReturn(Optional.of(
                new RegistroTentativaAndar(attemptId, JOGADOR_ID, runId, 1, 10, 28L, "ACTIVE", OffsetDateTime.now(), null)));
        when(perfilRepoMock.buscarTentativaCicloPorId(JOGADOR_ID, runId)).thenReturn(Optional.of(
                new RegistroTentativaCiclo(runId, JOGADOR_ID, 1, "SWORD", "ACTIVE", 10, 2, 1, OffsetDateTime.now(), null)));
        when(perfilRepoMock.buscarPerfilComProgresso(JOGADOR_ID)).thenReturn(Optional.of(
                new RegistroPerfilComProgresso(JOGADOR_ID, "Marcos", "INICIANTE", "YOUTUBE", "HERO_DEFAULT_2D", "SWORD", OffsetDateTime.now(), 1)));
        when(catalogoBancoMock.buscarMetadadosDesafioPorId(28L)).thenReturn(Optional.of(
                new RegistroMetadadosDesafioBanco(28L, 10, "v1", 1, "Boss", "{}", true)));
        when(executorMock.executarComandoIdempotente(eq(JOGADOR_ID), eq(chaveIdempotencia), eq("submit"), any()))
                .thenReturn(conversorJson.readTree(
                        "{\"submission_id\":\"" + submissionId + "\",\"status\":\"WON\",\"floor\":10,\"lives\":2,\"hints\":1,\"highest_unlocked_cycle\":2}"));

        RespostaBlocosEnviadaJogador respostaCorreta = montarRespostaCorreta(varianteChefe10, attemptId);

        CombateService.ResultadoSubmissaoArenaSupabase resultado =
                combateService.submeterBlocosNaTentativaSupabase(usuarioTeste, chaveIdempotencia, attemptId, respostaCorreta);

        assertEquals(submissionId, resultado.identificadorSubmissaoCriada());
        assertEquals(ResultadoExecucaoSubmissao.CORRETA, resultado.resultadoExecucao());
        assertNull(resultado.categoriaErroDetectada());
        assertTrue(resultado.venceuChefeDoCiclo());
        assertTrue(resultado.desbloqueouNovoCheckpoint());
        assertTrue(resultado.recursosRestauradosNoProximoCiclo());
        assertEquals(2, resultado.maiorCicloDesbloqueado());
        assertEquals(11, resultado.andarMaiorCheckpoint());
        assertEquals(
                List.of(TipoAcaoHeroi.MOVER, TipoAcaoHeroi.ATACAR),
                resultado.acoesHeroiNaArena().stream().map(acao -> acao.getTipo()).toList());

        ArgumentCaptor<Map<String, Object>> capturadorSubmit = ArgumentCaptor.forClass(Map.class);
        verify(executorMock).executarComandoIdempotente(
                eq(JOGADOR_ID), eq(chaveIdempotencia), eq("submit"), capturadorSubmit.capture());
        assertEquals("CORRECT", capturadorSubmit.getValue().get("result"));
        assertNull(capturadorSubmit.getValue().get("error_category"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void deveEnviarCategoriaErroExataEmSubmissaoIncorretaEEntregarDicaPorSubmissionId() {
        UUID runId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();
        UUID chaveSubmit = UUID.randomUUID();
        UUID chaveHint = UUID.randomUUID();

        DefinicaoVarianteDesafioBlocos varianteAndar1 = catalogoBlocos
                .buscarVariantePorAndarEChave(1, "v1")
                .orElseThrow();
        GeradorInstanciaDesafioBlocos.InstanciaInternaDesafioBlocos instancia =
                geradorInstancia.gerarInstanciaParaTentativa(varianteAndar1, attemptId);

        // escolhe o bloco distrator "String" na LACUNA_1 -> deve classificar TIPO_DE_DADO
        String blocoStringDistrator = instancia.visaoPublicaParaArena().blocosDisponiveisEmbaralhados().stream()
                .filter(bloco -> "String".equals(bloco.textoCodigoBloco()))
                .map(BlocoCodigoDisponivel::codigoIdentificadorBloco)
                .findFirst()
                .orElseThrow();

        Map<String, String> blocosComErroTipo = new LinkedHashMap<>(
                montarRespostaCorreta(varianteAndar1, attemptId).getBlocosEscolhidosPorLacuna());
        blocosComErroTipo.put("LACUNA_1", blocoStringDistrator);

        when(perfilRepoMock.buscarTentativaAndarPorId(JOGADOR_ID, attemptId)).thenReturn(Optional.of(
                new RegistroTentativaAndar(attemptId, JOGADOR_ID, runId, 1, 1, 1L, "ACTIVE", OffsetDateTime.now(), null)));
        when(perfilRepoMock.buscarTentativaCicloPorId(JOGADOR_ID, runId)).thenReturn(Optional.of(
                new RegistroTentativaCiclo(runId, JOGADOR_ID, 1, "STAFF", "ACTIVE", 1, 3, 3, OffsetDateTime.now(), null)));
        when(perfilRepoMock.buscarPerfilComProgresso(JOGADOR_ID)).thenReturn(Optional.of(
                new RegistroPerfilComProgresso(JOGADOR_ID, "Marcos", "INICIANTE", "YOUTUBE", "HERO_DEFAULT_2D", "STAFF", OffsetDateTime.now(), 1)));
        when(catalogoBancoMock.buscarMetadadosDesafioPorId(1L)).thenReturn(Optional.of(
                new RegistroMetadadosDesafioBanco(1L, 1, "v1", 1, "Variaveis", "{}", true)));
        when(executorMock.executarComandoIdempotente(eq(JOGADOR_ID), eq(chaveSubmit), eq("submit"), any()))
                .thenReturn(conversorJson.readTree(
                        "{\"submission_id\":\"" + submissionId + "\",\"status\":\"ACTIVE\",\"floor\":1,\"lives\":2,\"hints\":3,\"highest_unlocked_cycle\":1}"));

        CombateService.ResultadoSubmissaoArenaSupabase resultadoErro =
                combateService.submeterBlocosNaTentativaSupabase(
                        usuarioTeste, chaveSubmit, attemptId, new RespostaBlocosEnviadaJogador(blocosComErroTipo));

        assertEquals(ResultadoExecucaoSubmissao.INCORRETA, resultadoErro.resultadoExecucao());
        assertEquals(CategoriaErro.TIPO_DE_DADO, resultadoErro.categoriaErroDetectada());
        assertEquals(2, resultadoErro.quantidadeVidasRestantes());
        assertTrue(resultadoErro.dicaDisponivelParaSubmissao());
        assertFalse(resultadoErro.tentativaCicloDerrotada());

        ArgumentCaptor<Map<String, Object>> capturadorSubmit = ArgumentCaptor.forClass(Map.class);
        verify(executorMock).executarComandoIdempotente(
                eq(JOGADOR_ID), eq(chaveSubmit), eq("submit"), capturadorSubmit.capture());
        assertEquals("INCORRECT", capturadorSubmit.getValue().get("result"));
        assertEquals("TIPO_DE_DADO", capturadorSubmit.getValue().get("error_category"));

        // solicita a dica vinculada exatamente a essa submissao incorreta (sem CategoriaErro vinda do cliente)
        when(executorMock.executarComandoIdempotente(eq(JOGADOR_ID), eq(chaveHint), eq("hint"), any()))
                .thenReturn(conversorJson.readTree("{\"hint\":\"Use int para guardar numeros inteiros sem aspas.\"}"));
        when(perfilRepoMock.buscarTentativaCicloAberta(JOGADOR_ID)).thenReturn(Optional.of(
                new RegistroTentativaCiclo(runId, JOGADOR_ID, 1, "STAFF", "ACTIVE", 1, 2, 2, OffsetDateTime.now(), null)));

        VidasDicasService.ResultadoEntregaDicaPedagogica dicaEntregue =
                vidasDicasService.solicitarDicaParaSubmissaoIncorreta(usuarioTeste, chaveHint, submissionId);

        assertEquals(submissionId, dicaEntregue.identificadorSubmissaoOrigem());
        assertEquals("Use int para guardar numeros inteiros sem aspas.", dicaEntregue.textoDicaPedagogica());
        assertEquals(2, dicaEntregue.quantidadeDicasRestantesNaRun());
    }

    private RespostaBlocosEnviadaJogador montarRespostaCorreta(
            DefinicaoVarianteDesafioBlocos variante,
            UUID tentativaAndar) {
        GeradorInstanciaDesafioBlocos.InstanciaInternaDesafioBlocos instancia =
                geradorInstancia.gerarInstanciaParaTentativa(variante, tentativaAndar);

        Map<String, String> blocosEscolhidos = new LinkedHashMap<>();
        for (GeradorInstanciaDesafioBlocos.LacunaResolvidaInterna lacuna : instancia.mapaGabaritoPorLacuna().values()) {
            String codigoCerto = instancia.visaoPublicaParaArena().blocosDisponiveisEmbaralhados().stream()
                    .filter(bloco -> lacuna.respostasValidasResolvidas().contains(bloco.textoCodigoBloco()))
                    .filter(bloco -> !blocosEscolhidos.containsValue(bloco.codigoIdentificadorBloco()))
                    .map(BlocoCodigoDisponivel::codigoIdentificadorBloco)
                    .findFirst()
                    .orElseThrow();
            blocosEscolhidos.put(lacuna.identificadorLacuna(), codigoCerto);
        }
        return new RespostaBlocosEnviadaJogador(blocosEscolhidos);
    }
}
