package com.javaquest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// payload pra alterar o apelido do perfil (RF-02 permite apelidos repetidos)
public record RequisicaoAtualizacaoApelido(
        @NotBlank(message = "Novo apelido do heroi eh obrigatorio.")
        @Size(max = 30, message = "Apelido do heroi deve ter no maximo 30 caracteres.")
        String novoApelidoHeroi) {
}
