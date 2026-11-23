package com.javaquest.dominio;

import java.util.List;

// parametro q muda de valor a cada nova tentativa usando o attempt_id como semente
public record DefinicaoParametroAleatorio(
        String nomeMarcadorParametro,
        List<String> valoresPossiveisParaSorteio) {
}
