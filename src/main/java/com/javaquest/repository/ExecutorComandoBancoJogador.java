package com.javaquest.repository;

import com.javaquest.dominio.ResultadoValidacaoBlocosJava;
import java.util.Collections;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Supplier;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

// porta unica de acesso transacional pro Supabase q aplica o contexto RLS por jogador
@Component
public class ExecutorComandoBancoJogador {

    private static final String SQL_DEFINIR_CONTEXTO_JOGADOR =
            "SELECT set_config('javaquest.player_id', :identificadorJogador, true)";

    private static final String SQL_EXECUTAR_COMANDO_IDEMPOTENTE =
            "SELECT javaquest.command(CAST(:chaveIdempotencia AS uuid), :nomeOperacao, CAST(:payloadJson AS jsonb))::text";

    private final NamedParameterJdbcTemplate templateJdbcNomeado;
    private final TransactionTemplate modeloTransacaoBanco;
    private final ObjectMapper conversorJsonJackson;

    public ExecutorComandoBancoJogador(
            NamedParameterJdbcTemplate templateJdbcNomeado,
            TransactionTemplate modeloTransacaoBanco,
            ObjectMapper conversorJsonJackson) {
        this.templateJdbcNomeado = Objects.requireNonNull(templateJdbcNomeado);
        this.modeloTransacaoBanco = Objects.requireNonNull(modeloTransacaoBanco);
        this.conversorJsonJackson = Objects.requireNonNull(conversorJsonJackson);
    }

    // executa operacao mutavel idempotente (register, onboarding, prepare, weapon, start_floor, submit, hint, abandon)
    public JsonNode executarComandoIdempotente(
            UUID identificadorUnicoJogador,
            UUID chaveIdempotenciaRequisicao,
            String nomeOperacaoBanco,
            Map<String, Object> payloadOperacao) {
        Objects.requireNonNull(identificadorUnicoJogador, "O id do jogador eh obrigatorio pro RLS.");
        Objects.requireNonNull(chaveIdempotenciaRequisicao, "A chave de idempotencia (request_id) eh obrigatoria.");
        if (nomeOperacaoBanco == null || nomeOperacaoBanco.isBlank()) {
            throw new IllegalArgumentException("O nome da operacao do banco eh obrigatorio.");
        }

        Map<String, Object> payloadSeguro = payloadOperacao != null ? payloadOperacao : Collections.emptyMap();
        String payloadSerializadoJson = conversorJsonJackson.writeValueAsString(payloadSeguro);

        return executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            MapSqlParameterSource parametrosComando = new MapSqlParameterSource()
                    .addValue("chaveIdempotencia", chaveIdempotenciaRequisicao.toString())
                    .addValue("nomeOperacao", nomeOperacaoBanco)
                    .addValue("payloadJson", payloadSerializadoJson);

            String respostaBrutaJson = templateJdbcNomeado.queryForObject(
                    SQL_EXECUTAR_COMANDO_IDEMPOTENTE,
                    parametrosComando,
                    String.class);

            if (respostaBrutaJson == null || respostaBrutaJson.isBlank()) {
                throw new IllegalStateException("O comando " + nomeOperacaoBanco + " retornou resposta vazia.");
            }
            return conversorJsonJackson.readTree(respostaBrutaJson);
        });
    }

    // seta o id do jogador na transacao pro RLS do banco liberar soh os dados dele msm (expira no commit/rollback)
    public <T> T executarNoContextoDoJogador(
            UUID identificadorUnicoJogador,
            Supplier<T> acaoProtegidaNoBanco) {
        Objects.requireNonNull(identificadorUnicoJogador, "O id do jogador eh obrigatorio pro contexto RLS.");
        Objects.requireNonNull(acaoProtegidaNoBanco, "A acao transacional eh obrigatoria.");

        return modeloTransacaoBanco.execute(statusTransacao -> {
            aplicarContextoJogadorNaTransacaoAtual(identificadorUnicoJogador);
            return acaoProtegidaNoBanco.get();
        });
    }

    public void executarSemRetornoNoContextoDoJogador(
            UUID identificadorUnicoJogador,
            Runnable acaoProtegidaNoBanco) {
        executarNoContextoDoJogador(identificadorUnicoJogador, () -> {
            acaoProtegidaNoBanco.run();
            return null;
        });
    }

    public ResultadoValidacaoBlocosJava lerValidacaoConfirmada(JsonNode resposta) {
        return conversorJsonJackson.treeToValue(resposta.required("validation"),
                ResultadoValidacaoBlocosJava.class);
    }

    private void aplicarContextoJogadorNaTransacaoAtual(UUID identificadorUnicoJogador) {
        MapSqlParameterSource parametroContexto = new MapSqlParameterSource()
                .addValue("identificadorJogador", identificadorUnicoJogador.toString());
        templateJdbcNomeado.queryForObject(SQL_DEFINIR_CONTEXTO_JOGADOR, parametroContexto, String.class);
    }
}
