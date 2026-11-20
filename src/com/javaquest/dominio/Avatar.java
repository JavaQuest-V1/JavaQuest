package com.javaquest.dominio;

import java.util.Objects;

public class Avatar {
    private String modelo3D;

    public Avatar() {
    }

    public Avatar(String modelo3D) {
        this.modelo3D = modelo3D;
    }

    public String getModelo3D() {
        return modelo3D;
    }

    public void setModelo3D(String modelo3D) {
        this.modelo3D = modelo3D;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Avatar avatar)) {
            return false;
        }
        return Objects.equals(modelo3D, avatar.modelo3D);
    }

    @Override
    public int hashCode() {
        return Objects.hash(modelo3D);
    }
}