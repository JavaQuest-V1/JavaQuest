package com.javaquest.dominio;

public class CheckpointDesbloqueado {
    private Integer numeroAndar;

    public CheckpointDesbloqueado() {
    }

    public CheckpointDesbloqueado(Integer numeroAndar) {
        this.numeroAndar = numeroAndar;
    }

    public Integer getNumeroAndar() {
        return numeroAndar;
    }

    public void setNumeroAndar(Integer numeroAndar) {
        this.numeroAndar = numeroAndar;
    }
}