package com.javaquest.dominio;

public class Jogador {
    private String email;
    private String nome;
    private String fotoPerfil;
    private String apelido;
    private NivelExperiencia nivelExperiencia;
    private CanalAquisicao canalAquisicao;
    private Avatar avatar;
    private Armamento armamentoAtual;
    private ProgressoJogador progresso;

    public Jogador() {
    }

    public String sugerirApelido() {
        if (this.nome == null || this.nome.isBlank()) {
            return "";
        }
        return this.nome.trim().split("\\s+")[0];
    }

    public void definirApelido(String apelido) {
        this.apelido = apelido;
    }

    public void definirNivelExperiencia(NivelExperiencia nivel) {
        this.nivelExperiencia = nivel;
    }

    public void definirCanalAquisicao(CanalAquisicao canal) {
        this.canalAquisicao = canal;
    }

    public void escolherArmamento(Armamento arma) {
        this.armamentoAtual = arma;
    }

    public void trocarArmamento(Armamento arma) {
        if (this.progresso != null && this.progresso.podeTrocarArmamento()) {
            this.armamentoAtual = arma;
        }
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getFotoPerfil() {
        return fotoPerfil;
    }

    public void setFotoPerfil(String fotoPerfil) {
        this.fotoPerfil = fotoPerfil;
    }

    public String getApelido() {
        return apelido;
    }

    public void setApelido(String apelido) {
        this.apelido = apelido;
    }

    public NivelExperiencia getNivelExperiencia() {
        return nivelExperiencia;
    }

    public void setNivelExperiencia(NivelExperiencia nivelExperiencia) {
        this.nivelExperiencia = nivelExperiencia;
    }

    public CanalAquisicao getCanalAquisicao() {
        return canalAquisicao;
    }

    public void setCanalAquisicao(CanalAquisicao canalAquisicao) {
        this.canalAquisicao = canalAquisicao;
    }

    public Avatar getAvatar() {
        return avatar;
    }

    public void setAvatar(Avatar avatar) {
        this.avatar = avatar;
    }

    public Armamento getArmamentoAtual() {
        return armamentoAtual;
    }

    public void setArmamentoAtual(Armamento armamentoAtual) {
        this.armamentoAtual = armamentoAtual;
    }

    public ProgressoJogador getProgresso() {
        return progresso;
    }

    public void setProgresso(ProgressoJogador progresso) {
        this.progresso = progresso;
    }
}