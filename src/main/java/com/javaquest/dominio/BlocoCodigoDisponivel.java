package com.javaquest.dominio;

// bloco publico q vai pro front sem entregar se ele eh certo ou distrator
public record BlocoCodigoDisponivel(
        String codigoIdentificadorBloco,
        String textoCodigoBloco) {
}
