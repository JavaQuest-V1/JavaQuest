package com.javaquest.dominio;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class SubmissaoCodigo {
    private String codigoJava;
    private boolean sintaxeValida;
    private boolean objetivoAtingido;
    private boolean ehCorreta;
    private List<AcaoHeroi> acoes = new ArrayList<>();

    public SubmissaoCodigo() {
    }

    public SubmissaoCodigo(String codigoJava) {
        this.codigoJava = codigoJava;
    }

    public List<AcaoHeroi> converterEmAcoes() {
        return Collections.unmodifiableList(acoes);
    }

    public String getCodigoJava() {
        return codigoJava;
    }

    public void setCodigoJava(String codigoJava) {
        this.codigoJava = codigoJava;
    }

    public boolean isSintaxeValida() {
        return sintaxeValida;
    }

    public void setSintaxeValida(boolean sintaxeValida) {
        this.sintaxeValida = sintaxeValida;
    }

    public boolean isObjetivoAtingido() {
        return objetivoAtingido;
    }

    public void setObjetivoAtingido(boolean objetivoAtingido) {
        this.objetivoAtingido = objetivoAtingido;
    }

    public boolean isEhCorreta() {
        return ehCorreta;
    }

    public void setEhCorreta(boolean ehCorreta) {
        this.ehCorreta = ehCorreta;
    }

    public List<AcaoHeroi> getAcoes() {
        return acoes;
    }

    public void setAcoes(List<AcaoHeroi> acoes) {
        this.acoes = acoes != null ? acoes : new ArrayList<>();
    }
}