package com.javaquest.dominio;

// espelha os 3 resultados q a tabela javaquest.submissions aceita no banco
public enum ResultadoExecucaoSubmissao {
    CORRETA("CORRECT"),
    INCORRETA("INCORRECT"),
    ERRO_TECNICO("TECHNICAL_ERROR");

    private final String codigoPersistidoNoBanco;

    ResultadoExecucaoSubmissao(String codigoPersistidoNoBanco) {
        this.codigoPersistidoNoBanco = codigoPersistidoNoBanco;
    }

    public String getCodigoPersistidoNoBanco() {
        return codigoPersistidoNoBanco;
    }
}
