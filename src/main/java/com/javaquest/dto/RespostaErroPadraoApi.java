package com.javaquest.dto;

import java.time.OffsetDateTime;
import java.util.List;

// formato padronizado de erro HTTP q todos os controllers devolvem pro front
public record RespostaErroPadraoApi(
        int codigoStatusHttp,
        String codigoErro,
        String mensagemErro,
        String caminhoRequisicao,
        OffsetDateTime instanteOcorrencia,
        List<String> detalhesValidacao) {
}
