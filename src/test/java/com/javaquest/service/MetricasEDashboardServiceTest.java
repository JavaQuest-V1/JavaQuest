package com.javaquest.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase.RegistroAparenciaHeroi2D;
import com.javaquest.persistencia.RepositorioMetricasEstudoSupabase;
import com.javaquest.persistencia.RepositorioMetricasEstudoSupabase.RegistroHistoricoCicloBanco;
import com.javaquest.persistencia.RepositorioMetricasEstudoSupabase.RegistroMetricasConsolidadasJogador;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

// testes unitarios da Prioridade 4: sessao de estudo, tempo ativo idempotente, streak SP e dashboard
class MetricasEDashboardServiceTest {

    private static final UUID JOGADOR_ID = UUID.fromString("cccccccc-3333-4333-8333-333333333333");

    private RepositorioMetricasEstudoSupabase metricasRepoMock;
    private RepositorioPerfilEProgressoSupabase perfilRepoMock;
    private RepositorioCatalogoBancoSupabase catalogoRepoMock;
    private MetricasService metricasService;
    private UsuarioAutenticadoJwt usuarioTeste;

    @BeforeEach
    void prepararCenarioTeste() {
        this.metricasRepoMock = mock(RepositorioMetricasEstudoSupabase.class);
        this.perfilRepoMock = mock(RepositorioPerfilEProgressoSupabase.class);
        this.catalogoRepoMock = mock(RepositorioCatalogoBancoSupabase.class);
        this.metricasService = new MetricasService(metricasRepoMock, perfilRepoMock, catalogoRepoMock);
        this.usuarioTeste = new UsuarioAutenticadoJwt(
                JOGADOR_ID, "marcos@test.com", "Marcos Vinicius", "https://foto.test/m.png",
                "google", Instant.now().plusSeconds(3600));
    }

    @Test
    void deveMontarDashboardConsolidadoComMetricasDoBancoEStreakZeradoQuandoQuebrar() {
        UUID runHistoricaId = UUID.randomUUID();
        RegistroPerfilComProgresso perfil = new RegistroPerfilComProgresso(
                JOGADOR_ID, "MarcosDev", "INTERMEDIARIO", "YOUTUBE",
                "HERO_DEFAULT_2D", "SWORD", OffsetDateTime.now(), 2);

        when(perfilRepoMock.buscarPerfilComProgresso(JOGADOR_ID)).thenReturn(Optional.of(perfil));
        when(perfilRepoMock.buscarTentativaCicloAberta(JOGADOR_ID)).thenReturn(Optional.empty());
        when(catalogoRepoMock.buscarAparenciaPadraoHeroi()).thenReturn(Optional.of(
                new RegistroAparenciaHeroi2D("HERO_DEFAULT_2D", "Aprendiz Java", null, 32, 32, "{}")));
        // simula jogador q ja teve streak de 5 dias mas ficou dias sem concluir -> current_streak = 0
        when(metricasRepoMock.buscarMetricasConsolidadas(JOGADOR_ID)).thenReturn(Optional.of(
                new RegistroMetricasConsolidadasJogador(JOGADOR_ID, 12L, 10L, 1850L, 5L, 0L)));
        when(metricasRepoMock.listarHistoricoCiclos(JOGADOR_ID)).thenReturn(List.of(
                new RegistroHistoricoCicloBanco(
                        runHistoricaId, 1, "SWORD", "WON", 10, 2, 1,
                        OffsetDateTime.now().minusHours(2), OffsetDateTime.now().minusHours(1), 10L, 1500L)));

        MetricasService.ResumoDashboardJogador dashboard = metricasService.montarDashboardJogador(usuarioTeste);

        assertEquals("MarcosDev", dashboard.apelidoHeroi());
        assertEquals(2, dashboard.maiorCicloDesbloqueado());
        assertEquals(11, dashboard.andarMaiorCheckpoint());
        assertEquals(12L, dashboard.totalVitoriasAndares());
        assertEquals(10L, dashboard.totalAndaresDistintosVencidos());
        assertEquals(1850L, dashboard.totalSegundosAtivosEstudo());
        assertEquals(0L, dashboard.sequenciaAtualDiasAtivos());
        assertEquals(5L, dashboard.maiorSequenciaDiasAtivos());
        assertEquals(300, dashboard.limiteInatividadeSegundos());
        assertNotNull(dashboard.aparenciaPadrao2D());
        assertEquals(1, dashboard.historicoTentativasCiclo().size());
    }

    @Test
    void deveAbrirRegistrarTempoValidoEEncerrarSessaoDeEstudo() {
        UUID sessaoId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        OffsetDateTime inicio = OffsetDateTime.now().minusSeconds(60);
        OffsetDateTime fim = OffsetDateTime.now();

        when(metricasRepoMock.abrirOuRecuperarSessaoEstudo(JOGADOR_ID)).thenReturn(sessaoId);

        MetricasService.ResultadoAberturaSessaoEstudo abertura =
                metricasService.abrirOuRecuperarSessaoEstudo(usuarioTeste);
        assertEquals(sessaoId, abertura.identificadorSessaoEstudo());
        assertEquals(300, abertura.limiteInatividadeSegundos());

        MetricasService.DadosEventoTempoEstudo eventoValido = new MetricasService.DadosEventoTempoEstudo(
                sessaoId, 1L, attemptId, inicio, fim, 45);
        metricasService.registrarIntervaloTempoEstudo(usuarioTeste, eventoValido);

        verify(metricasRepoMock).registrarIntervaloTempoEstudo(JOGADOR_ID, sessaoId, 1L, attemptId, inicio, fim, 45);

        metricasService.encerrarSessaoEstudo(usuarioTeste, sessaoId);
        verify(metricasRepoMock).encerrarSessaoEstudo(JOGADOR_ID, sessaoId);
    }

    @Test
    void deveRejeitarIntervaloDeTempoInvalidoOuMaiorQueADuracaoReal() {
        UUID sessaoId = UUID.randomUUID();
        OffsetDateTime agora = OffsetDateTime.now();

        // fim antes do inicio -> barra
        assertThrows(IllegalArgumentException.class, () -> metricasService.registrarIntervaloTempoEstudo(
                usuarioTeste,
                new MetricasService.DadosEventoTempoEstudo(sessaoId, 1L, null, agora, agora.minusSeconds(10), 5)));

        // segundos ativos (120s) maior q o intervalo real (30s) -> barra plausibilidade
        assertThrows(IllegalArgumentException.class, () -> metricasService.registrarIntervaloTempoEstudo(
                usuarioTeste,
                new MetricasService.DadosEventoTempoEstudo(sessaoId, 2L, null, agora.minusSeconds(30), agora, 120)));

        // sequencia negativa -> barra
        assertThrows(IllegalArgumentException.class, () -> metricasService.registrarIntervaloTempoEstudo(
                usuarioTeste,
                new MetricasService.DadosEventoTempoEstudo(sessaoId, -1L, null, agora.minusSeconds(30), agora, 10)));
    }
}
