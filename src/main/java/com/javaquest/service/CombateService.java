package com.javaquest.service;

import com.javaquest.dominio.AcaoHeroi;
import com.javaquest.dominio.CategoriaErro;
import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import com.javaquest.dominio.InstanciaDesafioBlocosPublica;
import com.javaquest.dominio.RespostaBlocosEnviadaJogador;
import com.javaquest.dominio.ResultadoExecucaoSubmissao;
import com.javaquest.dominio.ResultadoValidacaoBlocosJava;
import com.javaquest.dominio.SubmissaoCodigo;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;

// orquestra o inicio de andar com sorteio e a respostas em blocos
@Service
public class CombateService {

    public static final int QUANTIDADE_ANDARES_POR_CICLO = 10;

    private final ProvedorCatalogoDesafiosBlocos provedorCatalogoDesafiosBlocos;
    private final SorteadorVarianteDesafioService sorteadorVarianteDesafioService;
    private final GeradorInstanciaDesafioBlocos geradorInstanciaDesafioBlocos;
    private final ValidacaoJavaService validacaoJavaService;

    public CombateService(
            ProvedorCatalogoDesafiosBlocos provedorCatalogoDesafiosBlocos,
            SorteadorVarianteDesafioService sorteadorVarianteDesafioService,
            GeradorInstanciaDesafioBlocos geradorInstanciaDesafioBlocos,
            ValidacaoJavaService validacaoJavaService) {
        this.provedorCatalogoDesafiosBlocos = Objects.requireNonNull(provedorCatalogoDesafiosBlocos);
        this.sorteadorVarianteDesafioService = Objects.requireNonNull(sorteadorVarianteDesafioService);
        this.geradorInstanciaDesafioBlocos = Objects.requireNonNull(geradorInstanciaDesafioBlocos);
        this.validacaoJavaService = Objects.requireNonNull(validacaoJavaService);
    }

    // sorteia uma variante diferente da anterior e monta os blocos embaralhados pro andar
    public AberturaAndarBlocos iniciarAndarComSorteioBlocos(
            int numeroAndarNaTorre,
            List<String> historicoChavesVariantesVistasNoAndar,
            UUID identificadorTentativaAndar) {
        if (numeroAndarNaTorre <= 0) {
            throw new IllegalArgumentException("Numero do andar precisa ser maior que zero.");
        }
        UUID tentativaEmUso = identificadorTentativaAndar != null
                ? identificadorTentativaAndar
                : UUID.randomUUID();

        List<DefinicaoVarianteDesafioBlocos> variantesDoAndar =
                provedorCatalogoDesafiosBlocos.listarVariantesAtivasPorAndar(numeroAndarNaTorre);

        DefinicaoVarianteDesafioBlocos varianteSorteada = sorteadorVarianteDesafioService
                .sortearProximaVarianteDoAndar(variantesDoAndar, historicoChavesVariantesVistasNoAndar);

        InstanciaDesafioBlocosPublica desafioPublicoEmbaralhado = geradorInstanciaDesafioBlocos
                .gerarInstanciaParaTentativa(varianteSorteada, tentativaEmUso)
                .visaoPublicaParaArena();

        return new AberturaAndarBlocos(
                varianteSorteada,
                desafioPublicoEmbaralhado,
                ehAndarDeChefe(numeroAndarNaTorre));
    }

    // processa os blocos enviados pelo jogador sem reiniciar automaticamente em caso de derrota
    public ResultadoTurnoBlocos processarSubmissaoBlocos(
            DefinicaoVarianteDesafioBlocos definicaoVarianteAtiva,
            UUID identificadorTentativaAndar,
            String codigoArmamentoDaRun,
            RespostaBlocosEnviadaJogador respostaBlocosJogador,
            int quantidadeVidasAtuaisNaRun,
            int maiorCicloJaDesbloqueado) {
        Objects.requireNonNull(definicaoVarianteAtiva, "A variante ativa do andar eh obrigatoria.");
        Objects.requireNonNull(identificadorTentativaAndar, "O id da tentativa do andar eh obrigatorio.");

        if (quantidadeVidasAtuaisNaRun <= 0) {
            throw new IllegalStateException("A tentativa de ciclo ja esta sem vidas e precisa ser reiniciada no checkpoint.");
        }

        // valida fora de qualquer lock de banco (RNF-09 e plano §5)
        ResultadoValidacaoBlocosJava resultadoValidacao = validacaoJavaService.validarSubmissaoEmBlocos(
                definicaoVarianteAtiva,
                identificadorTentativaAndar,
                codigoArmamentoDaRun,
                respostaBlocosJogador);

        SubmissaoCodigo submissaoRegistrada = validacaoJavaService.converterParaSubmissaoCodigo(
                identificadorTentativaAndar,
                definicaoVarianteAtiva.identificadorDesafioNoBanco(),
                respostaBlocosJogador,
                resultadoValidacao);

        int numeroAndarAtual = definicaoVarianteAtiva.numeroAndarNaTorre();
        int numeroCicloAtual = ((numeroAndarAtual - 1) / QUANTIDADE_ANDARES_POR_CICLO) + 1;
        int andarCheckpointDoCicloAtual = ((numeroCicloAtual - 1) * QUANTIDADE_ANDARES_POR_CICLO) + 1;

        if (resultadoValidacao.resultadoExecucao() == ResultadoExecucaoSubmissao.ERRO_TECNICO) {
            // falha tecnica nn tira vida nem muda estado do andar
            return new ResultadoTurnoBlocos(
                    ResultadoExecucaoSubmissao.ERRO_TECNICO,
                    submissaoRegistrada,
                    resultadoValidacao.acoesHeroiNaArena(),
                    null,
                    quantidadeVidasAtuaisNaRun,
                    numeroAndarAtual,
                    maiorCicloJaDesbloqueado,
                    andarCheckpointDoCicloAtual,
                    false,
                    false,
                    false,
                    false,
                    resultadoValidacao.mensagemFeedbackPedagogico());
        }

        if (resultadoValidacao.submissaoFoiAprovada()) {
            boolean concluiuChefe = ehAndarDeChefe(numeroAndarAtual);
            if (concluiuChefe) {
                // garante q o checkpoint n vai voltar pra tras qnd o jogador rejogar ciclo antigo (RF-10 e RF-12)
                int novoMaiorCiclo = Math.max(maiorCicloJaDesbloqueado, numeroCicloAtual + 1);
                boolean desbloqueouNovoCheckpoint = novoMaiorCiclo > maiorCicloJaDesbloqueado;
                // checkpoint eh sempre 11, 21, 31... e nunca 10, 20, 30
                int proximoAndarCheckpoint = ((numeroCicloAtual) * QUANTIDADE_ANDARES_POR_CICLO) + 1;

                return new ResultadoTurnoBlocos(
                        ResultadoExecucaoSubmissao.CORRETA,
                        submissaoRegistrada,
                        resultadoValidacao.acoesHeroiNaArena(),
                        null,
                        quantidadeVidasAtuaisNaRun,
                        numeroAndarAtual,
                        novoMaiorCiclo,
                        proximoAndarCheckpoint,
                        true,
                        desbloqueouNovoCheckpoint,
                        true,
                        false,
                        "Chefe derrotado! Checkpoint do andar " + proximoAndarCheckpoint
                                + " liberado com 3 vidas e 3 dicas para o proximo ciclo.");
            }

            return new ResultadoTurnoBlocos(
                    ResultadoExecucaoSubmissao.CORRETA,
                    submissaoRegistrada,
                    resultadoValidacao.acoesHeroiNaArena(),
                    null,
                    quantidadeVidasAtuaisNaRun,
                    numeroAndarAtual + 1,
                    maiorCicloJaDesbloqueado,
                    andarCheckpointDoCicloAtual,
                    false,
                    false,
                    false,
                    false,
                    resultadoValidacao.mensagemFeedbackPedagogico());
        }

        // resposta incorreta: tira 1 vida e habilita dica pra categoria de erro detectada
        int vidasRestantesAposErro = Math.max(0, quantidadeVidasAtuaisNaRun - 1);
        boolean tentativaCicloDerrotada = vidasRestantesAposErro == 0;

        String mensagemErro = tentativaCicloDerrotada
                ? "Sem vidas restantes. Tentativa encerrada; reinicie no checkpoint do andar " + andarCheckpointDoCicloAtual + "."
                : resultadoValidacao.mensagemFeedbackPedagogico() + " Voce perdeu 1 vida.";

        return new ResultadoTurnoBlocos(
                ResultadoExecucaoSubmissao.INCORRETA,
                submissaoRegistrada,
                List.of(),
                resultadoValidacao.categoriaErroDetectada(),
                vidasRestantesAposErro,
                numeroAndarAtual,
                maiorCicloJaDesbloqueado,
                andarCheckpointDoCicloAtual,
                false,
                false,
                false,
                tentativaCicloDerrotada,
                mensagemErro);
    }

    public boolean ehAndarDeChefe(int numeroAndarNaTorre) {
        return numeroAndarNaTorre > 0 && numeroAndarNaTorre % QUANTIDADE_ANDARES_POR_CICLO == 0;
    }

    public record AberturaAndarBlocos(
            DefinicaoVarianteDesafioBlocos definicaoVarianteInterna,
            InstanciaDesafioBlocosPublica desafioPublicoParaArena,
            boolean andarDeChefe) {
    }

    public record ResultadoTurnoBlocos(
            ResultadoExecucaoSubmissao resultadoExecucao,
            SubmissaoCodigo submissaoRegistrada,
            List<AcaoHeroi> acoesHeroiNaArena,
            CategoriaErro categoriaErroDetectada,
            int quantidadeVidasRestantes,
            int proximoAndarDaRun,
            int maiorCicloDesbloqueado,
            int andarCheckpointReferencia,
            boolean cicloConcluidoComVitoria,
            boolean novoCheckpointDesbloqueado,
            boolean recursosRestauradosNoProximoCiclo,
            boolean tentativaCicloDerrotada,
            String mensagemFeedback) {
    }
}
