package com.javaquest.dominio;

public class ProgressoJogador {
    public static final int MAX_VIDAS = 3;
    public static final int MAX_DICAS = 3;

    private Integer andarAtual;
    private Integer checkpointAtual;
    private Integer vidasRestantes;
    private Integer dicasRestantes;
    private boolean andarEmAndamento;
    private Desafio desafioAtual;
    private Desafio desafioAnterior;

    public ProgressoJogador() {
        this.andarAtual = 1;
        this.checkpointAtual = 1;
        this.vidasRestantes = MAX_VIDAS;
        this.dicasRestantes = MAX_DICAS;
        this.andarEmAndamento = false;
    }

    public void consumirVida() {
        if (this.vidasRestantes != null && this.vidasRestantes > 0) {
            this.vidasRestantes -= 1;
        }
    }

    public void consumirDica() {
        if (this.dicasRestantes != null && this.dicasRestantes > 0) {
            this.dicasRestantes -= 1;
        }
    }

    public boolean temDicaDisponivel() {
        return this.dicasRestantes != null && this.dicasRestantes > 0;
    }

    public void avancarAndar() {
        if (this.andarAtual == null) {
            this.andarAtual = 1;
        }
        this.andarAtual += 1;
        this.andarEmAndamento = false;
    }

    public void reiniciarNoUltimoCheckpoint() {
        this.andarAtual = this.checkpointAtual != null ? this.checkpointAtual : 1;
        this.vidasRestantes = MAX_VIDAS;
        this.dicasRestantes = MAX_DICAS;
        this.andarEmAndamento = false;
    }

    public void restaurarRecursos() {
        this.vidasRestantes = MAX_VIDAS;
        this.dicasRestantes = MAX_DICAS;
    }

    public boolean podeTrocarArmamento() {
        return !this.andarEmAndamento;
    }

    public Integer getAndarAtual() {
        return andarAtual;
    }

    public void setAndarAtual(Integer andarAtual) {
        this.andarAtual = andarAtual;
    }

    public Integer getCheckpointAtual() {
        return checkpointAtual;
    }

    public void setCheckpointAtual(Integer checkpointAtual) {
        this.checkpointAtual = checkpointAtual;
    }

    public Integer getVidasRestantes() {
        return vidasRestantes;
    }

    public void setVidasRestantes(Integer vidasRestantes) {
        this.vidasRestantes = vidasRestantes;
    }

    public Integer getDicasRestantes() {
        return dicasRestantes;
    }

    public void setDicasRestantes(Integer dicasRestantes) {
        this.dicasRestantes = dicasRestantes;
    }

    public boolean isAndarEmAndamento() {
        return andarEmAndamento;
    }

    public void setAndarEmAndamento(boolean andarEmAndamento) {
        this.andarEmAndamento = andarEmAndamento;
    }

    public Desafio getDesafioAtual() {
        return desafioAtual;
    }

    public void setDesafioAtual(Desafio desafioAtual) {
        this.desafioAtual = desafioAtual;
    }

    public Desafio getDesafioAnterior() {
        return desafioAnterior;
    }

    public void setDesafioAnterior(Desafio desafioAnterior) {
        this.desafioAnterior = desafioAnterior;
    }
}