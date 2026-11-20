package com.javaquest.dominio;

public class Inimigo {
    private String nome;

    public Inimigo() {
    }

    public Inimigo(String nome) {
        this.nome = nome;
    }

    public void contraatacar() {
        // Executa contra-ataque do inimigo
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }
}