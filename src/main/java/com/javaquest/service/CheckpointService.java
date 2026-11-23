package com.javaquest.service;

import com.javaquest.dominio.CheckpointDesbloqueado;
import com.javaquest.dominio.Ciclo;
import com.javaquest.dominio.Jogador;
import com.javaquest.dominio.ProgressoJogador;
import java.util.Objects;
import java.util.Optional;

public class CheckpointService {

    public static final int INTERVALO_CHECKPOINT = 10;

    private final JogadorRepository jogadorRepository;
    private final TransactionRunner transactionRunner;

    public CheckpointService(JogadorRepository jogadorRepository, TransactionRunner transactionRunner) {
        this.jogadorRepository = Objects.requireNonNull(jogadorRepository);
        this.transactionRunner = Objects.requireNonNull(transactionRunner);
    }

    public boolean ehAndarDeCheckpoint(int numeroAndar) {
        return numeroAndar > 0 && numeroAndar % INTERVALO_CHECKPOINT == 0;
    }

    public CheckpointDesbloqueado registrarCheckpoint(String email, int numeroAndar) {
        if (!ehAndarDeCheckpoint(numeroAndar)) {
            throw new IllegalArgumentException(
                    "O andar " + numeroAndar + " não corresponde a um checkpoint a cada 10 andares.");
        }
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            ProgressoJogador progresso = obterProgressoObrigatorio(jogador);

            progresso.setCheckpointAtual(numeroAndar);
            if (progresso.getAndarAtual() == null || progresso.getAndarAtual() < numeroAndar) {
                progresso.setAndarAtual(numeroAndar);
            }

            jogadorRepository.salvar(jogador);
            return new CheckpointDesbloqueado(numeroAndar);
        });
    }

    public ProgressoJogador retomarDoUltimoCheckpoint(String email) {
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            ProgressoJogador progresso = obterProgressoObrigatorio(jogador);

            progresso.reiniciarNoUltimoCheckpoint();
            jogadorRepository.salvar(jogador);
            return progresso;
        });
    }

    public Ciclo desbloquearProximoCiclo(String email, int andarInicial, int andarFinal) {
        if (andarInicial <= 0 || andarFinal < andarInicial) {
            throw new IllegalArgumentException("Intervalo de andares inválido para o ciclo.");
        }
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            ProgressoJogador progresso = obterProgressoObrigatorio(jogador);

            progresso.setCheckpointAtual(andarInicial);
            progresso.setAndarAtual(andarInicial);
            progresso.restaurarRecursos();
            progresso.setAndarEmAndamento(false);

            jogadorRepository.salvar(jogador);
            return new Ciclo(andarInicial, andarFinal, true);
        });
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