package com.javaquest.dominio;

public class Desafio {
    private Long id;
    private Integer numeroAndar;
    private String objetivo;
    private String nivelDificuldade;

    public Desafio() {
    }

    public Desafio(Long id, Integer numeroAndar, String objetivo, String nivelDificuldade) {
        this.id = id;
        this.numeroAndar = numeroAndar;
        this.objetivo = objetivo;
        this.nivelDificuldade = nivelDificuldade;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getNumeroAndar() {
        return numeroAndar;
    }

    public void setNumeroAndar(Integer numeroAndar) {
        this.numeroAndar = numeroAndar;
    }

    public String getObjetivo() {
        return objetivo;
    }

    public void setObjetivo(String objetivo) {
        this.objetivo = objetivo;
    }

    public String getNivelDificuldade() {
        return nivelDificuldade;
    }

    public void setNivelDificuldade(String nivelDificuldade) {
        this.nivelDificuldade = nivelDificuldade;
    }
}