package com.javaquest.dominio;

public class Ciclo {
    private Integer andarInicial;
    private Integer andarFinal;
    private boolean desbloqueado;

    public Ciclo() {
    }

    public Ciclo(Integer andarInicial, Integer andarFinal, boolean desbloqueado) {
        this.andarInicial = andarInicial;
        this.andarFinal = andarFinal;
        this.desbloqueado = desbloqueado;
    }

    public boolean estaDesbloqueado() {
        return desbloqueado;
    }

    public void setDesbloqueado(boolean desbloqueado) {
        this.desbloqueado = desbloqueado;
    }

    public Integer getAndarInicial() {
        return andarInicial;
    }

    public void setAndarInicial(Integer andarInicial) {
        this.andarInicial = andarInicial;
    }

    public Integer getAndarFinal() {
        return andarFinal;
    }

    public void setAndarFinal(Integer andarFinal) {
        this.andarFinal = andarFinal;
    }
}