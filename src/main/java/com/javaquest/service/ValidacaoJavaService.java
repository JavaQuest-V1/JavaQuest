package com.javaquest.service;

import com.javaquest.dominio.AcaoHeroi;
import com.javaquest.dominio.CategoriaErro;
import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import com.javaquest.dominio.RespostaBlocosEnviadaJogador;
import com.javaquest.dominio.ResultadoExecucaoSubmissao;
import com.javaquest.dominio.ResultadoValidacaoBlocosJava;
import com.javaquest.dominio.SubmissaoCodigo;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;

// substitui a validacao de texto livre por validacao de montagem de blocos (RF-17 e RF-18)
@Service
public class ValidacaoJavaService {

    public static final String VERSAO_ATUAL_VALIDADOR_BLOCOS = "blocos-v1.0";

    private final GeradorInstanciaDesafioBlocos geradorInstanciaDesafioBlocos;

    public ValidacaoJavaService(GeradorInstanciaDesafioBlocos geradorInstanciaDesafioBlocos) {
        this.geradorInstanciaDesafioBlocos =                                            Objects.requireNonNull(geradorInstanciaDesafioBlocos);
    }

    // roda fora da transacao do banco pra nn travar pool de conexao qnd tiver mt gente jogando
    public ResultadoValidacaoBlocosJava validarSubmissaoEmBlocos(
            DefinicaoVarianteDesafioBlocos definicaoVarianteAtiva,
            UUID identificadorTentativaAndar,
            String codigoArmamentoDaRun,
            RespostaBlocosEnviadaJogador respostaEnviadaJogador) {
        Instant instanteInicioValidacao = Instant.now();

        try {
            Objects.requireNonNull(definicaoVarianteAtiva, "A definicao da variante eh obrigatoria.");
            Objects.requireNonNull(identificadorTentativaAndar, "O id da tentativa eh obrigatorio.");

            // reconstroi exatamente a msm instancia q o jogador recebeu usando o attempt_id como semente
            GeradorInstanciaDesafioBlocos.InstanciaInternaDesafioBlocos instanciaEsperada =
                    geradorInstanciaDesafioBlocos.gerarInstanciaParaTentativa(
                            definicaoVarianteAtiva,
                            identificadorTentativaAndar);

            Map<String, String> blocosEscolhidos = respostaEnviadaJogador != null
                    ? respostaEnviadaJogador.getBlocosEscolhidosPorLacuna()
                    : Collections.emptyMap();

            Map<String, GeradorInstanciaDesafioBlocos.BlocoResolvidoInterno> poolBlocosValidos =
                    instanciaEsperada.mapaBlocosInternosPorCodigo();
            Map<String, GeradorInstanciaDesafioBlocos.LacunaResolvidaInterna> gabaritoLacunas =
                    instanciaEsperada.mapaGabaritoPorLacuna();

            // monta o codigo Java resultante e ja checa se tem lacuna vazia, bloco forjado ou repetido
            String codigoJavaMontado = instanciaEsperada.visaoPublicaParaArena().templateCodigoComLacunasResolvido();
            Set<String> codigosBlocosJaUtilizados = new HashSet<>();

            String primeiraLacunaComErro = null;
            CategoriaErro categoriaPrimeiroErro = null;
            String mensagemPrimeiroErro = null;

            for (GeradorInstanciaDesafioBlocos.LacunaResolvidaInterna lacunaAtual : gabaritoLacunas.values()) {
                String idLacuna = lacunaAtual.identificadorLacuna();
                String codigoBlocoEscolhido = blocosEscolhidos.get(idLacuna);

                if (codigoBlocoEscolhido == null || codigoBlocoEscolhido.isBlank()) {
                    if (primeiraLacunaComErro == null) {
                        primeiraLacunaComErro = idLacuna;
                        categoriaPrimeiroErro = CategoriaErro.SINTAXE;
                        mensagemPrimeiroErro = "Faltou preencher a lacuna " + idLacuna + " no codigo.";
                    }
                    continue;
                }

                GeradorInstanciaDesafioBlocos.BlocoResolvidoInterno blocoEncontrado =
                        poolBlocosValidos.get(codigoBlocoEscolhido);

                // trava anti-cheat: se mandou um id de bloco q nn existe nessa tentativa, barra na hora
                if (blocoEncontrado == null) {
                    if (primeiraLacunaComErro == null) {
                        primeiraLacunaComErro = idLacuna;
                        categoriaPrimeiroErro = CategoriaErro.SINTAXE;
                        mensagemPrimeiroErro = "Bloco invalido enviado para a lacuna " + idLacuna + ".";
                    }
                    continue;
                }

                // cada bloco fisico arrastavel soh pode ocupar uma lacuna por vez
                if (!codigosBlocosJaUtilizados.add(codigoBlocoEscolhido)) {
                    if (primeiraLacunaComErro == null) {
                        primeiraLacunaComErro = idLacuna;
                        categoriaPrimeiroErro = CategoriaErro.LOGICA;
                        mensagemPrimeiroErro = "O mesmo bloco foi reutilizado em mais de uma lacuna.";
                    }
                }

                codigoJavaMontado = codigoJavaMontado.replace(
                        "{{" + idLacuna + "}}",
                        blocoEncontrado.textoCodigoResolvido());

                boolean respostaBateComGabarito = lacunaAtual.respostasValidasResolvidas().stream()
                        .anyMatch(respostaValida -> respostaValida.equals(blocoEncontrado.textoCodigoResolvido()));

                if (!respostaBateComGabarito && primeiraLacunaComErro == null) {
                    primeiraLacunaComErro = idLacuna;
                    // se o bloco eh um distrator ja classificado, pega a categoria exata dele; senao usa a padrao da lacuna
                    categoriaPrimeiroErro = blocoEncontrado.categoriaErroSeEscolhidoErrado() != null
                            ? blocoEncontrado.categoriaErroSeEscolhidoErrado()
                            : lacunaAtual.categoriaErroPadraoDaLacuna();
                    mensagemPrimeiroErro = "O bloco escolhido na lacuna " + idLacuna + " nao atende ao objetivo do andar.";
                }
            }

            long tempoExecucaoMs = Math.max(0L, Duration.between(instanteInicioValidacao, Instant.now()).toMillis());

            if (primeiraLacunaComErro != null) {
                CategoriaErro categoriaGarantida = categoriaPrimeiroErro != null
                        ? categoriaPrimeiroErro
                        : CategoriaErro.LOGICA;

                return new ResultadoValidacaoBlocosJava(
                        ResultadoExecucaoSubmissao.INCORRETA,
                        categoriaGarantida,
                        primeiraLacunaComErro,
                        codigoJavaMontado,
                        Collections.emptyList(),
                        tempoExecucaoMs,
                        VERSAO_ATUAL_VALIDADOR_BLOCOS,
                        mensagemPrimeiroErro);
            }

            List<AcaoHeroi> acoesHeroiNaArena = definicaoVarianteAtiva.resolverAcoesHeroiParaArmamento(codigoArmamentoDaRun);
            return new ResultadoValidacaoBlocosJava(
                    ResultadoExecucaoSubmissao.CORRETA,
                    null,
                    null,
                    codigoJavaMontado,
                    acoesHeroiNaArena,
                    tempoExecucaoMs,
                    VERSAO_ATUAL_VALIDADOR_BLOCOS,
                    "Codigo montado corretamente! O heroi executou o comando.");
        } catch (RuntimeException erroInesperado) {
            // erro tecnico no validador nunca pode descontar vida do jogador (regra do adendo)
            long tempoExecucaoMs = Math.max(0L, Duration.between(instanteInicioValidacao, Instant.now()).toMillis());
            return new ResultadoValidacaoBlocosJava(
                    ResultadoExecucaoSubmissao.ERRO_TECNICO,
                    null,
                    null,
                    "",
                    Collections.emptyList(),
                    tempoExecucaoMs,
                    VERSAO_ATUAL_VALIDADOR_BLOCOS,
                    "Falha tecnica interna ao validar os blocos: " + erroInesperado.getMessage());
        }
    }

    public SubmissaoCodigo converterParaSubmissaoCodigo(
            UUID identificadorTentativaAndar,
            Long identificadorDesafioNoBanco,
            RespostaBlocosEnviadaJogador respostaEnviadaJogador,
            ResultadoValidacaoBlocosJava resultadoValidacao) {
        SubmissaoCodigo submissaoRegistrada = new SubmissaoCodigo(resultadoValidacao.codigoJavaMontadoFinal());
        submissaoRegistrada.setIdentificadorSubmissao(UUID.randomUUID());
        submissaoRegistrada.setIdentificadorTentativaAndar(identificadorTentativaAndar);
        submissaoRegistrada.setIdentificadorDesafioNoBanco(identificadorDesafioNoBanco);
        submissaoRegistrada.setBlocosEscolhidosPorLacuna(
                respostaEnviadaJogador != null ? respostaEnviadaJogador.getBlocosEscolhidosPorLacuna() : Collections.emptyMap());
        submissaoRegistrada.setResultadoExecucao(resultadoValidacao.resultadoExecucao());
        submissaoRegistrada.setCategoriaErroDetectada(resultadoValidacao.categoriaErroDetectada());
        submissaoRegistrada.setEhCorreta(resultadoValidacao.submissaoFoiAprovada());
        submissaoRegistrada.setSintaxeValida(resultadoValidacao.categoriaErroDetectada() != CategoriaErro.SINTAXE);
        submissaoRegistrada.setObjetivoAtingido(resultadoValidacao.submissaoFoiAprovada());
        submissaoRegistrada.setAcoes(resultadoValidacao.acoesHeroiNaArena());
        submissaoRegistrada.setTempoExecucaoEmMilissegundos(resultadoValidacao.tempoExecucaoEmMilissegundos());
        submissaoRegistrada.setVersaoValidador(resultadoValidacao.versaoValidadorBlocos());
        return submissaoRegistrada;
    }
}
