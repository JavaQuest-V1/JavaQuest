package com.javaquest.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

public class MetricasService {

    private final MetricasRepository metricasRepository;
    private final TransactionRunner transactionRunner;

    public MetricasService(MetricasRepository metricasRepository, TransactionRunner transactionRunner) {
        this.metricasRepository = Objects.requireNonNull(metricasRepository);
        this.transactionRunner = Objects.requireNonNull(transactionRunner);
    }

    public RegistroOfensiva registrarDiaAtivo(String email, Instant dataReferencia) {
        String emailLimpo = validarEmail(email);
        Instant referencia = dataReferencia != null ? dataReferencia : Instant.now();

        return transactionRunner.runInTransaction(() -> {
            RegistroOfensiva atual = metricasRepository.buscarOfensiva(emailLimpo)
                    .orElse(new RegistroOfensiva(0, null));

            int novaContagem;
            if (atual.ultimoDiaAtivo() == null) {
                novaContagem = 1;
            } else {
                long diasDecorridos = Duration.between(atual.ultimoDiaAtivo(), referencia).toDays();
                if (diasDecorridos == 0) {
                    novaContagem = Math.max(1, atual.diasConsecutivos());
                } else if (diasDecorridos == 1) {
                    novaContagem = atual.diasConsecutivos() + 1;
                } else {
                    novaContagem = 1;
                }
            }

            RegistroOfensiva salvo = new RegistroOfensiva(novaContagem, referencia);
            return metricasRepository.salvarOfensiva(emailLimpo, salvo);
        });
    }

    public RegistroTempoSessao registrarTempoSessao(String email, long segundosSessao, long segundosNoAndarAtual) {
        String emailLimpo = validarEmail(email);
        if (segundosSessao < 0 || segundosNoAndarAtual < 0) {
            throw new IllegalArgumentException("Tempo de sessão e tempo no andar não podem ser negativos.");
        }

        return transactionRunner.runInTransaction(() -> {
            RegistroTempoSessao atual = metricasRepository.buscarTempo(emailLimpo)
                    .orElse(new RegistroTempoSessao(0L, 0L));

            RegistroTempoSessao atualizado = new RegistroTempoSessao(
                    atual.tempoTotalSessaoSegundos() + segundosSessao,
                    segundosNoAndarAtual);
            return metricasRepository.salvarTempo(emailLimpo, atualizado);
        });
    }

    public RegistroDesempenhoCiclo registrarConclusaoCiclo(
            String email, int andarInicial, int andarFinal, int vidasGastas, int dicasUsadas) {
        String emailLimpo = validarEmail(email);
        if (andarInicial <= 0 || andarFinal < andarInicial) {
            throw new IllegalArgumentException("Intervalo de ciclo inválido.");
        }
        if (vidasGastas < 0 || dicasUsadas < 0) {
            throw new IllegalArgumentException("Vidas gastas e dicas usadas não podem ser negativas.");
        }

        return transactionRunner.runInTransaction(() -> {
            RegistroDesempenhoCiclo registro = new RegistroDesempenhoCiclo(
                    andarInicial, andarFinal, vidasGastas, dicasUsadas, Instant.now());
            return metricasRepository.salvarHistoricoCiclo(emailLimpo, registro);
        });
    }

    private String validarEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail do jogador é obrigatório.");
        }
        return email.trim();
    }

    public record RegistroOfensiva(int diasConsecutivos, Instant ultimoDiaAtivo) {
    }

    public record RegistroTempoSessao(long tempoTotalSessaoSegundos, long tempoAndarAtualSegundos) {
    }

    public record RegistroDesempenhoCiclo(
            int andarInicial,
            int andarFinal,
            int vidasGastas,
            int dicasUsadas,
            Instant concluidoEm) {
    }

    public interface MetricasRepository {
        Optional<RegistroOfensiva> buscarOfensiva(String email);
        RegistroOfensiva salvarOfensiva(String email, RegistroOfensiva ofensiva);
        Optional<RegistroTempoSessao> buscarTempo(String email);
        RegistroTempoSessao salvarTempo(String email, RegistroTempoSessao tempo);
        RegistroDesempenhoCiclo salvarHistoricoCiclo(String email, RegistroDesempenhoCiclo historico);
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