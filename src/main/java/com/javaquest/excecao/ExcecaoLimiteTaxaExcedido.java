package com.javaquest.excecao;

// lancada qnd o jogador dispara requisicoes demais em submissao ou dica (RNF-14 -> HTTP 429)
public class ExcecaoLimiteTaxaExcedido extends RuntimeException {

    private final long segundosParaTentarNovamente;

    public ExcecaoLimiteTaxaExcedido(String mensagemErro, long segundosParaTentarNovamente) {
        super(mensagemErro);
        this.segundosParaTentarNovamente = Math.max(1L, segundosParaTentarNovamente);
    }

    public long getSegundosParaTentarNovamente() {
        return segundosParaTentarNovamente;
    }
}
