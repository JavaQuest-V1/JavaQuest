package com.javaquest.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

// payload pra abrir uma nova tentativa de ciclo (RF-08, RF-11, RF-12)
public record RequisicaoPreparacaoCiclo(
        @Min(value = 1, message = "Numero do ciclo precisa ser maior ou igual a 1.")
        int numeroCiclo,

        @NotBlank(message = "Armamento (ESPADA/SWORD ou CAJADO/STAFF) eh obrigatorio.")
        String tipoArmamento) {
}
