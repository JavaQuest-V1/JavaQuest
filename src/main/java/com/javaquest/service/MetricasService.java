package com.javaquest.service;

import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase.RegistroAparenciaHeroi2D;
import com.javaquest.persistencia.RepositorioMetricasEstudoSupabase;
import com.javaquest.persistencia.RepositorioMetricasEstudoSupabase.RegistroHistoricoCicloBanco;
import com.javaquest.persistencia.RepositorioMetricasEstudoSupabase.RegistroMetricasConsolidadasJogador;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroTentativaCiclo;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;

// gerencia sessao unica de estudo (pausa 300s), streak oficial em SP e dashboard do jogador (RF-22, 23 e 24)
@Service
public class MetricasService {

    // RF-24: cliente pausa automaticamente o cronometro dps de 5 minutos (300s) sem interacao
    public static final int LIMITE_INATIVIDADE_SESSAO_SEGUNDOS = 300;

    private final RepositorioMetricasEstudoSupabase repositorioMetricasEstudo;
    private final RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso;
    private final RepositorioCatalogoBancoSupabase repositorioCatalogoBanco;

    public MetricasService(
            RepositorioMetricasEstudoSupabase repositorioMetricasEstudo,
            RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso,
            RepositorioCatalogoBancoSupabase repositorioCatalogoBanco) {
        this.repositorioMetricasEstudo = Objects.requireNonNull(repositorioMetricasEstudo);
        this.repositorioPerfilEProgresso = Objects.requireNonNull(repositorioPerfilEProgresso);
        this.repositorioCatalogoBanco = Objects.requireNonNull(repositorioCatalogoBanco);
    }

    // abre ou devolve a msm sessao de estudo ativa (evita duplicar se abrir varias abas)
    public ResultadoAberturaSessaoEstudo abrirOuRecuperarSessaoEstudo(UsuarioAutenticadoJwt usuarioAutenticado) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        UUID identificadorSessaoAtiva = repositorioMetricasEstudo
                .abrirOuRecuperarSessaoEstudo(usuarioAutenticado.identificadorUnicoJogador());
        return new ResultadoAberturaSessaoEstudo(
                identificadorSessaoAtiva,
                LIMITE_INATIVIDADE_SESSAO_SEGUNDOS);
    }

    // grava intervalo de tempo ativo idempotente por sequence_number (inclui derrotas, abandonos e replays)
    public void registrarIntervaloTempoEstudo(
            UsuarioAutenticadoJwt usuarioAutenticado,
            DadosEventoTempoEstudo dadosEventoTempo) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        Objects.requireNonNull(dadosEventoTempo, "Os dados do evento de tempo sao obrigatorios.");
        Objects.requireNonNull(dadosEventoTempo.identificadorSessaoEstudo(), "O id da sessao de estudo eh obrigatorio.");
        Objects.requireNonNull(dadosEventoTempo.inicioIntervalo(), "O inicio do intervalo eh obrigatorio.");
        Objects.requireNonNull(dadosEventoTempo.fimIntervalo(), "O fim do intervalo eh obrigatorio.");

        if (dadosEventoTempo.numeroSequenciaEvento() < 0) {
            throw new IllegalArgumentException("Numero de sequencia do evento nao pode ser negativo.");
        }
        if (dadosEventoTempo.segundosAtivosNoIntervalo() < 0) {
            throw new IllegalArgumentException("Segundos ativos nao podem ser negativos.");
        }
        if (dadosEventoTempo.fimIntervalo().isBefore(dadosEventoTempo.inicioIntervalo())) {
            throw new IllegalArgumentException("Fim do intervalo nao pode ser anterior ao inicio.");
        }

        // checa plausibilidade aki antes msm de bater no CHECK do banco (nn da pra ter 90s ativos num intervalo de 30s)
        long duracaoTotalIntervaloSegundos = Duration.between(
                dadosEventoTempo.inicioIntervalo(),
                dadosEventoTempo.fimIntervalo()).getSeconds();
        if (dadosEventoTempo.segundosAtivosNoIntervalo() > duracaoTotalIntervaloSegundos) {
            throw new IllegalArgumentException(
                    "Segundos ativos informados excedem a duracao real do intervalo.");
        }

        repositorioMetricasEstudo.registrarIntervaloTempoEstudo(
                usuarioAutenticado.identificadorUnicoJogador(),
                dadosEventoTempo.identificadorSessaoEstudo(),
                dadosEventoTempo.numeroSequenciaEvento(),
                dadosEventoTempo.identificadorTentativaAndarOpcional(),
                dadosEventoTempo.inicioIntervalo(),
                dadosEventoTempo.fimIntervalo(),
                dadosEventoTempo.segundosAtivosNoIntervalo());
    }

    public void encerrarSessaoEstudo(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID identificadorSessaoEstudo) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        Objects.requireNonNull(identificadorSessaoEstudo, "O id da sessao de estudo eh obrigatorio.");

        repositorioMetricasEstudo.encerrarSessaoEstudo(
                usuarioAutenticado.identificadorUnicoJogador(),
                identificadorSessaoEstudo);
    }

    // RF-22 e RF-23: usa a view player_metrics (streak calculado em America/Sao_Paulo, zerando se quebrar)
    public ResumoDashboardJogador montarDashboardJogador(UsuarioAutenticadoJwt usuarioAutenticado) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        UUID identificadorJogador = usuarioAutenticado.identificadorUnicoJogador();

        RegistroPerfilComProgresso perfilAtual = repositorioPerfilEProgresso
                .buscarPerfilComProgresso(identificadorJogador)
                .orElseThrow(() -> new IllegalStateException(
                        "Perfil do jogador nao inicializado. Sincronize a sessao primeiro."));

        RegistroAparenciaHeroi2D aparenciaPadrao2D = repositorioCatalogoBanco
                .buscarAparenciaPadraoHeroi()
                .orElse(null);

        RegistroMetricasConsolidadasJogador metricasConsolidadas = repositorioMetricasEstudo
                .buscarMetricasConsolidadas(identificadorJogador)
                .orElse(new RegistroMetricasConsolidadasJogador(identificadorJogador, 0L, 0L, 0L, 0L, 0L));

        RegistroTentativaCiclo tentativaCicloAberta = repositorioPerfilEProgresso
                .buscarTentativaCicloAberta(identificadorJogador)
                .orElse(null);

        List<RegistroHistoricoCicloBanco> historicoCiclos =
                repositorioMetricasEstudo.listarHistoricoCiclos(identificadorJogador);

        return new ResumoDashboardJogador(
                identificadorJogador,
                perfilAtual.apelidoHeroi(),
                usuarioAutenticado.urlFotoPerfilGoogle(),
                perfilAtual.nivelExperienciaBanco(),
                perfilAtual.canalAquisicaoBanco(),
                perfilAtual.codigoArmamentoPreferido(),
                aparenciaPadrao2D,
                perfilAtual.maiorCicloDesbloqueado(),
                perfilAtual.calcularAndarMaiorCheckpoint(),
                metricasConsolidadas.totalVitoriasAndares(),
                metricasConsolidadas.totalAndaresDistintosVencidos(),
                metricasConsolidadas.totalSegundosAtivosEstudo(),
                metricasConsolidadas.sequenciaAtualDiasAtivos(),
                metricasConsolidadas.maiorSequenciaDiasAtivos(),
                LIMITE_INATIVIDADE_SESSAO_SEGUNDOS,
                tentativaCicloAberta,
                historicoCiclos);
    }

    public List<RegistroHistoricoCicloBanco> listarHistoricoCiclos(UsuarioAutenticadoJwt usuarioAutenticado) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        return repositorioMetricasEstudo.listarHistoricoCiclos(usuarioAutenticado.identificadorUnicoJogador());
    }

    public record ResultadoAberturaSessaoEstudo(
            UUID identificadorSessaoEstudo,
            int limiteInatividadeSegundos) {
    }

    public record DadosEventoTempoEstudo(
            UUID identificadorSessaoEstudo,
            long numeroSequenciaEvento,
            UUID identificadorTentativaAndarOpcional,
            OffsetDateTime inicioIntervalo,
            OffsetDateTime fimIntervalo,
            int segundosAtivosNoIntervalo) {
    }

    public record ResumoDashboardJogador(
            UUID identificadorUnicoJogador,
            String apelidoHeroi,
            String urlFotoPerfilGoogle,
            String nivelExperiencia,
            String canalAquisicao,
            String codigoArmamentoPreferido,
            RegistroAparenciaHeroi2D aparenciaPadrao2D,
            int maiorCicloDesbloqueado,
            int andarMaiorCheckpoint,
            long totalVitoriasAndares,
            long totalAndaresDistintosVencidos,
            long totalSegundosAtivosEstudo,
            long sequenciaAtualDiasAtivos,
            long maiorSequenciaDiasAtivos,
            int limiteInatividadeSegundos,
            RegistroTentativaCiclo tentativaCicloAberta,
            List<RegistroHistoricoCicloBanco> historicoTentativasCiclo) {
    }
}
