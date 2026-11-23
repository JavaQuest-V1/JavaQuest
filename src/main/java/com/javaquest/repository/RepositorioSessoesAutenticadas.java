package com.javaquest.repository;

import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RepositorioSessoesAutenticadas {

    private final NamedParameterJdbcTemplate consultas;
    private final ExecutorComandoBancoJogador executor;

    public RepositorioSessoesAutenticadas(NamedParameterJdbcTemplate consultas, ExecutorComandoBancoJogador executor) {
        this.consultas = consultas;
        this.executor = executor;
    }

    public boolean sessaoEncerrada(UUID jogador, UUID sessao) {
        return executor.executarNoContextoDoJogador(jogador, () -> consultas.queryForObject("""
                SELECT EXISTS (SELECT 1 FROM javaquest.sessoes_encerradas
                               WHERE player_id=:jogador AND session_id=:sessao)
                """, Map.of("jogador", jogador, "sessao", sessao), Boolean.class));
    }

    public void encerrar(UUID jogador, UUID sessao) {
        executor.executarSemRetornoNoContextoDoJogador(jogador, () -> consultas.update("""
                INSERT INTO javaquest.sessoes_encerradas (player_id, session_id)
                VALUES (:jogador, :sessao) ON CONFLICT DO NOTHING
                """, Map.of("jogador", jogador, "sessao", sessao)));
    }
}
