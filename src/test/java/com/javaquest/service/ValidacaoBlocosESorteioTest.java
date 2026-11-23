package com.javaquest.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.javaquest.dominio.BlocoCodigoDisponivel;
import com.javaquest.dominio.CategoriaErro;
import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import com.javaquest.dominio.InstanciaDesafioBlocosPublica;
import com.javaquest.dominio.RespostaBlocosEnviadaJogador;
import com.javaquest.dominio.ResultadoExecucaoSubmissao;
import com.javaquest.dominio.ResultadoValidacaoBlocosJava;
import com.javaquest.dominio.TemaAndarCiclo;
import com.javaquest.dominio.TipoAcaoHeroi;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

// testes unitarios pra garantir sorteio rogue-lite, blocos embaralhados e classificacao de erro
class ValidacaoBlocosESorteioTest {

    private CatalogoDesafiosBlocosPadrao catalogoDesafios;
    private GeradorInstanciaDesafioBlocos geradorInstancia;
    private SorteadorVarianteDesafioService sorteadorVariante;
    private ValidacaoJavaService servicoValidacao;
    private CombateService servicoCombate;

    @BeforeEach
    void prepararDependenciasTeste() {
        this.catalogoDesafios = new CatalogoDesafiosBlocosPadrao();
        this.geradorInstancia = new GeradorInstanciaDesafioBlocos();
        this.sorteadorVariante = new SorteadorVarianteDesafioService();
        this.servicoValidacao = new ValidacaoJavaService(geradorInstancia);
        this.servicoCombate = new CombateService(
                catalogoDesafios,
                sorteadorVariante,
                geradorInstancia,
                servicoValidacao);
    }

    @Test
    void deveGarantirTresVariantesAtivasEValidaveisParaTodosOsDezAndaresDaApresentacao() {
        for (int numeroAndar = 1; numeroAndar <= 10; numeroAndar++) {
            List<DefinicaoVarianteDesafioBlocos> variantes = catalogoDesafios.listarVariantesAtivasPorAndar(numeroAndar);
            assertEquals(3, variantes.size(), "Andar " + numeroAndar + " precisa ter 3 variantes ativas.");
            assertTrue(TemaAndarCiclo.buscarTemaPorNumeroAndar(numeroAndar).isPresent());

            // testa todas as 30 variantes pra garantir q nenhuma ta quebrada ou sem gabarito
            for (DefinicaoVarianteDesafioBlocos varianteAtual : variantes) {
                UUID tentativaTeste = UUID.randomUUID();
                RespostaBlocosEnviadaJogador respostaCorreta = montarRespostaCorretaParaTeste(varianteAtual, tentativaTeste);
                ResultadoValidacaoBlocosJava resultado = servicoValidacao.validarSubmissaoEmBlocos(
                        varianteAtual,
                        tentativaTeste,
                        "SWORD",
                        respostaCorreta);
                assertEquals(
                        ResultadoExecucaoSubmissao.CORRETA,
                        resultado.resultadoExecucao(),
                        "Variante " + varianteAtual.chaveVarianteNoAndar() + " do andar " + numeroAndar + " falhou na validacao.");
                assertFalse(resultado.codigoJavaMontadoFinal().contains("{{"));
            }
        }
    }

    @Test
    void deveSortearVarianteDiferenteAposDerrotaSemRepetirUltima() {
        List<DefinicaoVarianteDesafioBlocos> variantesAndar1 = catalogoDesafios.listarVariantesAtivasPorAndar(1);

        // jogador ja viu v1 na run anterior -> nn pode cair v1 dnv
        DefinicaoVarianteDesafioBlocos segundaRun = sorteadorVariante.sortearProximaVarianteDoAndar(
                variantesAndar1,
                List.of("v1"),
                new Random(42L));
        assertNotEquals("v1", segundaRun.chaveVarianteNoAndar());

        // jogador ja viu todas (v1, v2, v3) -> reiniciando ciclo de variantes, nn pode repetir v3 q foi a ultima
        DefinicaoVarianteDesafioBlocos quartaRun = sorteadorVariante.sortearProximaVarianteDoAndar(
                variantesAndar1,
                List.of("v1", "v2", "v3"),
                new Random(7L));
        assertNotEquals("v3", quartaRun.chaveVarianteNoAndar());
    }

    @Test
    void deveManterDeterminismoComMesmoAttemptIdEMudarComOutroAttemptId() {
        DefinicaoVarianteDesafioBlocos variante = catalogoDesafios.listarVariantesAtivasPorAndar(1).getFirst();
        UUID tentativaFixa = UUID.fromString("11111111-1111-4111-8111-111111111111");

        // msm attempt_id (ex: F5 na pagina) devolve exatamente os msm blocos e valores
        InstanciaDesafioBlocosPublica primeiraLeitura = geradorInstancia
                .gerarInstanciaParaTentativa(variante, tentativaFixa)
                .visaoPublicaParaArena();
        InstanciaDesafioBlocosPublica segundaLeitura = geradorInstancia
                .gerarInstanciaParaTentativa(variante, tentativaFixa)
                .visaoPublicaParaArena();

        assertEquals(primeiraLeitura, segundaLeitura);

        // nova tentativa (nova run) gera outra combinacao embaralhada
        boolean mudouEmAlgumaNovaTentativa = false;
        for (int tentativa = 0; tentativa < 10; tentativa++) {
            InstanciaDesafioBlocosPublica outraTentativa = geradorInstancia
                    .gerarInstanciaParaTentativa(variante, UUID.randomUUID())
                    .visaoPublicaParaArena();
            if (!primeiraLeitura.blocosDisponiveisEmbaralhados().equals(outraTentativa.blocosDisponiveisEmbaralhados())
                    || !primeiraLeitura.enunciadoDesafioResolvido().equals(outraTentativa.enunciadoDesafioResolvido())) {
                mudouEmAlgumaNovaTentativa = true;
                break;
            }
        }
        assertTrue(mudouEmAlgumaNovaTentativa);
    }

    @Test
    void deveValidarBlocosCorretosEDispararAcoesConformeArmamento() {
        UUID tentativaAndar = UUID.fromString("22222222-2222-4222-8222-222222222222");
        DefinicaoVarianteDesafioBlocos varianteAndar1 = catalogoDesafios.listarVariantesAtivasPorAndar(1).getFirst();

        RespostaBlocosEnviadaJogador respostaCorreta = montarRespostaCorretaParaTeste(varianteAndar1, tentativaAndar);

        ResultadoValidacaoBlocosJava resultadoEspada = servicoValidacao.validarSubmissaoEmBlocos(
                varianteAndar1,
                tentativaAndar,
                "SWORD",
                respostaCorreta);

        assertEquals(ResultadoExecucaoSubmissao.CORRETA, resultadoEspada.resultadoExecucao());
        assertNull(resultadoEspada.categoriaErroDetectada());
        assertEquals(
                List.of(TipoAcaoHeroi.MOVER, TipoAcaoHeroi.ATACAR),
                resultadoEspada.acoesHeroiNaArena().stream().map(acao -> acao.getTipo()).toList());
        assertFalse(resultadoEspada.codigoJavaMontadoFinal().contains("{{LACUNA_"));

        ResultadoValidacaoBlocosJava resultadoCajado = servicoValidacao.validarSubmissaoEmBlocos(
                varianteAndar1,
                tentativaAndar,
                "STAFF",
                respostaCorreta);

        assertEquals(ResultadoExecucaoSubmissao.CORRETA, resultadoCajado.resultadoExecucao());
        assertEquals(
                List.of(TipoAcaoHeroi.ATACAR),
                resultadoCajado.acoesHeroiNaArena().stream().map(acao -> acao.getTipo()).toList());
    }

    @Test
    void deveClassificarCategoriaErroExataQuandoEscolherBlocoDistrator() {
        UUID tentativaAndar = UUID.fromString("33333333-3333-4333-8333-333333333333");
        DefinicaoVarianteDesafioBlocos varianteAndar1 = catalogoDesafios.listarVariantesAtivasPorAndar(1).getFirst();

        GeradorInstanciaDesafioBlocos.InstanciaInternaDesafioBlocos instancia =
                geradorInstancia.gerarInstanciaParaTentativa(varianteAndar1, tentativaAndar);

        // escolhe propositalmente o distrator "String" na LACUNA_1 (q pedia int -> TIPO_DE_DADO)
        String blocoStringDistrator = instancia.visaoPublicaParaArena().blocosDisponiveisEmbaralhados().stream()
                .filter(bloco -> "String".equals(bloco.textoCodigoBloco()))
                .map(BlocoCodigoDisponivel::codigoIdentificadorBloco)
                .findFirst()
                .orElseThrow();

        Map<String, String> mapaResposta = new LinkedHashMap<>(
                montarRespostaCorretaParaTeste(varianteAndar1, tentativaAndar).getBlocosEscolhidosPorLacuna());
        mapaResposta.put("LACUNA_1", blocoStringDistrator);

        ResultadoValidacaoBlocosJava resultado = servicoValidacao.validarSubmissaoEmBlocos(
                varianteAndar1,
                tentativaAndar,
                "SWORD",
                new RespostaBlocosEnviadaJogador(mapaResposta));

        assertEquals(ResultadoExecucaoSubmissao.INCORRETA, resultado.resultadoExecucao());
        assertEquals(CategoriaErro.TIPO_DE_DADO, resultado.categoriaErroDetectada());
        assertEquals("LACUNA_1", resultado.identificadorLacunaComErro());
        assertTrue(resultado.acoesHeroiNaArena().isEmpty());
    }

    @Test
    void deveRejeitarBlocoForjadoQueNaoExisteNaTentativa() {
        UUID tentativaAndar = UUID.fromString("44444444-4444-4444-8444-444444444444");
        DefinicaoVarianteDesafioBlocos varianteAndar1 = catalogoDesafios.listarVariantesAtivasPorAndar(1).getFirst();

        RespostaBlocosEnviadaJogador respostaForjada = new RespostaBlocosEnviadaJogador(Map.of(
                "LACUNA_1", "BLOCO_INVENTADO_999",
                "LACUNA_2", "BLOCO_2",
                "LACUNA_3", "BLOCO_3"));

        ResultadoValidacaoBlocosJava resultado = servicoValidacao.validarSubmissaoEmBlocos(
                varianteAndar1,
                tentativaAndar,
                "SWORD",
                respostaForjada);

        assertEquals(ResultadoExecucaoSubmissao.INCORRETA, resultado.resultadoExecucao());
        assertEquals(CategoriaErro.SINTAXE, resultado.categoriaErroDetectada());
    }

    @Test
    void deveLiberarCheckpoint11AoVencerChefe10ESemRegredirEmReplay() {
        UUID tentativaChefe10 = UUID.fromString("55555555-5555-4555-8555-555555555555");
        CombateService.AberturaAndarBlocos aberturaChefe = servicoCombate.iniciarAndarComSorteioBlocos(
                10,
                List.of(),
                tentativaChefe10);

        assertTrue(aberturaChefe.andarDeChefe());

        RespostaBlocosEnviadaJogador respostaCorreta = montarRespostaCorretaParaTeste(
                aberturaChefe.definicaoVarianteInterna(),
                tentativaChefe10);

        // primeira vitoria no chefe 10 -> libera ciclo 2 e checkpoint 11 (nunca 10!)
        CombateService.ResultadoTurnoBlocos vitoriaPrimeira = servicoCombate.processarSubmissaoBlocos(
                aberturaChefe.definicaoVarianteInterna(),
                tentativaChefe10,
                "SWORD",
                respostaCorreta,
                2,
                1);

        assertEquals(ResultadoExecucaoSubmissao.CORRETA, vitoriaPrimeira.resultadoExecucao());
        assertTrue(vitoriaPrimeira.cicloConcluidoComVitoria());
        assertTrue(vitoriaPrimeira.novoCheckpointDesbloqueado());
        assertTrue(vitoriaPrimeira.recursosRestauradosNoProximoCiclo());
        assertEquals(2, vitoriaPrimeira.maiorCicloDesbloqueado());
        assertEquals(11, vitoriaPrimeira.andarCheckpointReferencia());

        // replay do chefe 10 qnd o jogador ja ta no ciclo 3 -> nn pode regredir o ciclo 3!
        CombateService.ResultadoTurnoBlocos vitoriaReplay = servicoCombate.processarSubmissaoBlocos(
                aberturaChefe.definicaoVarianteInterna(),
                tentativaChefe10,
                "STAFF",
                respostaCorreta,
                3,
                3);

        assertEquals(3, vitoriaReplay.maiorCicloDesbloqueado());
        assertFalse(vitoriaReplay.novoCheckpointDesbloqueado());
    }

    @Test
    void deveEncerrarRunComoDerrotadaQuandoZerarVidasSemReiniciarAutomaticamente() {
        UUID tentativaAndar = UUID.fromString("66666666-6666-4666-8666-666666666666");
        CombateService.AberturaAndarBlocos aberturaAndar7 = servicoCombate.iniciarAndarComSorteioBlocos(
                7,
                List.of(),
                tentativaAndar);

        CombateService.ResultadoTurnoBlocos resultadoDerrota = servicoCombate.processarSubmissaoBlocos(
                aberturaAndar7.definicaoVarianteInterna(),
                tentativaAndar,
                "SWORD",
                new RespostaBlocosEnviadaJogador(Map.of()),
                1,
                1);

        assertEquals(ResultadoExecucaoSubmissao.INCORRETA, resultadoDerrota.resultadoExecucao());
        assertEquals(0, resultadoDerrota.quantidadeVidasRestantes());
        assertTrue(resultadoDerrota.tentativaCicloDerrotada());
        assertEquals(7, resultadoDerrota.proximoAndarDaRun());
        assertEquals(1, resultadoDerrota.andarCheckpointReferencia());
    }

    private RespostaBlocosEnviadaJogador montarRespostaCorretaParaTeste(
            DefinicaoVarianteDesafioBlocos variante,
            UUID tentativaAndar) {
        GeradorInstanciaDesafioBlocos.InstanciaInternaDesafioBlocos instancia =
                geradorInstancia.gerarInstanciaParaTentativa(variante, tentativaAndar);

        Map<String, String> blocosEscolhidos = new LinkedHashMap<>();
        for (GeradorInstanciaDesafioBlocos.LacunaResolvidaInterna lacuna : instancia.mapaGabaritoPorLacuna().values()) {
            String codigoCerto = instancia.visaoPublicaParaArena().blocosDisponiveisEmbaralhados().stream()
                    .filter(bloco -> lacuna.respostasValidasResolvidas().contains(bloco.textoCodigoBloco()))
                    .filter(bloco -> !blocosEscolhidos.containsValue(bloco.codigoIdentificadorBloco()))
                    .map(BlocoCodigoDisponivel::codigoIdentificadorBloco)
                    .findFirst()
                    .orElseThrow();
            blocosEscolhidos.put(lacuna.identificadorLacuna(), codigoCerto);
        }
        return new RespostaBlocosEnviadaJogador(blocosEscolhidos);
    }
}
