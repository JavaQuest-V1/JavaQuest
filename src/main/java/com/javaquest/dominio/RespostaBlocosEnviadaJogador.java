package com.javaquest.dominio;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

// resposta q o jogador manda ao arrastar os blocos pras lacunas (substitui texto livre)
public class RespostaBlocosEnviadaJogador {

    // mapa no formato identificadorLacuna (ex: LACUNA_1) -> codigoIdentificadorBloco (ex: BLOCO_3)
    private final Map<String, String> blocosEscolhidosPorLacuna;

    public RespostaBlocosEnviadaJogador(Map<String, String> blocosEscolhidosPorLacuna) {
        if (blocosEscolhidosPorLacuna == null) {
            this.blocosEscolhidosPorLacuna = Collections.emptyMap();
        } else {
            this.blocosEscolhidosPorLacuna = Collections.unmodifiableMap(new LinkedHashMap<>(blocosEscolhidosPorLacuna));
        }
    }

    public Map<String, String> getBlocosEscolhidosPorLacuna() {
        return blocosEscolhidosPorLacuna;
    }
}
