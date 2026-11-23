package com.javaquest.dto;

import com.javaquest.dominio.CanalAquisicao;
import com.javaquest.dominio.NivelExperiencia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// payload do wizard de onboarding (RF-02, RF-03, RF-04 e RF-07)
public record RequisicaoOnboardingJogador(
        @NotBlank(message = "Apelido do heroi eh obrigatorio.")
        @Size(max = 30, message = "Apelido do heroi deve ter no maximo 30 caracteres.")
        String apelidoHeroi,

        @NotNull(message = "Nivel de experiencia eh obrigatorio.")
        NivelExperiencia nivelExperiencia,

        @NotNull(message = "Canal de aquisicao eh obrigatorio.")
        CanalAquisicao canalAquisicao,

        @NotBlank(message = "Armamento inicial (ESPADA/SWORD ou CAJADO/STAFF) eh obrigatorio.")
        String tipoArmamentoInicial) {
}
