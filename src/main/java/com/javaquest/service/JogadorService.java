package com.javaquest.service;

import com.javaquest.dominio.Armamento;
import com.javaquest.dominio.Cajado;
import com.javaquest.dominio.CanalAquisicao;
import com.javaquest.dominio.Espada;
import com.javaquest.dominio.Jogador;
import com.javaquest.dominio.NivelExperiencia;
import com.javaquest.dominio.ProgressoJogador;
import java.util.Objects;
import java.util.Optional;

public class JogadorService {

    private final JogadorRepository jogadorRepository;
    private final TransactionRunner transactionRunner;

    public JogadorService(JogadorRepository jogadorRepository, TransactionRunner transactionRunner) {
        this.jogadorRepository = Objects.requireNonNull(jogadorRepository);
        this.transactionRunner = Objects.requireNonNull(transactionRunner);
    }

    public Jogador salvarApelido(String email, String apelido) {
        if (apelido == null || apelido.isBlank()) {
            throw new IllegalArgumentException("Apelido não pode ser vazio.");
        }
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            jogador.definirApelido(apelido.trim());
            return jogadorRepository.salvar(jogador);
        });
    }

    public Jogador salvarNivelExperiencia(String email, NivelExperiencia nivelExperiencia) {
        Objects.requireNonNull(nivelExperiencia, "Nível de experiência é obrigatório.");
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            jogador.definirNivelExperiencia(nivelExperiencia);
            return jogadorRepository.salvar(jogador);
        });
    }

    public Jogador salvarCanalAquisicao(String email, CanalAquisicao canalAquisicao) {
        Objects.requireNonNull(canalAquisicao, "Canal de aquisição é obrigatório.");
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            jogador.definirCanalAquisicao(canalAquisicao);
            return jogadorRepository.salvar(jogador);
        });
    }

    public Jogador definirArmamento(String email, TipoArmamento tipoArmamento) {
        Objects.requireNonNull(tipoArmamento, "Tipo de armamento é obrigatório.");
        return transactionRunner.runInTransaction(() -> {
            Jogador jogador = buscarJogadorObrigatorio(email);
            Armamento novaArma = instanciarArmamento(tipoArmamento);

            if (jogador.getArmamentoAtual() == null) {
                jogador.escolherArmamento(novaArma);
            } else {
                ProgressoJogador progresso = jogador.getProgresso();
                if (progresso != null && !progresso.podeTrocarArmamento()) {
                    throw new IllegalStateException(
                            "A troca de arma só pode ser realizada fora de combate, antes de um novo ciclo.");
                }
                if (progresso != null && !ehInicioDeCiclo(progresso)) {
                    throw new IllegalStateException(
                            "A troca de arma só pode ser realizada antes de iniciar um novo ciclo a partir de um checkpoint desbloqueado.");
                }
                jogador.trocarArmamento(novaArma);
            }

            return jogadorRepository.salvar(jogador);
        });
    }

    private boolean ehInicioDeCiclo(ProgressoJogador progresso) {
        Integer andarAtual = progresso.getAndarAtual();
        return andarAtual != null && andarAtual > 1 && ((andarAtual - 1) % 10 == 0);
    }

    private Armamento instanciarArmamento(TipoArmamento tipoArmamento) {
        return switch (tipoArmamento) {
            case ESPADA -> new Espada();
            case CAJADO -> new Cajado();
        };
    }

    private Jogador buscarJogadorObrigatorio(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail do jogador é obrigatório.");
        }
        return jogadorRepository.buscarPorEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Jogador não encontrado: " + email));
    }

    public enum TipoArmamento {
        ESPADA,
        CAJADO
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