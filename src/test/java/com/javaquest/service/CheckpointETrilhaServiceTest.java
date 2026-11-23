package com.javaquest.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.javaquest.dominio.TipoArmamentoHeroi;
import com.javaquest.repository.ExecutorComandoBancoJogador;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroAndarCatalogo;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroCicloCatalogo;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroTentativaCiclo;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.ObjectMapper;

// testes unitarios da Prioridade 2: trilha de ciclos, checkpoints 11/21/31 e gestao de runs
class CheckpointETrilhaServiceTest {

    private static final UUID JOGADOR_ID = UUID.fromString("aaaaaaaa-1111-4111-8111-111111111111");

    private ExecutorComandoBancoJogador executorMock;
    private RepositorioCatalogoBancoSupabase catalogoMock;
    private RepositorioPerfilEProgressoSupabase perfilMock;
    private CheckpointService checkpointService;
    private UsuarioAutenticadoJwt usuarioTeste;
    private ObjectMapper conversorJson;

    @BeforeEach
    void prepararCenarioTeste() {
        this.executorMock = mock(ExecutorComandoBancoJogador.class);
        this.catalogoMock = mock(RepositorioCatalogoBancoSupabase.class);
        this.perfilMock = mock(RepositorioPerfilEProgressoSupabase.class);
        this.checkpointService = new CheckpointService(executorMock, catalogoMock, perfilMock);
        this.usuarioTeste = new UsuarioAutenticadoJwt(
                JOGADOR_ID, "marcos@test.com", "Marcos", null, "google", Instant.now().plusSeconds(3600), UUID.randomUUID());
        this.conversorJson = new ObjectMapper();
    }

    @Test
    void deveReconhecerAndaresDeCheckpointComo1_11_21_31ENunca10_20_30() {
        assertTrue(checkpointService.ehAndarDeCheckpoint(1));
        assertTrue(checkpointService.ehAndarDeCheckpoint(11));
        assertTrue(checkpointService.ehAndarDeCheckpoint(21));
        assertTrue(checkpointService.ehAndarDeCheckpoint(31));

        // 10, 20 e 30 sao andares de chefe, nn checkpoints
        assertFalse(checkpointService.ehAndarDeCheckpoint(10));
        assertFalse(checkpointService.ehAndarDeCheckpoint(20));
        assertFalse(checkpointService.ehAndarDeCheckpoint(30));
        assertFalse(checkpointService.ehAndarDeCheckpoint(0));
        assertFalse(checkpointService.ehAndarDeCheckpoint(-5));

        assertEquals(1, checkpointService.calcularAndarCheckpointDoCiclo(1));
        assertEquals(11, checkpointService.calcularAndarCheckpointDoCiclo(2));
        assertEquals(21, checkpointService.calcularAndarCheckpointDoCiclo(3));

        assertEquals(11, checkpointService.calcularProximoCheckpointAposChefe(10));
        assertEquals(21, checkpointService.calcularProximoCheckpointAposChefe(20));
        assertThrows(IllegalArgumentException.class, () -> checkpointService.calcularProximoCheckpointAposChefe(7));
    }

    @Test
    void deveMontarTrilhaSinalizandoProximoCicloAguardandoPublicacaoAposVencerChefe10() {
        // jogador venceu o chefe 10 -> ciclo 2 liberado (checkpoint 11), mas soh ciclo 1 ta publicado
        RegistroPerfilComProgresso perfilComCiclo2Liberado = new RegistroPerfilComProgresso(
                JOGADOR_ID, "MarcosDev", "INICIANTE", "YOUTUBE",
                "HERO_DEFAULT_2D", "SWORD", OffsetDateTime.now(), 2);

        when(perfilMock.buscarPerfilComProgresso(JOGADOR_ID)).thenReturn(Optional.of(perfilComCiclo2Liberado));
        when(perfilMock.buscarTentativaCicloAberta(JOGADOR_ID)).thenReturn(Optional.empty());
        when(catalogoMock.listarTodosCiclos()).thenReturn(List.of(
                new RegistroCicloCatalogo(1, "Fundamentos de Java", OffsetDateTime.now(), 1, 10),
                new RegistroCicloCatalogo(2, "Ciclo Futuro", null, 11, 20)));
        when(catalogoMock.listarAndaresPorCiclo(1)).thenReturn(List.of(
                new RegistroAndarCatalogo(1, 1, "Variaveis e Tipagem", "Objetivo 1", "NORMAL", false),
                new RegistroAndarCatalogo(10, 1, "Boss desafio", "Objetivo 10", "NORMAL", true)));

        CheckpointService.ResumoTrilhaCiclosJogador trilha =
                checkpointService.listarTrilhaCiclosEAndares(usuarioTeste);

        assertEquals(2, trilha.maiorCicloDesbloqueado());
        assertEquals(11, trilha.andarMaiorCheckpointDesbloqueado());
        assertTrue(trilha.proximoCicloAguardandoPublicacao());
        assertEquals(1, trilha.ciclosDaTrilha().size());

        CheckpointService.ItemCicloNaTrilha ciclo1 = trilha.ciclosDaTrilha().get(0);
        assertTrue(ciclo1.desbloqueadoParaJogador());
        assertTrue(ciclo1.publicadoNoCatalogo());
        assertTrue(ciclo1.disponivelParaJogar());

    }

    @Test
    @SuppressWarnings("unchecked")
    void devePrepararCicloTrocarArmaEmPreparingEAbandonarRunViaComandoIdempotente() {
        UUID runCriadaId = UUID.randomUUID();
        UUID chavePrepare = UUID.randomUUID();
        UUID chaveWeapon = UUID.randomUUID();
        UUID chaveAbandon = UUID.randomUUID();

        when(executorMock.executarComandoIdempotente(eq(JOGADOR_ID), eq(chavePrepare), eq("prepare"), any()))
                .thenReturn(conversorJson.readTree(
                        "{\"run_id\":\"" + runCriadaId + "\",\"lives\":3,\"hints\":3}"));

        CheckpointService.ResultadoPreparacaoCiclo preparacao = checkpointService.prepararNovaTentativaCiclo(
                usuarioTeste, chavePrepare, 1, TipoArmamentoHeroi.ESPADA);

        assertEquals(runCriadaId, preparacao.identificadorTentativaCiclo());
        assertEquals(1, preparacao.andarInicialDoCiclo());
        assertEquals("SWORD", preparacao.codigoArmamentoSelecionado());
        assertEquals(3, preparacao.quantidadeVidasIniciais());
        assertEquals(3, preparacao.quantidadeDicasIniciais());
        assertTrue(preparacao.podeTrocarArmamentoAgora());

        ArgumentCaptor<Map<String, Object>> capturadorPrepare = ArgumentCaptor.forClass(Map.class);
        verify(executorMock).executarComandoIdempotente(
                eq(JOGADOR_ID), eq(chavePrepare), eq("prepare"), capturadorPrepare.capture());
        assertEquals(1, capturadorPrepare.getValue().get("cycle"));
        assertEquals("SWORD", capturadorPrepare.getValue().get("weapon"));

        // troca pra STAFF ainda em PREPARING (inclusive no andar 1!)
        when(executorMock.executarComandoIdempotente(eq(JOGADOR_ID), eq(chaveWeapon), eq("weapon"), any()))
                .thenReturn(conversorJson.readTree("{\"weapon\":\"STAFF\"}"));

        CheckpointService.ResultadoTrocaArmamentoCiclo troca = checkpointService.trocarArmamentoEmPreparacao(
                usuarioTeste, chaveWeapon, runCriadaId, TipoArmamentoHeroi.CAJADO);
        assertEquals("STAFF", troca.codigoArmamentoAtualizado());

        // abandona a run aberta
        when(executorMock.executarComandoIdempotente(eq(JOGADOR_ID), eq(chaveAbandon), eq("abandon"), any()))
                .thenReturn(conversorJson.readTree("{\"status\":\"ABANDONED\"}"));

        CheckpointService.ResultadoAbandonoCiclo abandono = checkpointService.abandonarTentativaCiclo(
                usuarioTeste, chaveAbandon, runCriadaId);
        assertEquals("ABANDONED", abandono.statusFinalCiclo());
    }

    @Test
    void deveIndicarTrocaDeArmaLiberadaApenasEmPreparingEBloqueadaEmActive() {
        UUID runId = UUID.randomUUID();

        when(perfilMock.buscarTentativaCicloAberta(JOGADOR_ID)).thenReturn(Optional.of(
                new RegistroTentativaCiclo(runId, JOGADOR_ID, 1, "SWORD", "PREPARING", 1, 3, 3, OffsetDateTime.now(), null)));
        CheckpointService.EstadoTentativaCicloAtual emPreparacao =
                checkpointService.obterTentativaCicloAberta(usuarioTeste).orElse(null);
        assertNotNull(emPreparacao);
        assertTrue(emPreparacao.podeTrocarArmamentoAgora());

        when(perfilMock.buscarTentativaCicloAberta(JOGADOR_ID)).thenReturn(Optional.of(
                new RegistroTentativaCiclo(runId, JOGADOR_ID, 1, "SWORD", "ACTIVE", 4, 2, 3, OffsetDateTime.now(), null)));
        CheckpointService.EstadoTentativaCicloAtual emCombate =
                checkpointService.obterTentativaCicloAberta(usuarioTeste).orElse(null);
        assertNotNull(emCombate);
        assertFalse(emCombate.podeTrocarArmamentoAgora());
    }
}
