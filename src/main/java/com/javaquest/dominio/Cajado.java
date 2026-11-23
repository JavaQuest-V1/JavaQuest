package com.javaquest.dominio;

public class Cajado extends Armamento {

    public Cajado() {
        super("ELEMENTAL_ARCANO", Alcance.LONGO, "cajado_3d.glb", "ataque_cajado");
    }

    public Cajado(String modelo3D, String animacaoAtaque) {
        super("ELEMENTAL_ARCANO", Alcance.LONGO, modelo3D, animacaoAtaque);
    }

    @Override
    public void atacar(Inimigo alvo) {
        if (alvo != null) {
            // Execução de ataque mágico de longa distância
        }
    }
}