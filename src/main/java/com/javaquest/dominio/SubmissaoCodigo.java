package com.javaquest.dominio;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// guarda o resultado da montagem dos blocos pro historico e pro combate
public class SubmissaoCodigo {
    private UUID identificadorSubmissao;
    private UUID identificadorTentativaAndar;
    private Long identificadorDesafioNoBanco;
    private Map<String, String> blocosEscolhidosPorLacuna = new LinkedHashMap<>();
    private String codigoJava;
    private boolean sintaxeValida;
    private boolean objetivoAtingido;
    private boolean ehCorreta;
    private ResultadoExecucaoSubmissao resultadoExecucao;
    private CategoriaErro categoriaErroDetectada;
    private String versaoValidador;
    private long tempoExecucaoEmMilissegundos;
    private List<AcaoHeroi> acoes = new ArrayList<>();

    public SubmissaoCodigo() {
    }

    public SubmissaoCodigo(String codigoJava) {
        this.codigoJava = codigoJava;
    }

    public List<AcaoHeroi> converterEmAcoes() {
        return Collections.unmodifiableList(acoes);
    }

    public UUID getIdentificadorSubmissao() {
        return identificadorSubmissao;
    }

    public void setIdentificadorSubmissao(UUID identificadorSubmissao) {
        this.identificadorSubmissao = identificadorSubmissao;
    }

    public UUID getIdentificadorTentativaAndar() {
        return identificadorTentativaAndar;
    }

    public void setIdentificadorTentativaAndar(UUID identificadorTentativaAndar) {
        this.identificadorTentativaAndar = identificadorTentativaAndar;
    }

    public Long getIdentificadorDesafioNoBanco() {
        return identificadorDesafioNoBanco;
    }

    public void setIdentificadorDesafioNoBanco(Long identificadorDesafioNoBanco) {
        this.identificadorDesafioNoBanco = identificadorDesafioNoBanco;
    }

    public Map<String, String> getBlocosEscolhidosPorLacuna() {
        return Collections.unmodifiableMap(blocosEscolhidosPorLacuna);
    }

    public void setBlocosEscolhidosPorLacuna(Map<String, String> blocosEscolhidosPorLacuna) {
        this.blocosEscolhidosPorLacuna = blocosEscolhidosPorLacuna != null
                ? new LinkedHashMap<>(blocosEscolhidosPorLacuna)
                : new LinkedHashMap<>();
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

    public ResultadoExecucaoSubmissao getResultadoExecucao() {
        return resultadoExecucao;
    }

    public void setResultadoExecucao(ResultadoExecucaoSubmissao resultadoExecucao) {
        this.resultadoExecucao = resultadoExecucao;
    }

    public CategoriaErro getCategoriaErroDetectada() {
        return categoriaErroDetectada;
    }

    public void setCategoriaErroDetectada(CategoriaErro categoriaErroDetectada) {
        this.categoriaErroDetectada = categoriaErroDetectada;
    }

    public String getVersaoValidador() {
        return versaoValidador;
    }

    public void setVersaoValidador(String versaoValidador) {
        this.versaoValidador = versaoValidador;
    }

    public long getTempoExecucaoEmMilissegundos() {
        return tempoExecucaoEmMilissegundos;
    }

    public void setTempoExecucaoEmMilissegundos(long tempoExecucaoEmMilissegundos) {
        this.tempoExecucaoEmMilissegundos = tempoExecucaoEmMilissegundos;
    }

    public List<AcaoHeroi> getAcoes() {
        return acoes;
    }

    public void setAcoes(List<AcaoHeroi> acoes) {
        this.acoes = acoes != null ? new ArrayList<>(acoes) : new ArrayList<>();
    }
}
