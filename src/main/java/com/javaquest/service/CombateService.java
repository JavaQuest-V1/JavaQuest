package com.javaquest.service;

import com.javaquest.dominio.AcaoHeroi;
import com.javaquest.dominio.CategoriaErro;
import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import com.javaquest.dominio.InstanciaDesafioBlocosPublica;
import com.javaquest.dominio.RespostaBlocosEnviadaJogador;
import com.javaquest.dominio.ResultadoExecucaoSubmissao;
import com.javaquest.dominio.ResultadoValidacaoBlocosJava;
import com.javaquest.dominio.SubmissaoCodigo;
import com.javaquest.repository.ExecutorComandoBancoJogador;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroInimigoAndar;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroTentativaAndar;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroTentativaCiclo;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

// orquestra o inicio de andar com sorteio rogue-lite e a submissao em blocos plugado no Supabase
@Service
public class CombateService {

    public static final int QUANTIDADE_ANDARES_POR_CICLO = 10;

    private final ProvedorCatalogoDesafiosBlocos provedorCatalogoDesafiosBlocos;
    private final SorteadorVarianteDesafioService sorteadorVarianteDesafioService;
    private final GeradorInstanciaDesafioBlocos geradorInstanciaDesafioBlocos;
    private final ValidacaoJavaService validacaoJavaService;
    private final ExecutorComandoBancoJogador executorComandoBancoJogador;
    private final RepositorioCatalogoBancoSupabase repositorioCatalogoBanco;
    private final RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso;

    @Autowired
    public CombateService(
            ProvedorCatalogoDesafiosBlocos provedorCatalogoDesafiosBlocos,
            SorteadorVarianteDesafioService sorteadorVarianteDesafioService,
            GeradorInstanciaDesafioBlocos geradorInstanciaDesafioBlocos,
            ValidacaoJavaService validacaoJavaService,
            ExecutorComandoBancoJogador executorComandoBancoJogador,
            RepositorioCatalogoBancoSupabase repositorioCatalogoBanco,
            RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso) {
        this.provedorCatalogoDesafiosBlocos = Objects.requireNonNull(provedorCatalogoDesafiosBlocos);
        this.sorteadorVarianteDesafioService = Objects.requireNonNull(sorteadorVarianteDesafioService);
        this.geradorInstanciaDesafioBlocos = Objects.requireNonNull(geradorInstanciaDesafioBlocos);
        this.validacaoJavaService = Objects.requireNonNull(validacaoJavaService);
        this.executorComandoBancoJogador = executorComandoBancoJogador;
        this.repositorioCatalogoBanco = repositorioCatalogoBanco;
        this.repositorioPerfilEProgresso = repositorioPerfilEProgresso;
    }

    // construtor reduzido pra testes unitarios puros do motor de blocos sem depender do banco
    public CombateService(
            ProvedorCatalogoDesafiosBlocos provedorCatalogoDesafiosBlocos,
            SorteadorVarianteDesafioService sorteadorVarianteDesafioService,
            GeradorInstanciaDesafioBlocos geradorInstanciaDesafioBlocos,
            ValidacaoJavaService validacaoJavaService) {
        this(
                provedorCatalogoDesafiosBlocos,
                sorteadorVarianteDesafioService,
                geradorInstanciaDesafioBlocos,
                validacaoJavaService,
                null,
                null,
                null);
    }

    // === Fluxo completo integrado ao Supabase (command('start_floor') e command('submit')) ===

    // RF-20 e RF-21: o banco sorteia a variante anti-memorizacao e o Java gera os blocos embaralhados pela semente attempt_id
    public AberturaAndarArenaSupabase iniciarAndarNaRunSupabase(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID chaveIdempotenciaRequisicao,
            UUID identificadorTentativaCiclo) {
        exigirIntegracaoSupabaseAtiva();
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        Objects.requireNonNull(identificadorTentativaCiclo, "O id da tentativa de ciclo eh obrigatorio.");

        UUID chaveSegura = chaveIdempotenciaRequisicao != null
                ? chaveIdempotenciaRequisicao
                : UUID.randomUUID();
        UUID identificadorJogador = usuarioAutenticado.identificadorUnicoJogador();

        JsonNode respostaInicioBanco = executorComandoBancoJogador.executarComandoIdempotente(
                identificadorJogador,
                chaveSegura,
                "start_floor",
                Map.of("run_id", identificadorTentativaCiclo.toString()));

        UUID identificadorTentativaAndar = UUID.fromString(respostaInicioBanco.path("attempt_id").asString());
        long identificadorDesafioNoBanco = respostaInicioBanco.path("challenge_id").asLong();
        int numeroAndarSorteado = respostaInicioBanco.path("floor").asInt();

        DefinicaoVarianteDesafioBlocos definicaoVariante = repositorioCatalogoBanco.buscarDefinicaoDaTentativa(
                identificadorDesafioNoBanco,
                numeroAndarSorteado);

        // msm attempt_id sempre recria exatamente os msm blocos/valores caso o jogador de F5
        InstanciaDesafioBlocosPublica desafioPublicoEmbaralhado = geradorInstanciaDesafioBlocos
                .gerarInstanciaParaTentativa(definicaoVariante, identificadorTentativaAndar)
                .visaoPublicaParaArena();

        List<RegistroInimigoAndar> inimigosDoAndar =
                repositorioCatalogoBanco.listarInimigosPorAndar(numeroAndarSorteado);

        RegistroTentativaCiclo estadoRunAtual = repositorioPerfilEProgresso
                .buscarTentativaCicloPorId(identificadorJogador, identificadorTentativaCiclo)
                .orElseThrow(() -> new IllegalStateException("Estado da tentativa de ciclo indisponivel."));

        return new AberturaAndarArenaSupabase(
                identificadorTentativaCiclo,
                identificadorTentativaAndar,
                numeroAndarSorteado,
                ehAndarDeChefe(numeroAndarSorteado),
                estadoRunAtual.codigoArmamentoFixo(),
                estadoRunAtual.quantidadeVidasRestantes(),
                estadoRunAtual.quantidadeDicasRestantes(),
                desafioPublicoEmbaralhado,
                inimigosDoAndar);
    }

    // valida os blocos FORA da transacao JDBC e depois commita atomicamente via command('submit')
    public ResultadoSubmissaoArenaSupabase submeterBlocosNaTentativaSupabase(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID chaveIdempotenciaRequisicao,
            UUID identificadorTentativaAndar,
            RespostaBlocosEnviadaJogador respostaBlocosJogador) {
        return submeterBlocosNaTentativaSupabase(usuarioAutenticado, chaveIdempotenciaRequisicao,
                identificadorTentativaAndar, respostaBlocosJogador, null);
    }

    public ResultadoSubmissaoArenaSupabase submeterBlocosNaTentativaSupabase(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID chaveIdempotenciaRequisicao,
            UUID identificadorTentativaAndar,
            RespostaBlocosEnviadaJogador respostaBlocosJogador,
            MetricasService.DadosEventoTempoEstudo intervaloFinal) {
        exigirIntegracaoSupabaseAtiva();
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        Objects.requireNonNull(identificadorTentativaAndar, "O id da tentativa do andar eh obrigatorio.");

        UUID chaveSegura = Objects.requireNonNull(chaveIdempotenciaRequisicao,
                "A submissao exige uma chave de idempotencia estavel.");
        UUID identificadorJogador = usuarioAutenticado.identificadorUnicoJogador();

        RegistroTentativaAndar tentativaAtual = repositorioPerfilEProgresso
                .buscarTentativaAndarPorId(identificadorJogador, identificadorTentativaAndar)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Tentativa de andar nao encontrada para este jogador."));

        RegistroTentativaCiclo runDaTentativa = repositorioPerfilEProgresso
                .buscarTentativaCicloPorId(identificadorJogador, tentativaAtual.identificadorTentativaCiclo())
                .orElseThrow(() -> new IllegalStateException("Tentativa de ciclo associada nao encontrada."));

        DefinicaoVarianteDesafioBlocos definicaoVarianteAtiva = repositorioCatalogoBanco.buscarDefinicaoDaTentativa(
                tentativaAtual.identificadorDesafioNoBanco(),
                tentativaAtual.numeroAndar());

        // roda a validacao fora da transacao pra nn travar o banco qnd tiver mt gente jogando (RNF-09)
        ResultadoValidacaoBlocosJava resultadoValidacao = validacaoJavaService.validarSubmissaoEmBlocos(
                definicaoVarianteAtiva,
                identificadorTentativaAndar,
                runDaTentativa.codigoArmamentoFixo(),
                respostaBlocosJogador);

        // monta payload respeitando o CHECK do banco: error_category obrigatorio sse result = 'INCORRECT'
        Map<String, Object> payloadSubmissaoBanco = new LinkedHashMap<>();
        payloadSubmissaoBanco.put("attempt_id", identificadorTentativaAndar.toString());
        payloadSubmissaoBanco.put("choices", respostaBlocosJogador == null ? Map.of()
                : respostaBlocosJogador.getBlocosEscolhidosPorLacuna());
        payloadSubmissaoBanco.put("validation", resultadoValidacao);
        if (intervaloFinal != null) {
            payloadSubmissaoBanco.put("study_interval", intervaloFinal.paraComandoBanco());
        }
        payloadSubmissaoBanco.put("code", resultadoValidacao.codigoJavaMontadoFinal());
        payloadSubmissaoBanco.put("result", resultadoValidacao.resultadoExecucao().getCodigoPersistidoNoBanco());
        if (resultadoValidacao.resultadoExecucao() == ResultadoExecucaoSubmissao.INCORRETA) {
            CategoriaErro categoriaErro = Objects.requireNonNull(resultadoValidacao.categoriaErroDetectada(),
                    "Submissao incorreta sem categoria de erro.");
            payloadSubmissaoBanco.put("error_category", categoriaErro.name());
        } else {
            payloadSubmissaoBanco.put("error_category", null);
        }
        payloadSubmissaoBanco.put("validator_version", resultadoValidacao.versaoValidadorBlocos());
        payloadSubmissaoBanco.put("execution_time_ms", resultadoValidacao.tempoExecucaoEmMilissegundos());

        JsonNode respostaSubmitBanco = executorComandoBancoJogador.executarComandoIdempotente(
                identificadorJogador,
                chaveSegura,
                "submit",
                payloadSubmissaoBanco);

        ResultadoValidacaoBlocosJava validacaoConfirmada = executorComandoBancoJogador
                .lerValidacaoConfirmada(respostaSubmitBanco);
        UUID identificadorSubmissaoCriada = UUID.fromString(respostaSubmitBanco.required("submission_id").asString());
        String statusRunAtualizado = respostaSubmitBanco.required("status").asString();
        int andarAtualizadoNaRun = respostaSubmitBanco.required("floor").asInt();
        int vidasRestantes = respostaSubmitBanco.required("lives").asInt();
        int dicasRestantes = respostaSubmitBanco.required("hints").asInt();
        int maiorCicloAposSubmissao = respostaSubmitBanco.required("highest_unlocked_cycle").asInt();
        boolean venceuChefe = validacaoConfirmada.submissaoFoiAprovada() && ehAndarDeChefe(tentativaAtual.numeroAndar());
        boolean desbloqueouNovoCheckpoint = respostaSubmitBanco.required("checkpoint_unlocked").asBoolean();
        boolean tentativaCicloDerrotada = "DEFEATED".equalsIgnoreCase(statusRunAtualizado);
        boolean dicaDisponivelParaSubmissao =
                validacaoConfirmada.resultadoExecucao() == ResultadoExecucaoSubmissao.INCORRETA
                        && !tentativaCicloDerrotada
                        && dicasRestantes > 0;

        int andarMaiorCheckpoint = CheckpointService.calcularAndarCheckpointDoCiclo(maiorCicloAposSubmissao);

        return new ResultadoSubmissaoArenaSupabase(
                identificadorSubmissaoCriada,
                identificadorTentativaAndar,
                runDaTentativa.identificadorTentativaCiclo(),
                validacaoConfirmada.resultadoExecucao(),
                validacaoConfirmada.categoriaErroDetectada(),
                validacaoConfirmada.codigoJavaMontadoFinal(),
                validacaoConfirmada.acoesHeroiNaArena(),
                statusRunAtualizado,
                andarAtualizadoNaRun,
                vidasRestantes,
                dicasRestantes,
                maiorCicloAposSubmissao,
                andarMaiorCheckpoint,
                CheckpointService.calcularAndarCheckpointDoCiclo(runDaTentativa.numeroCiclo()),
                validacaoConfirmada.resultadoExecucao() == ResultadoExecucaoSubmissao.INCORRETA,
                venceuChefe,
                desbloqueouNovoCheckpoint,
                venceuChefe,
                tentativaCicloDerrotada,
                dicaDisponivelParaSubmissao,
                validacaoConfirmada.mensagemFeedbackPedagogico());
    }

    // === Metodos puros do motor de blocos (uteis pra simulacao e testes unitarios sem banco) ===

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
                int proximoAndarCheckpoint = (numeroCicloAtual * QUANTIDADE_ANDARES_POR_CICLO) + 1;

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

    private void exigirIntegracaoSupabaseAtiva() {
        if (executorComandoBancoJogador == null
                || repositorioCatalogoBanco == null
                || repositorioPerfilEProgresso == null) {
            throw new IllegalStateException("Dependencias do Supabase nao injetadas no CombateService.");
        }
    }

    public record AberturaAndarArenaSupabase(
            UUID identificadorTentativaCiclo,
            UUID identificadorTentativaAndar,
            int numeroAndarNaTorre,
            boolean andarDeChefe,
            String codigoArmamentoFixoDaRun,
            int quantidadeVidasRestantes,
            int quantidadeDicasRestantes,
            InstanciaDesafioBlocosPublica desafioPublicoEmbaralhado,
            List<RegistroInimigoAndar> inimigosDoAndar) {
    }

    public record ResultadoSubmissaoArenaSupabase(
            UUID identificadorSubmissaoCriada,
            UUID identificadorTentativaAndar,
            UUID identificadorTentativaCiclo,
            ResultadoExecucaoSubmissao resultadoExecucao,
            CategoriaErro categoriaErroDetectada,
            String codigoJavaMontadoFinal,
            List<AcaoHeroi> acoesHeroiNaArena,
            String statusRunAtualizado,
            int proximoAndarDaRun,
            int quantidadeVidasRestantes,
            int quantidadeDicasRestantes,
            int maiorCicloDesbloqueado,
            int andarMaiorCheckpoint,
            int andarCheckpointDeReinicio,
            boolean inimigoContraAtacou,
            boolean venceuChefeDoCiclo,
            boolean desbloqueouNovoCheckpoint,
            boolean recursosRestauradosNoProximoCiclo,
            boolean tentativaCicloDerrotada,
            boolean dicaDisponivelParaSubmissao,
            String mensagemFeedback) {
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
