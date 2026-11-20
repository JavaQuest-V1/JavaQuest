package com.javaquest.dominio;

import java.util.Date;

public class SessaoAutenticada {
    private String tokenJwt;
    private Date expiracao;
    private boolean estaValida;

    public SessaoAutenticada() {
    }

    public SessaoAutenticada(String tokenJwt, Date expiracao, boolean estaValida) {
        this.tokenJwt = tokenJwt;
        this.expiracao = expiracao;
        this.estaValida = estaValida;
    }

    public void invalidar() {
        this.estaValida = false;
    }

    public String getTokenJwt() {
        return tokenJwt;
    }

    public void setTokenJwt(String tokenJwt) {
        this.tokenJwt = tokenJwt;
    }

    public Date getExpiracao() {
        return expiracao;
    }

    public void setExpiracao(Date expiracao) {
        this.expiracao = expiracao;
    }

    public boolean isEstaValida() {
        return estaValida;
    }

    public void setEstaValida(boolean estaValida) {
        this.estaValida = estaValida;
    }
}