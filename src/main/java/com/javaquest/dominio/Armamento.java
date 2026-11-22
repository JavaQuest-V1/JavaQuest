package com.javaquest.dominio;

public abstract class Armamento {
    private String tipoDano;
    private Alcance alcance;
    private String modelo3D;
    private String animacaoAtaque;

    protected Armamento() {
    }

    protected Armamento(String tipoDano, Alcance alcance, String modelo3D, String animacaoAtaque) {
        this.tipoDano = tipoDano;
        this.alcance = alcance;
        this.modelo3D = modelo3D;
        this.animacaoAtaque = animacaoAtaque;
    }

    public abstract void atacar(Inimigo alvo);

    public String getTipoDano() {
        return tipoDano;
    }

    public void setTipoDano(String tipoDano) {
        this.tipoDano = tipoDano;
    }

    public Alcance getAlcance() {
        return alcance;
    }

    public void setAlcance(Alcance alcance) {
        this.alcance = alcance;
    }

    public String getModelo3D() {
        return modelo3D;
    }

    public void setModelo3D(String modelo3D) {
        this.modelo3D = modelo3D;
    }

    public String getAnimacaoAtaque() {
        return animacaoAtaque;
    }

    public void setAnimacaoAtaque(String animacaoAtaque) {
        this.animacaoAtaque = animacaoAtaque;
    }
}