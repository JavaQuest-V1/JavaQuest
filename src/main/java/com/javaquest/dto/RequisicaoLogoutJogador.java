package com.javaquest.dto;

import java.util.UUID;

// payload opcional pro logout fechar a sessao de estudo ativa do jogador
public record RequisicaoLogoutJogador(
        UUID identificadorSessaoEstudo) {
}
