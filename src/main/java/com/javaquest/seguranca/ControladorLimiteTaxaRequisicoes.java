package com.javaquest.seguranca;

import com.javaquest.excecao.ExcecaoLimiteTaxaExcedido;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// rate limiter simples em janela deslizante de 60s pra barrar spam em submissao e dica (RNF-14)
@Component
public class ControladorLimiteTaxaRequisicoes {

    private static final long JANELA_LIMITE_SEGUNDOS = 60L;

    private final int maximoSubmissoesPorMinuto;
    private final int maximoDicasPorMinuto;
    private final ConcurrentHashMap<String, Deque<Instant>> historicoRequisicoesPorChave = new ConcurrentHashMap<>();

    public ControladorLimiteTaxaRequisicoes(
            @Value("${javaquest.limite-taxa.maximo-submissoes-por-minuto:30}") int maximoSubmissoesPorMinuto,
            @Value("${javaquest.limite-taxa.maximo-dicas-por-minuto:20}") int maximoDicasPorMinuto) {
        this.maximoSubmissoesPorMinuto = Math.max(1, maximoSubmissoesPorMinuto);
        this.maximoDicasPorMinuto = Math.max(1, maximoDicasPorMinuto);
    }

    public void validarLimiteSubmissaoCodigo(UUID identificadorUnicoJogador) {
        validarLimite(identificadorUnicoJogador, "SUBMISSAO", maximoSubmissoesPorMinuto);
    }

    public void validarLimiteSolicitacaoDica(UUID identificadorUnicoJogador) {
        validarLimite(identificadorUnicoJogador, "DICA", maximoDicasPorMinuto);
    }

    private void validarLimite(UUID identificadorUnicoJogador, String nomeOperacao, int limitePorMinuto) {
        String chaveBalde = identificadorUnicoJogador + ":" + nomeOperacao;
        Instant instanteAtual = Instant.now();
        Instant corteJanela = instanteAtual.minusSeconds(JANELA_LIMITE_SEGUNDOS);

        Deque<Instant> filaInstantes = historicoRequisicoesPorChave.computeIfAbsent(chaveBalde, k -> new ArrayDeque<>());
        synchronized (filaInstantes) {
            while (!filaInstantes.isEmpty() && filaInstantes.peekFirst().isBefore(corteJanela)) {
                filaInstantes.pollFirst();
            }

            if (filaInstantes.size() >= limitePorMinuto) {
                Instant maisAntigoNaJanela = filaInstantes.peekFirst();
                long segundosRestantes = Math.max(
                        1L,
                        JANELA_LIMITE_SEGUNDOS - (instanteAtual.getEpochSecond() - maisAntigoNaJanela.getEpochSecond()));
                throw new ExcecaoLimiteTaxaExcedido(
                        "Limite de requisicoes por minuto atingido para " + nomeOperacao.toLowerCase() + ". Tente novamente em breve.",
                        segundosRestantes);
            }

            filaInstantes.addLast(instanteAtual);
        }
    }
}
