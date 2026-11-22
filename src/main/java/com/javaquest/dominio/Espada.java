package com.javaquest.dominio;

public class Espada extends Armamento {

    public Espada() {
        super("FISICO", Alcance.CURTO, "espada_3d.glb", "ataque_espada");
    }

    public Espada(String modelo3D, String animacaoAtaque) {
        super("FISICO", Alcance.CURTO, modelo3D, animacaoAtaque);
    }

    @Override
    public void atacar(Inimigo alvo) {
        if (alvo != null) {
            // Execução de ataque corpo a corpo de curto alcance
        }
    }
}