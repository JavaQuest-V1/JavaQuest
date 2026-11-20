package com.javaquest.service;

import com.javaquest.dominio.AcaoHeroi;
import com.javaquest.dominio.Desafio;
import com.javaquest.dominio.SubmissaoCodigo;
import com.javaquest.dominio.TipoAcaoHeroi;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

public class ValidacaoJavaService {

    public static final long LATENCIA_MAXIMA_MS = 250L;

    private final AvaliadorCodigoSandbox avaliadorSandbox;

    public ValidacaoJavaService(AvaliadorCodigoSandbox avaliadorSandbox) {
        this.avaliadorSandbox = Objects.requireNonNull(avaliadorSandbox);
    }

    public SubmissaoCodigo validarSubmissao(Desafio desafio, String codigoJava) {
        Objects.requireNonNull(desafio, "Desafio é obrigatório para validação.");
        Instant inicio = Instant.now();

        String codigoSanitizado = higienizarEntrada(codigoJava);
        SubmissaoCodigo submissao = new SubmissaoCodigo(codigoSanitizado);

        boolean sintaxeValida = validarSintaxe(codigoSanitizado);
        submissao.setSintaxeValida(sintaxeValida);

        boolean objetivoAtingido = false;
        if (sintaxeValida) {
            objetivoAtingido = validarObjetivo(desafio, codigoSanitizado);
            submissao.setAcoes(extrairAcoes(codigoSanitizado));
        }

        submissao.setObjetivoAtingido(objetivoAtingido);
        submissao.setEhCorreta(sintaxeValida && objetivoAtingido);

        long decorridoMs = Duration.between(inicio, Instant.now()).toMillis();
        if (decorridoMs > LATENCIA_MAXIMA_MS) {
            throw new IllegalStateException(
                    "Validação excedeu o limite de latência de " + LATENCIA_MAXIMA_MS + " ms.");
        }

        return submissao;
    }

    public boolean validarSintaxe(String codigoJava) {
        String codigo = higienizarEntrada(codigoJava);
        if (codigo.isEmpty()) {
            return false;
        }
        int chavesBalanceadas = contarBalanceamento(codigo, '{', '}');
        int parentesesBalanceados = contarBalanceamento(codigo, '(', ')');
        int colchetesBalanceados = contarBalanceamento(codigo, '[', ']');
        if (chavesBalanceadas != 0 || parentesesBalanceados != 0 || colchetesBalanceados != 0) {
            return false;
        }
        return avaliadorSandbox.sintaxeValidaEmSandbox(codigo);
    }

    public boolean validarObjetivo(Desafio desafio, String codigoJava) {
        Objects.requireNonNull(desafio);
        String codigo = higienizarEntrada(codigoJava);
        if (codigo.isEmpty()) {
            return false;
        }
        return avaliadorSandbox.objetivoAtingidoEmSandbox(desafio, codigo);
    }

    private String higienizarEntrada(String codigoJava) {
        if (codigoJava == null) {
            return "";
        }
        return codigoJava.replace("\u0000", "").trim();
    }

    private int contarBalanceamento(String texto, char abre, char fecha) {
        int saldo = 0;
        for (int i = 0; i < texto.length(); i++) {
            char c = texto.charAt(i);
            if (c == abre) {
                saldo++;
            } else if (c == fecha) {
                saldo--;
                if (saldo < 0) {
                    return saldo;
                }
            }
        }
        return saldo;
    }

    private List<AcaoHeroi> extrairAcoes(String codigo) {
        List<AcaoHeroi> acoes = new ArrayList<>();
        String minusculo = codigo.toLowerCase(Locale.ROOT);
        if (minusculo.contains("mover") || minusculo.contains("andar") || minusculo.contains("avancar")) {
            acoes.add(new AcaoHeroi(TipoAcaoHeroi.MOVER));
        }
        if (minusculo.contains("interagir") || minusculo.contains("pegar") || minusculo.contains("abrir")) {
            acoes.add(new AcaoHeroi(TipoAcaoHeroi.INTERAGIR));
        }
        if (minusculo.contains("atacar") || minusculo.contains("golpear") || minusculo.contains("disparar")) {
            acoes.add(new AcaoHeroi(TipoAcaoHeroi.ATACAR));
        }
        return acoes;
    }

    public interface AvaliadorCodigoSandbox {
        boolean sintaxeValidaEmSandbox(String codigoHigienizado);
        boolean objetivoAtingidoEmSandbox(Desafio desafio, String codigoHigienizado);
    }
}