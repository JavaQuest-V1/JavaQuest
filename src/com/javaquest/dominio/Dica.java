package com.javaquest.dominio;

public class Dica {
    private String texto;
    private CategoriaErro categoriaErro;

    public Dica() {
    }

    public Dica(String texto, CategoriaErro categoriaErro) {
        this.texto = texto;
        this.categoriaErro = categoriaErro;
    }

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public CategoriaErro getCategoriaErro() {
        return categoriaErro;
    }

    public void setCategoriaErro(CategoriaErro categoriaErro) {
        this.categoriaErro = categoriaErro;
    }
}