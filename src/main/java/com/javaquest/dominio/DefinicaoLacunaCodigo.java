package com.javaquest.dominio;

import java.util.List;

// representa cada espaco {{LACUNA_X}} q o jogador precisa preencher arrastando um bloco
public record DefinicaoLacunaCodigo(
        String identificadorLacuna,
        CategoriaErro categoriaErroPadraoDaLacuna,
        List<String> respostasValidasComMarcadores) {
}
