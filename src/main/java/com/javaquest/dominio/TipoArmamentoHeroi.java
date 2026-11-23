package com.javaquest.dominio;

// traduz os nomes em portugues das armas pro id exato da tabela javaquest.weapons (SWORD / STAFF)
public enum TipoArmamentoHeroi {
    ESPADA("SWORD"),
    CAJADO("STAFF");

    private final String codigoArmamentoBanco;

    TipoArmamentoHeroi(String codigoArmamentoBanco) {
        this.codigoArmamentoBanco = codigoArmamentoBanco;
    }

    public String getCodigoArmamentoBanco() {
        return codigoArmamentoBanco;
    }

    // aceita tanto ESPADA/CAJADO qnt SWORD/STAFF pra facilitar integracao com o front e banco
    public static TipoArmamentoHeroi converterDeTexto(String textoInformado) {
        if (textoInformado == null || textoInformado.isBlank()) {
            throw new IllegalArgumentException("Tipo de armamento eh obrigatorio.");
        }
        String textoNormalizado = textoInformado.trim().toUpperCase();
        return switch (textoNormalizado) {
            case "ESPADA", "SWORD" -> ESPADA;
            case "CAJADO", "STAFF" -> CAJADO;
            default -> throw new IllegalArgumentException("Armamento invalido: " + textoInformado);
        };
    }
}
