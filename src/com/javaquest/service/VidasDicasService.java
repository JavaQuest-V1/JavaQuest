package com.javaquest.service;

import com.javaquest.dominio.CategoriaErro;
import com.javaquest.dominio.Dica;
import com.javaquest.dominio.Jogador;
import com.javaquest.dominio.ProgressoJogador;
import java.util.Objects;
import java.util.Optional;

public class VidasDicasService {

    private final JogadorRepository jogadorRepository;
    private final ProvedorDica provedorDica;
    private final TransactionRunner transactionRunner;

    public VidasDicasService(
            JogadorRepository jogadorRepository,
            ProvedorDica provedorDica,
            TransactionRunner transactionRunner) {
        this.jogadorRepository = Objects.requireNonNull(jogadorRepository);
        this.provedorDica = Objects.requireNonNull(provedorDica);
        this.transactionRunner = Objects.requireNonNull(transactionRunner);
    }

    public ResultadoVida descontarVida(String email) {
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            ProgressoJogador progresso = obterProgressoObrigatorio(jogador);

            progresso.consumirVida();
            boolean derrotado = progresso.getVidasRestantes() != null && progresso.getVidasRestantes() <= 0;

            jogadorRepository.salvar(jogador);
            return new ResultadoVida(progresso.getVidasRestantes(), derrotado);
        });
    }

    public Dica liberarDica(String email, CategoriaErro categoriaErro) {
        Objects.requireNonNull(categoriaErro, "Categoria de erro é obrigatória.");
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            ProgressoJogador progresso = obterProgressoObrigatorio(jogador);

            if (!progresso.temDicaDisponivel()) {
                throw new IllegalStateException("Limite de 3 dicas por ciclo atingido.");
            }

            progresso.consumirDica();
            jogadorRepository.salvar(jogador);
            return provedorDica.obterDica(progresso.getAndarAtual(), categoriaErro);
        });
    }

    public ProgressoJogador restaurarRecursos(String email) {
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            ProgressoJogador progresso = obterProgressoObrigatorio(jogador);

            progresso.restaurarRecursos();
            jogadorRepository.salvar(jogador);
            return progresso;
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

    public record ResultadoVida(Integer vidasRestantes, boolean semVidas) {
    }

    public interface JogadorRepository {
        Optional<Jogador> buscarPorEmail(String email);
        Jogador salvar(Jogador jogador);
    }

    public interface ProvedorDica {
        Dica obterDica(Integer numeroAndar, CategoriaErro categoriaErro);
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