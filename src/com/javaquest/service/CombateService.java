package com.javaquest.service;

import com.javaquest.dominio.AcaoHeroi;
import com.javaquest.dominio.Armamento;
import com.javaquest.dominio.Chefe;
import com.javaquest.dominio.Desafio;
import com.javaquest.dominio.Inimigo;
import com.javaquest.dominio.Jogador;
import com.javaquest.dominio.ProgressoJogador;
import com.javaquest.dominio.SubmissaoCodigo;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

public class CombateService {

    private final JogadorRepository jogadorRepository;
    private final ValidacaoJavaService validacaoJavaService;
    private final VidasDicasService vidasDicasService;
    private final CheckpointService checkpointService;
    private final TransactionRunner transactionRunner;

    public CombateService(
            JogadorRepository jogadorRepository,
            ValidacaoJavaService validacaoJavaService,
            VidasDicasService vidasDicasService,
            CheckpointService checkpointService,
            TransactionRunner transactionRunner) {
        this.jogadorRepository = Objects.requireNonNull(jogadorRepository);
        this.validacaoJavaService = Objects.requireNonNull(validacaoJavaService);
        this.vidasDicasService = Objects.requireNonNull(vidasDicasService);
        this.checkpointService = Objects.requireNonNull(checkpointService);
        this.transactionRunner = Objects.requireNonNull(transactionRunner);
    }

    public ResultadoTurno processarTurno(String email, Desafio desafio, String codigoJava, Inimigo inimigoAtual) {
        Objects.requireNonNull(desafio, "Desafio é obrigatório.");
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            ProgressoJogador progresso = obterProgressoObrigatorio(jogador);
            progresso.setAndarEmAndamento(true);
            progresso.setDesafioAtual(desafio);

            SubmissaoCodigo submissao = validacaoJavaService.validarSubmissao(desafio, codigoJava);
            List<AcaoHeroi> acoes = submissao.converterEmAcoes();

            if (submissao.isEhCorreta()) {
                executarAcoesDoHeroi(jogador, acoes, inimigoAtual);
                progresso.setDesafioAnterior(desafio);
                progresso.avancarAndar();

                int andarConcluido = desafio.getNumeroAndar() != null
                        ? desafio.getNumeroAndar()
                        : (progresso.getAndarAtual() - 1);

                boolean checkpointRegistrado = false;
                if (checkpointService.ehAndarDeCheckpoint(andarConcluido)) {
                    checkpointService.registrarCheckpoint(email, andarConcluido);
                    checkpointRegistrado = true;
                }

                jogadorRepository.salvar(jogador);
                return new ResultadoTurno(
                        true,
                        submissao,
                        progresso.getVidasRestantes(),
                        progresso.getAndarAtual(),
                        false,
                        checkpointRegistrado,
                        "Turno vencido! Código válido e objetivo concluído.");
            }

            if (inimigoAtual != null) {
                inimigoAtual.contraatacar();
            }

            VidasDicasService.ResultadoVida resultadoVida = vidasDicasService.descontarVida(email);
            Jogador atualizado = buscarJogadorObrigatorio(email);
            ProgressoJogador progressoAtualizado = obterProgressoObrigatorio(atualizado);

            if (resultadoVida.semVidas()) {
                progressoAtualizado.reiniciarNoUltimoCheckpoint();
                jogadorRepository.salvar(atualizado);
                return new ResultadoTurno(
                        false,
                        submissao,
                        progressoAtualizado.getVidasRestantes(),
                        progressoAtualizado.getAndarAtual(),
                        true,
                        false,
                        "Sem vidas restantes. Progresso reiniciado no último checkpoint.");
            }

            jogadorRepository.salvar(atualizado);
            return new ResultadoTurno(
                    false,
                    submissao,
                    progressoAtualizado.getVidasRestantes(),
                    progressoAtualizado.getAndarAtual(),
                    false,
                    false,
                    "Submissão inválida ou objetivo não atingido. Você perdeu 1 vida.");
        });
    }

    private void executarAcoesDoHeroi(Jogador jogador, List<AcaoHeroi> acoes, Inimigo inimigoAtual) {
        if (acoes == null || acoes.isEmpty()) {
            return;
        }
        Armamento arma = jogador.getArmamentoAtual();
        for (AcaoHeroi acao : acoes) {
            if (acao != null && acao.getTipo() != null) {
                switch (acao.getTipo()) {
                    case ATACAR -> {
                        if (arma != null && inimigoAtual != null) {
                            arma.atacar(inimigoAtual);
                        }
                    }
                    case MOVER, INTERAGIR -> {
                        // Ação processada na simulação do andar
                    }
                }
            }
        }
    }

    public boolean ehChefeDeAndar(Inimigo inimigo) {
        return inimigo instanceof Chefe;
    }

    private Jogador buscarJogadorObrigatorio(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail do jogador é obrigatório.");
        }
        return jogadorRepository.buscarPorEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Jogador não encontrado: " + email));
    }

    private ProgressoJogador obterProgressoObrigatorio(Jogador jogador) {
        ProgressoJogador progresso = jogador.getProgresso();
        if (progresso == null) {
            throw new IllegalStateException("Progresso do jogador não inicializado.");
        }
        return progresso;
    }

    public record ResultadoTurno(
            boolean vitoriaTurno,
            SubmissaoCodigo submissao,
            Integer vidasRestantes,
            Integer andarAtual,
            boolean reiniciouNoCheckpoint,
            boolean checkpointRegistrado,
            String mensagem) {
    }

    public interface JogadorRepository {
        Optional<Jogador> buscarPorEmail(String email);
        Jogador salvar(Jogador jogador);
    }

    @FunctionalInterface
    public interface TransactionRunner {
        <T> T runInTransaction(TransactionalOperation<T> operation);
    }

    @FunctionalInterface
    public interface TransactionalOperation<T> {
        T execute();
    }
}