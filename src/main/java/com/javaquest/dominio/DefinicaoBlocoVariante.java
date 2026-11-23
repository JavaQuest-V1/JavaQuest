package com.javaquest.dominio;

// definicao interna de cada bloco (fica soh no back pra nn vazar gabarito pro cliente)
public record DefinicaoBlocoVariante(
        String textoCodigoComMarcadores,
        boolean blocoEhRespostaCorreta,
        CategoriaErro categoriaErroSeEscolhidoErrado) {

    public static DefinicaoBlocoVariante criarBlocoCorreto(String textoCodigoComMarcadores) {
        return new DefinicaoBlocoVariante(textoCodigoComMarcadores, true, null);
    }

    public static DefinicaoBlocoVariante criarBlocoDistrator(
            String textoCodigoComMarcadores,
            CategoriaErro categoriaErroSeEscolhidoErrado) {
        return new DefinicaoBlocoVariante(textoCodigoComMarcadores, false, categoriaErroSeEscolhidoErrado);
    }
}
