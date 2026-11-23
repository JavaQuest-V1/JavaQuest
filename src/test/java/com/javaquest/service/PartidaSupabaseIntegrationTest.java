package com.javaquest.service;

import com.javaquest.dominio.CanalAquisicao;
import com.javaquest.dominio.NivelExperiencia;
import com.javaquest.dominio.RespostaBlocosEnviadaJogador;
import com.javaquest.dominio.TipoArmamentoHeroi;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase;
import com.javaquest.repository.RepositorioSessoesAutenticadas;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@EnabledIfSystemProperty(named = "javaquest.teste.jogador", matches = ".+")
class PartidaSupabaseIntegrationTest {

    @Autowired AutenticacaoService autenticacao;
    @Autowired JogadorService jogadores;
    @Autowired CheckpointService checkpoints;
    @Autowired CombateService combate;
    @Autowired VidasDicasService dicas;
    @Autowired GeradorInstanciaDesafioBlocos gerador;
    @Autowired RepositorioCatalogoBancoSupabase catalogo;
    @Autowired RepositorioSessoesAutenticadas sessoes;

    @Test
    void devePersistirPartidaComRevisaoDicaRetryDeChefeELogout() {
        UUID jogador = UUID.fromString(System.getProperty("javaquest.teste.jogador"));
        var usuario = new UsuarioAutenticadoJwt(jogador, "teste@example.org", "Teste", null,
                "google", Instant.now().plusSeconds(600), UUID.randomUUID());
        var acesso = autenticacao.sincronizarSessaoComGoogle(usuario, UUID.randomUUID());
        assertTrue(acesso.primeiroAcesso());
        jogadores.concluirOnboardingJogador(usuario, UUID.randomUUID(), new JogadorService.DadosOnboardingJogador(
                "Teste", NivelExperiencia.INICIANTE, CanalAquisicao.OUTROS, TipoArmamentoHeroi.CAJADO));
        var ciclo = checkpoints.prepararNovaTentativaCiclo(usuario, UUID.randomUUID(), 1, TipoArmamentoHeroi.CAJADO);
        var retomada = autenticacao.sincronizarSessaoComGoogle(usuario, UUID.randomUUID());
        assertFalse(retomada.primeiroAcesso());
        assertEquals(ciclo.identificadorTentativaCiclo(), retomada.tentativaAtiva().identificadorTentativaCiclo());

        for (int andar = 1; andar <= 10; andar++) {
            var abertura = combate.iniciarAndarNaRunSupabase(usuario, UUID.randomUUID(), ciclo.identificadorTentativaCiclo());
            UUID tentativa = abertura.identificadorTentativaAndar();
            var definicao = catalogo.buscarDefinicaoDaTentativa(abertura.desafioPublicoEmbaralhado().identificadorDesafioNoBanco(), andar);
            var instancia = gerador.gerarInstanciaParaTentativa(definicao, tentativa);
            if (andar == 1) {
                var erro = combate.submeterBlocosNaTentativaSupabase(usuario, UUID.randomUUID(), tentativa,
                        new RespostaBlocosEnviadaJogador(Map.of()));
                assertTrue(erro.inimigoContraAtacou());
                var dica = dicas.solicitarDicaParaSubmissaoIncorreta(usuario, UUID.randomUUID(), erro.identificadorSubmissaoCriada());
                assertEquals(ciclo.identificadorTentativaCiclo(), dica.identificadorTentativaCicloOrigem());
                assertEquals(2, dica.quantidadeDicasRestantesNaRun());
            }
            Map<String,String> escolhas = new LinkedHashMap<>();
            for (var lacuna : instancia.mapaGabaritoPorLacuna().values()) {
                var bloco = instancia.mapaBlocosInternosPorCodigo().values().stream()
                        .filter(opcao -> !escolhas.containsValue(opcao.codigoIdentificadorBloco()))
                        .filter(opcao -> lacuna.respostasValidasResolvidas().contains(opcao.textoCodigoResolvido()))
                        .findFirst().orElseThrow();
                escolhas.put(lacuna.identificadorLacuna(), bloco.codigoIdentificadorBloco());
            }
            var resposta = new RespostaBlocosEnviadaJogador(escolhas);
            UUID chave = UUID.randomUUID();
            var vitoria = combate.submeterBlocosNaTentativaSupabase(usuario, chave, tentativa, resposta);
            var repeticao = combate.submeterBlocosNaTentativaSupabase(usuario, chave, tentativa, resposta);
            assertEquals(vitoria.identificadorSubmissaoCriada(), repeticao.identificadorSubmissaoCriada());
            assertEquals(andar == 10, repeticao.desbloqueouNovoCheckpoint());
            assertEquals(andar == 10 ? 11 : 1, repeticao.andarMaiorCheckpoint());
        }
        autenticacao.encerrarSessaoJogador(usuario, acesso.identificadorSessaoEstudoAtiva());
        assertTrue(sessoes.sessaoEncerrada(jogador, usuario.identificadorSessaoAutenticada()));
    }
}
