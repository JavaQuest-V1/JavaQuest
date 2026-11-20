package com.javaquest.dominio;

public class AcaoHeroi {
    private TipoAcaoHeroi tipo;

    public AcaoHeroi() {
    }

    public AcaoHeroi(TipoAcaoHeroi tipo) {
        this.tipo = tipo;
    }

    public TipoAcaoHeroi getTipo() {
        return tipo;
    }

    public void setTipo(TipoAcaoHeroi tipo) {
        this.tipo = tipo;
    }
}
}