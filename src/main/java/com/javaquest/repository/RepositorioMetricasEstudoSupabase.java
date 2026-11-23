package com.javaquest.repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

// integra as funcoes de sessao de estudo e as views de dashboard/streak direto do Supabase
@Repository
public class RepositorioMetricasEstudoSupabase {

    private final NamedParameterJdbcTemplate templateJdbcNomeado;
    private final ExecutorComandoBancoJogador executorComandoBancoJogador;

    public RepositorioMetricasEstudoSupabase(
            NamedParameterJdbcTemplate templateJdbcNomeado,
            ExecutorComandoBancoJogador executorComandoBancoJogador) {
        this.templateJdbcNomeado = Objects.requireNonNull(templateJdbcNomeado);
        this.executorComandoBancoJogador = Objects.requireNonNull(executorComandoBancoJogador);
    }

    public UUID abrirOuRecuperarSessaoEstudo(UUID identificadorUnicoJogador) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () ->
                templateJdbcNomeado.queryForObject(
                        "SELECT javaquest.open_study_session()",
                        new MapSqlParameterSource(),
                        UUID.class));
    }

    public void registrarIntervaloTempoEstudo(
            UUID identificadorUnicoJogador,
            UUID identificadorSessaoEstudo,
            long numeroSequenciaEvento,
            UUID identificadorTentativaAndarOpcional,
            OffsetDateTime inicioIntervalo,
            OffsetDateTime fimIntervalo,
            int segundosAtivosNoIntervalo) {
        executorComandoBancoJogador.executarSemRetornoNoContextoDoJogador(identificadorUnicoJogador, () -> {
            String consultaSql = """
                    SELECT javaquest.record_study_time(
                        :identificadorSessao,
                        :numeroSequencia,
                        :identificadorTentativa,
                        :inicioIntervalo,
                        :fimIntervalo,
                        :segundosAtivos
                    )
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorSessao", identificadorSessaoEstudo)
                    .addValue("numeroSequencia", numeroSequenciaEvento)
                    .addValue("identificadorTentativa", identificadorTentativaAndarOpcional)
                    .addValue("inicioIntervalo", inicioIntervalo)
                    .addValue("fimIntervalo", fimIntervalo)
                    .addValue("segundosAtivos", segundosAtivosNoIntervalo);

            templateJdbcNomeado.queryForObject(consultaSql, parametros, Object.class);
        });
    }

    public void encerrarSessaoEstudo(UUID identificadorUnicoJogador, UUID identificadorSessaoEstudo) {
        executorComandoBancoJogador.executarSemRetornoNoContextoDoJogador(identificadorUnicoJogador, () -> {
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorSessao", identificadorSessaoEstudo);
            templateJdbcNomeado.queryForObject(
                    "SELECT javaquest.close_study_session(:identificadorSessao)",
                    parametros,
                    Object.class);
        });
    }

    // usa a view player_metrics com security_invoker=true e fuso America/Sao_Paulo ja garantido no SQL
    public Optional<RegistroMetricasConsolidadasJogador> buscarMetricasConsolidadas(UUID identificadorUnicoJogador) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            String consultaSql = """
                    SELECT player_id, total_wins, distinct_floors, active_seconds, longest_streak, current_streak
                    FROM javaquest.player_metrics
                    WHERE player_id = :identificadorJogador
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorJogador", identificadorUnicoJogador);

            List<RegistroMetricasConsolidadasJogador> resultados = templateJdbcNomeado.query(
                    consultaSql,
                    parametros,
                    (rs, numeroLinha) -> new RegistroMetricasConsolidadasJogador(
                            rs.getObject("player_id", UUID.class),
                            rs.getLong("total_wins"),
                            rs.getLong("distinct_floors"),
                            rs.getLong("active_seconds"),
                            rs.getLong("longest_streak"),
                            rs.getLong("current_streak")));
            return resultados.stream().findFirst();
        });
    }

    public List<RegistroHistoricoCicloBanco> listarHistoricoCiclos(UUID identificadorUnicoJogador) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            String consultaSql = """
                    SELECT id, cycle_number, weapon_id, status, current_floor,
                           lives_remaining, hints_remaining, started_at, ended_at, wins, active_seconds
                    FROM javaquest.run_history
                    WHERE player_id = :identificadorJogador
                    ORDER BY started_at DESC
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorJogador", identificadorUnicoJogador);

            return templateJdbcNomeado.query(
                    consultaSql,
                    parametros,
                    (rs, numeroLinha) -> new RegistroHistoricoCicloBanco(
                            rs.getObject("id", UUID.class),
                            rs.getInt("cycle_number"),
                            rs.getString("weapon_id"),
                            rs.getString("status"),
                            rs.getInt("current_floor"),
                            rs.getInt("lives_remaining"),
                            rs.getInt("hints_remaining"),
                            rs.getObject("started_at", OffsetDateTime.class),
                            rs.getObject("ended_at", OffsetDateTime.class),
                            rs.getLong("wins"),
                            rs.getLong("active_seconds")));
        });
    }

    public record RegistroMetricasConsolidadasJogador(
            UUID identificadorUnicoJogador,
            long totalVitoriasAndares,
            long totalAndaresDistintosVencidos,
            long totalSegundosAtivosEstudo,
            long maiorSequenciaDiasAtivos,
            long sequenciaAtualDiasAtivos) {
    }

    public record RegistroHistoricoCicloBanco(
            UUID identificadorTentativaCiclo,
            int numeroCiclo,
            String codigoArmamento,
            String statusTentativaCiclo,
            int andarAlcancado,
            int vidasRestantes,
            int dicasRestantes,
            OffsetDateTime iniciadaEm,
            OffsetDateTime encerradaEm,
            long quantidadeVitoriasNaRun,
            long segundosAtivosNaRun) {
    }
}
