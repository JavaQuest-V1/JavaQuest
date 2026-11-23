package com.javaquest.repository;

import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import tools.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

// leitura dos catalogos 2D e da trilha de ciclos/andares direto do schema javaquest no Supabase
@Repository
public class RepositorioCatalogoBancoSupabase {

    private final NamedParameterJdbcTemplate templateJdbcNomeado;

    private final ObjectMapper conversorJson;

    public RepositorioCatalogoBancoSupabase(NamedParameterJdbcTemplate templateJdbcNomeado, ObjectMapper conversorJson) {
        this.conversorJson = Objects.requireNonNull(conversorJson);
        this.templateJdbcNomeado = Objects.requireNonNull(templateJdbcNomeado);
    }

    public Optional<RegistroAparenciaHeroi2D> buscarAparenciaPadraoHeroi() {
        String consultaSql = """
                SELECT id, name, sprite_sheet_url, frame_width, frame_height, animations::text AS animations_json
                FROM javaquest.hero_skins
                WHERE id = 'HERO_DEFAULT_2D'
                """;
        List<RegistroAparenciaHeroi2D> resultado = templateJdbcNomeado.query(
                consultaSql,
                (rs, numeroLinha) -> new RegistroAparenciaHeroi2D(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getString("sprite_sheet_url"),
                        rs.getInt("frame_width"),
                        rs.getInt("frame_height"),
                        rs.getString("animations_json")));
        return resultado.stream().findFirst();
    }

    public List<RegistroArmamentoCatalogo2D> listarArmamentosAtivos() {
        String consultaSql = """
                SELECT id, name, damage_type, attack_range, sprite_sheet_url, animation_metadata::text AS animation_json, is_active
                FROM javaquest.weapons
                WHERE is_active = true
                ORDER BY id
                """;
        return templateJdbcNomeado.query(
                consultaSql,
                (rs, numeroLinha) -> new RegistroArmamentoCatalogo2D(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getString("damage_type"),
                        rs.getString("attack_range"),
                        rs.getString("sprite_sheet_url"),
                        rs.getString("animation_json"),
                        rs.getBoolean("is_active")));
    }

    public List<RegistroCicloCatalogo> listarTodosCiclos() {
        String consultaSql = """
                SELECT cycle_number, title, published_at, start_floor, end_floor
                FROM javaquest.cycles
                ORDER BY cycle_number
                """;
        return templateJdbcNomeado.query(
                consultaSql,
                (rs, numeroLinha) -> new RegistroCicloCatalogo(
                        rs.getInt("cycle_number"),
                        rs.getString("title"),
                        rs.getObject("published_at", OffsetDateTime.class),
                        rs.getInt("start_floor"),
                        rs.getInt("end_floor")));
    }

    public List<RegistroAndarCatalogo> listarAndaresPorCiclo(int numeroCicloInformado) {
        String consultaSql = """
                SELECT floor_number, cycle_number, topic, learning_objective, difficulty, is_boss
                FROM javaquest.floors
                WHERE cycle_number = :numeroCiclo
                ORDER BY floor_number
                """;
        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("numeroCiclo", numeroCicloInformado);

        return templateJdbcNomeado.query(
                consultaSql,
                parametros,
                (rs, numeroLinha) -> new RegistroAndarCatalogo(
                        rs.getInt("floor_number"),
                        rs.getInt("cycle_number"),
                        rs.getString("topic"),
                        rs.getString("learning_objective"),
                        rs.getString("difficulty"),
                        rs.getBoolean("is_boss")));
    }

    public List<RegistroInimigoAndar> listarInimigosPorAndar(int numeroAndarInformado) {
        String consultaSql = """
                SELECT e.id, e.name, e.is_boss, e.sprite_sheet_url, e.animation_metadata::text AS animation_json, fe.quantity
                FROM javaquest.floor_enemies fe
                JOIN javaquest.enemies e ON e.id = fe.enemy_id
                WHERE fe.floor_number = :numeroAndar
                ORDER BY e.id
                """;
        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("numeroAndar", numeroAndarInformado);

        return templateJdbcNomeado.query(
                consultaSql,
                parametros,
                (rs, numeroLinha) -> new RegistroInimigoAndar(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getBoolean("is_boss"),
                        rs.getString("sprite_sheet_url"),
                        rs.getString("animation_json"),
                        rs.getInt("quantity")));
    }

    // busca metadados do desafio sorteado sem devolver validation_rules pro cliente (RNF-11)
    public Optional<RegistroMetadadosDesafioBanco> buscarMetadadosDesafioPorId(long identificadorDesafio) {
        String consultaSql = """
                SELECT id, floor_number, variant_key, revision, description, scenario::text AS scenario_json, active
                FROM javaquest.challenges
                WHERE id = :identificadorDesafio
                """;
        MapSqlParameterSource parametros = new MapSqlParameterSource()
                .addValue("identificadorDesafio", identificadorDesafio);

        List<RegistroMetadadosDesafioBanco> resultados = templateJdbcNomeado.query(
                consultaSql,
                parametros,
                (rs, numeroLinha) -> new RegistroMetadadosDesafioBanco(
                        rs.getLong("id"),
                        rs.getInt("floor_number"),
                        rs.getString("variant_key"),
                        rs.getInt("revision"),
                        rs.getString("description"),
                        rs.getString("scenario_json"),
                        rs.getBoolean("active")));
        return resultados.stream().findFirst();
    }

    public DefinicaoVarianteDesafioBlocos buscarDefinicaoDaTentativa(long identificadorDesafio, int numeroAndar) {
        String consulta = """
                SELECT (definicao_blocos || jsonb_build_object(
                    'identificadorDesafioNoBanco', id, 'numeroAndarNaTorre', floor_number,
                    'chaveVarianteNoAndar', variant_key, 'numeroRevisaoVariante', revision,
                    'varianteAtivaNoCatalogo', active))::text
                FROM javaquest.challenges
                WHERE id=:desafio AND floor_number=:andar AND definicao_blocos IS NOT NULL
                """;
        var parametros = new MapSqlParameterSource("desafio", identificadorDesafio).addValue("andar", numeroAndar);
        return templateJdbcNomeado.query(consulta, parametros, (registro, indice) ->
                conversorJson.readValue(registro.getString(1), DefinicaoVarianteDesafioBlocos.class))
                .stream().findFirst().orElseThrow(() -> new IllegalStateException(
                        "Definicao de blocos ausente para o desafio " + identificadorDesafio + " no andar " + numeroAndar));
    }

    public record RegistroMetadadosDesafioBanco(
            long identificadorDesafioNoBanco,
            int numeroAndarNaTorre,
            String chaveVarianteNoAndar,
            int numeroRevisaoVariante,
            String enunciadoNoBanco,
            String cenarioArenaJson,
            boolean desafioAtivo) {
    }

    public record RegistroAparenciaHeroi2D(
            String codigoAparencia,
            String nomeAparencia,
            String urlSpritesheet2D,
            int larguraFramePixels,
            int alturaFramePixels,
            String metadadosAnimacoesJson) {
    }

    public record RegistroArmamentoCatalogo2D(
            String codigoArmamento,
            String nomeArmamento,
            String tipoDanoBanco,
            String alcanceAtaqueBanco,
            String urlSpritesheet2D,
            String metadadosAnimacaoJson,
            boolean armamentoAtivo) {
    }

    public record RegistroCicloCatalogo(
            int numeroCiclo,
            String tituloCiclo,
            OffsetDateTime dataPublicacao,
            int andarInicial,
            int andarFinal) {

        public boolean cicloEstaPublicado() {
            return dataPublicacao != null;
        }
    }

    public record RegistroAndarCatalogo(
            int numeroAndar,
            int numeroCiclo,
            String temaAndar,
            String objetivoPedagogico,
            String nivelDificuldade,
            boolean andarDeChefe) {
    }

    public record RegistroInimigoAndar(
            long identificadorInimigo,
            String nomeInimigo,
            boolean inimigoEhChefe,
            String urlSpritesheet2D,
            String metadadosAnimacaoJson,
            int quantidadeNoAndar) {
    }
}
