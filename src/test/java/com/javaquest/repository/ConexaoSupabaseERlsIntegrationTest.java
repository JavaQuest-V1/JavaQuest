package com.javaquest.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

// teste de integracao real usando a role javaquest_app no Supabase pra provar JDBC, RLS e privilegio minimo
@SpringBootTest
class ConexaoSupabaseERlsIntegrationTest {

    @Autowired
    private JdbcTemplate templateJdbcSimples;

    @Autowired
    private ExecutorComandoBancoJogador executorComandoBancoJogador;

    @Autowired
    private RepositorioCatalogoBancoSupabase repositorioCatalogoBancoSupabase;

    @Autowired
    private RepositorioMetricasEstudoSupabase repositorioMetricasEstudoSupabase;

    @Test
    void deveConectarComRoleDePrivilegioMinimoSemBypassRls() {
        Map<String, Object> dadosRoleAtual = templateJdbcSimples.queryForMap("""
                SELECT current_user AS usuario_atual,
                       r.rolsuper AS eh_superusuario,
                       r.rolbypassrls AS tem_bypass_rls
                FROM pg_roles r
                WHERE r.rolname = current_user
                """);

        assertEquals("javaquest_app", dadosRoleAtual.get("usuario_atual"));
        assertEquals(Boolean.FALSE, dadosRoleAtual.get("eh_superusuario"));
        assertEquals(Boolean.FALSE, dadosRoleAtual.get("tem_bypass_rls"));
    }

    @Test
    void deveLerCatalogoRealDoSchemaJavaquest() {
        assertTrue(repositorioCatalogoBancoSupabase.buscarAparenciaPadraoHeroi().isPresent());

        List<RepositorioCatalogoBancoSupabase.RegistroArmamentoCatalogo2D> armamentos =
                repositorioCatalogoBancoSupabase.listarArmamentosAtivos();
        assertEquals(2, armamentos.size());
        assertTrue(armamentos.stream().anyMatch(arma -> "SWORD".equals(arma.codigoArmamento())));
        assertTrue(armamentos.stream().anyMatch(arma -> "STAFF".equals(arma.codigoArmamento())));

        List<RepositorioCatalogoBancoSupabase.RegistroCicloCatalogo> ciclos =
                repositorioCatalogoBancoSupabase.listarTodosCiclos();
        assertFalse(ciclos.isEmpty());
        assertEquals(10, repositorioCatalogoBancoSupabase.listarAndaresPorCiclo(1).size());
    }

    @Test
    void deveGarantirIsolamentoRlsENaoVazarContextoNoPoolHikari() {
        UUID jogadorSimulado = UUID.fromString("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

        // sem set_config, o RLS nn deixa enxergar nenhum registro de players
        Integer quantidadeSemContexto = templateJdbcSimples.queryForObject(
                "SELECT count(*) FROM javaquest.players",
                Integer.class);
        assertEquals(0, quantidadeSemContexto);

        // dentro da transacao protegida, javaquest.player_context() devolve exatamente o UUID definido
        UUID contextoDentroDaTransacao = executorComandoBancoJogador.executarNoContextoDoJogador(
                jogadorSimulado,
                () -> templateJdbcSimples.queryForObject("SELECT javaquest.player_context()", UUID.class));
        assertEquals(jogadorSimulado, contextoDentroDaTransacao);

        // dps q a transacao fecha e a conexao volta pro pool, o contexto precisa estar zerado (null)
        UUID contextoAposFecharTransacao = templateJdbcSimples.queryForObject(
                "SELECT javaquest.player_context()",
                UUID.class);
        assertNull(contextoAposFecharTransacao);

        // consulta nas views com security_invoker=true sob RLS roda sem erro de permissao
        assertTrue(repositorioMetricasEstudoSupabase.buscarMetricasConsolidadas(jogadorSimulado).isEmpty());
        assertTrue(repositorioMetricasEstudoSupabase.listarHistoricoCiclos(jogadorSimulado).isEmpty());
    }

    @Test
    void deveBloquearDeleteDeProgressoPelaRoleDeAplicacao() {
        // role javaquest_app nn pode deletar historico nem progresso (RNF-11 / plano §4)
        assertThrows(DataAccessException.class, () ->
                templateJdbcSimples.update("DELETE FROM javaquest.player_progress"));
    }
}
