package com.javaquest.service;

import com.javaquest.repository.RepositorioCatalogoBancoSupabase;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroAparenciaHeroi2D;
import com.javaquest.repository.RepositorioMetricasEstudoSupabase;
import com.javaquest.repository.RepositorioMetricasEstudoSupabase.RegistroHistoricoCicloBanco;
import com.javaquest.repository.RepositorioMetricasEstudoSupabase.RegistroMetricasConsolidadasJogador;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroTentativaCiclo;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;
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
        Objects.requireNonNull(dadosEventoTempo, "O intervalo de estudo eh obrigatorio.");

        dadosEventoTempo.validar();
        repositorioMetricasEstudo.registrarIntervaloTempoEstudo(
                usuarioAutenticado.identificadorUnicoJogador(),
                dadosEventoTempo.identificadorSessaoEstudo(),
                dadosEventoTempo.numeroSequenciaEvento(),
                dadosEventoTempo.identificadorTentativaAndarOpcional(),
                dadosEventoTempo.inicioIntervalo(),
                dadosEventoTempo.fimIntervalo(),
                dadosEventoTempo.segundosAtivosNoIntervalo());
    }

    @Transactional
    public void encerrarSessaoEstudo(UsuarioAutenticadoJwt usuarioAutenticado, UUID identificadorSessaoEstudo) {
        encerrarSessaoEstudo(usuarioAutenticado, identificadorSessaoEstudo, null);
    }

    @Transactional
    public void encerrarSessaoEstudo(UsuarioAutenticadoJwt usuarioAutenticado, UUID identificadorSessaoEstudo,
            DadosEventoTempoEstudo intervaloFinal) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        if (intervaloFinal != null) {
            if (identificadorSessaoEstudo != null && !identificadorSessaoEstudo.equals(intervaloFinal.identificadorSessaoEstudo())) {
                throw new IllegalArgumentException("Intervalo final pertence a outra sessao.");
            }
            identificadorSessaoEstudo = intervaloFinal.identificadorSessaoEstudo();
            registrarIntervaloTempoEstudo(usuarioAutenticado, intervaloFinal);
        }
        repositorioMetricasEstudo.encerrarSessaoEstudo(usuarioAutenticado.identificadorUnicoJogador(), identificadorSessaoEstudo);
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

        void validar() {
            Objects.requireNonNull(identificadorSessaoEstudo(), "O id da sessao de estudo eh obrigatorio.");
            Objects.requireNonNull(inicioIntervalo(), "O inicio do intervalo eh obrigatorio.");
            Objects.requireNonNull(fimIntervalo(), "O fim do intervalo eh obrigatorio.");

            if (numeroSequenciaEvento() < 0) {
                throw new IllegalArgumentException("Numero de sequencia do evento nao pode ser negativo.");
            }
            if (segundosAtivosNoIntervalo() < 0) {
                throw new IllegalArgumentException("Segundos ativos nao podem ser negativos.");
            }
            if (fimIntervalo().isBefore(inicioIntervalo())) {
                throw new IllegalArgumentException("Fim do intervalo nao pode ser anterior ao inicio.");
            }

            long duracaoTotalIntervaloSegundos = Duration.between(
                    inicioIntervalo(),
                    fimIntervalo()).getSeconds();
            if (segundosAtivosNoIntervalo() > duracaoTotalIntervaloSegundos) {
                throw new IllegalArgumentException(
                        "Segundos ativos informados excedem a duracao real do intervalo.");
            }
        }

        Map<String, Object> paraComandoBanco() {
            validar();
            Objects.requireNonNull(identificadorTentativaAndarOpcional, "O intervalo do combate exige tentativa de andar.");
            return Map.of("identificadorSessaoEstudo", identificadorSessaoEstudo.toString(),
                    "identificadorTentativaAndarOpcional", identificadorTentativaAndarOpcional.toString(),
                    "numeroSequenciaEvento", numeroSequenciaEvento,
                    "inicioIntervalo", inicioIntervalo.toInstant().toString(),
                    "fimIntervalo", fimIntervalo.toInstant().toString(),
                    "segundosAtivosNoIntervalo", segundosAtivosNoIntervalo);
        }
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
