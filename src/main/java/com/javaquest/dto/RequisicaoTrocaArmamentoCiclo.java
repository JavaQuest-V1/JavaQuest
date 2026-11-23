package com.javaquest.dto;

import jakarta.validation.constraints.NotBlank;

// payload pra trocar a arma antes de iniciar o primeiro andar da run (RF-08)
public record RequisicaoTrocaArmamentoCiclo(
        @NotBlank(message = "Novo armamento (ESPADA/SWORD ou CAJADO/STAFF) eh obrigatorio.")
        String novoTipoArmamento) {
}
