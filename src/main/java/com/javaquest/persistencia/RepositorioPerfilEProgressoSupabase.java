package com.javaquest.persistencia;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

// consultas de perfil, progresso e runs sempre sob contexto RLS do jogador logado
@Repository
public class RepositorioPerfilEProgressoSupabase {

    private final NamedParameterJdbcTemplate templateJdbcNomeado;
    private final ExecutorComandoBancoJogador executorComandoBancoJogador;

    public RepositorioPerfilEProgressoSupabase(
            NamedParameterJdbcTemplate templateJdbcNomeado,
            ExecutorComandoBancoJogador executorComandoBancoJogador) {
        this.templateJdbcNomeado = Objects.requireNonNull(templateJdbcNomeado);
        this.executorComandoBancoJogador = Objects.requireNonNull(executorComandoBancoJogador);
    }

    public Optional<RegistroPerfilComProgresso> buscarPerfilComProgresso(UUID identificadorUnicoJogador) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            String consultaSql = """
                    SELECT p.id, p.nickname, p.programming_experience, p.acquisition_channel,
                           p.skin_id, p.preferred_weapon_id, p.onboarding_completed_at,
                           pp.highest_unlocked_cycle
                    FROM javaquest.players p
                    JOIN javaquest.player_progress pp ON pp.player_id = p.id
                    WHERE p.id = :identificadorJogador
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorJogador", identificadorUnicoJogador);

            List<RegistroPerfilComProgresso> resultados = templateJdbcNomeado.query(
                    consultaSql,
                    parametros,
                    (rs, numeroLinha) -> new RegistroPerfilComProgresso(
                            rs.getObject("id", UUID.class),
                            rs.getString("nickname"),
                            rs.getString("programming_experience"),
                            rs.getString("acquisition_channel"),
                            rs.getString("skin_id"),
                            rs.getString("preferred_weapon_id"),
                            rs.getObject("onboarding_completed_at", OffsetDateTime.class),
                            rs.getInt("highest_unlocked_cycle")));
            return resultados.stream().findFirst();
        });
    }

    public Optional<RegistroTentativaCiclo> buscarTentativaCicloAberta(UUID identificadorUnicoJogador) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            String consultaSql = """
                    SELECT id, player_id, cycle_number, weapon_id, status,
                           current_floor, lives_remaining, hints_remaining, started_at, ended_at
                    FROM javaquest.cycle_runs
                    WHERE player_id = :identificadorJogador
                      AND status IN ('PREPARING', 'ACTIVE')
                    LIMIT 1
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorJogador", identificadorUnicoJogador);

            List<RegistroTentativaCiclo> resultados = templateJdbcNomeado.query(
                    consultaSql,
                    parametros,
                    (rs, numeroLinha) -> new RegistroTentativaCiclo(
                            rs.getObject("id", UUID.class),
                            rs.getObject("player_id", UUID.class),
                            rs.getInt("cycle_number"),
                            rs.getString("weapon_id"),
                            rs.getString("status"),
                            rs.getInt("current_floor"),
                            rs.getInt("lives_remaining"),
                            rs.getInt("hints_remaining"),
                            rs.getObject("started_at", OffsetDateTime.class),
                            rs.getObject("ended_at", OffsetDateTime.class)));
            return resultados.stream().findFirst();
        });
    }

    public Optional<RegistroTentativaCiclo> buscarTentativaCicloPorId(
            UUID identificadorUnicoJogador,
            UUID identificadorTentativaCiclo) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            String consultaSql = """
                    SELECT id, player_id, cycle_number, weapon_id, status,
                           current_floor, lives_remaining, hints_remaining, started_at, ended_at
                    FROM javaquest.cycle_runs
                    WHERE player_id = :identificadorJogador
                      AND id = :identificadorRun
                    LIMIT 1
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorJogador", identificadorUnicoJogador)
                    .addValue("identificadorRun", identificadorTentativaCiclo);

            List<RegistroTentativaCiclo> resultados = templateJdbcNomeado.query(
                    consultaSql,
                    parametros,
                    (rs, numeroLinha) -> new RegistroTentativaCiclo(
                            rs.getObject("id", UUID.class),
                            rs.getObject("player_id", UUID.class),
                            rs.getInt("cycle_number"),
                            rs.getString("weapon_id"),
                            rs.getString("status"),
                            rs.getInt("current_floor"),
                            rs.getInt("lives_remaining"),
                            rs.getInt("hints_remaining"),
                            rs.getObject("started_at", OffsetDateTime.class),
                            rs.getObject("ended_at", OffsetDateTime.class)));
            return resultados.stream().findFirst();
        });
    }

    public Optional<RegistroTentativaAndar> buscarTentativaAndarPorId(
            UUID identificadorUnicoJogador,
            UUID identificadorTentativaAndar) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            String consultaSql = """
                    SELECT id, player_id, run_id, cycle_number, floor_number, challenge_id, status, started_at, ended_at
                    FROM javaquest.floor_attempts
                    WHERE player_id = :identificadorJogador
                      AND id = :identificadorTentativa
                    LIMIT 1
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorJogador", identificadorUnicoJogador)
                    .addValue("identificadorTentativa", identificadorTentativaAndar);

            List<RegistroTentativaAndar> resultados = templateJdbcNomeado.query(
                    consultaSql,
                    parametros,
                    (rs, numeroLinha) -> new RegistroTentativaAndar(
                            rs.getObject("id", UUID.class),
                            rs.getObject("player_id", UUID.class),
                            rs.getObject("run_id", UUID.class),
                            rs.getInt("cycle_number"),
                            rs.getInt("floor_number"),
                            rs.getLong("challenge_id"),
                            rs.getString("status"),
                            rs.getObject("started_at", OffsetDateTime.class),
                            rs.getObject("ended_at", OffsetDateTime.class)));
            return resultados.stream().findFirst();
        });
    }

    public Optional<RegistroTentativaAndar> buscarTentativaAndarAtiva(
            UUID identificadorUnicoJogador,
            UUID identificadorTentativaCiclo) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            String consultaSql = """
                    SELECT id, player_id, run_id, cycle_number, floor_number, challenge_id, status, started_at, ended_at
                    FROM javaquest.floor_attempts
                    WHERE player_id = :identificadorJogador
                      AND run_id = :identificadorRun
                      AND status = 'ACTIVE'
                    LIMIT 1
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorJogador", identificadorUnicoJogador)
                    .addValue("identificadorRun", identificadorTentativaCiclo);

            List<RegistroTentativaAndar> resultados = templateJdbcNomeado.query(
                    consultaSql,
                    parametros,
                    (rs, numeroLinha) -> new RegistroTentativaAndar(
                            rs.getObject("id", UUID.class),
                            rs.getObject("player_id", UUID.class),
                            rs.getObject("run_id", UUID.class),
                            rs.getInt("cycle_number"),
                            rs.getInt("floor_number"),
                            rs.getLong("challenge_id"),
                            rs.getString("status"),
                            rs.getObject("started_at", OffsetDateTime.class),
                            rs.getObject("ended_at", OffsetDateTime.class)));
            return resultados.stream().findFirst();
        });
    }

    public int atualizarApelidoJogador(UUID identificadorUnicoJogador, String novoApelidoLimpo) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            // atualiza soh o perfil do proprio jogador (RLS barra qualquer outro id msm se tentarem)
            String comandoSql = """
                    UPDATE javaquest.players
                    SET nickname = :novoApelido,
                        updated_at = clock_timestamp()
                    WHERE id = :identificadorJogador
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("novoApelido", novoApelidoLimpo)
                    .addValue("identificadorJogador", identificadorUnicoJogador);
            return templateJdbcNomeado.update(comandoSql, parametros);
        });
    }

    public List<String> listarChavesVariantesVistasNoAndar(UUID identificadorUnicoJogador, int numeroAndarNaTorre) {
        return executorComandoBancoJogador.executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            String consultaSql = """
                    SELECT c.variant_key
                    FROM javaquest.floor_attempts a
                    JOIN javaquest.challenges c ON c.id = a.challenge_id
                    WHERE a.player_id = :identificadorJogador
                      AND a.floor_number = :numeroAndar
                    ORDER BY a.started_at ASC, a.id ASC
                    """;
            MapSqlParameterSource parametros = new MapSqlParameterSource()
                    .addValue("identificadorJogador", identificadorUnicoJogador)
                    .addValue("numeroAndar", numeroAndarNaTorre);

            return templateJdbcNomeado.queryForList(consultaSql, parametros, String.class);
        });
    }

    public record RegistroPerfilComProgresso(
            UUID identificadorUnicoJogador,
            String apelidoHeroi,
            String nivelExperienciaBanco,
            String canalAquisicaoBanco,
            String codigoAparencia2D,
            String codigoArmamentoPreferido,
            OffsetDateTime dataConclusaoOnboarding,
            int maiorCicloDesbloqueado) {

        public boolean onboardingFoiConcluido() {
            return dataConclusaoOnboarding != null;
        }

        // deriva o andar do maior checkpoint (1, 11, 21, 31...)
        public int calcularAndarMaiorCheckpoint() {
            return 10 * (maiorCicloDesbloqueado - 1) + 1;
        }
    }

    public record RegistroTentativaCiclo(
            UUID identificadorTentativaCiclo,
            UUID identificadorUnicoJogador,
            int numeroCiclo,
            String codigoArmamentoFixo,
            String statusTentativaCiclo,
            int numeroAndarAtual,
            int quantidadeVidasRestantes,
            int quantidadeDicasRestantes,
            OffsetDateTime iniciadaEm,
            OffsetDateTime encerradaEm) {
    }

    public record RegistroTentativaAndar(
            UUID identificadorTentativaAndar,
            UUID identificadorUnicoJogador,
            UUID identificadorTentativaCiclo,
            int numeroCiclo,
            int numeroAndar,
            long identificadorDesafioNoBanco,
            String statusTentativaAndar,
            OffsetDateTime iniciadaEm,
            OffsetDateTime encerradaEm) {
    }
}
