package com.javaquest.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

// payload com os blocos q o jogador arrastou pra cada lacuna do desafio (ex: LACUNA_1 -> BLOCO_3)
public record RequisicaoSubmissaoBlocos(
        @NotEmpty(message = "Informe ao menos uma lacuna preenchida com bloco.")
        Map<String, String> blocosEscolhidosPorLacuna) {
}
