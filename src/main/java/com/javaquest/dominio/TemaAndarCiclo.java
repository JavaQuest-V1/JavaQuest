package com.javaquest.dominio;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

// grade oficial dos 10 andares do ciclo 1 definidos pra apresentacao do trabalho
public enum TemaAndarCiclo {
    ANDAR_01_VARIAVEIS_E_TIPAGEM(1, 1, "Variáveis e Tipagem de dados", false),
    ANDAR_02_DADOS_PRIMITIVOS(2, 1, "Dados primitivos", false),
    ANDAR_03_DADOS_NAO_PRIMITIVOS(3, 1, "Dados Não primitivos", false),
    ANDAR_04_CONDICIONAIS(4, 1, "Condicionais", false),
    ANDAR_05_SCANNERS(5, 1, "Scanners", false),
    ANDAR_06_SWITCH_CASES_E_TRATAMENTO(6, 1, "Switch cases e tratamento de dados", false),
    ANDAR_07_USO_DE_TERNARIOS(7, 1, "Uso de Ternários para simplificar código", false),
    ANDAR_08_INTRODUCAO_A_ARRAYS(8, 1, "Introdução a arrays", false),
    ANDAR_09_LACO_FOR_E_WHILE(9, 1, "Laço For e while", false),
    ANDAR_10_BOSS_TODOS_OS_TEMAS(10, 1, "Boss desafio com todos os temas", true);

    private final int numeroAndarNaTorre;
    private final int numeroCicloDaJornada;
    private final String tituloTemaPedagogico;
    private final boolean andarEhDeChefe;

    TemaAndarCiclo(
            int numeroAndarNaTorre,
            int numeroCicloDaJornada,
            String tituloTemaPedagogico,
            boolean andarEhDeChefe) {
        this.numeroAndarNaTorre = numeroAndarNaTorre;
        this.numeroCicloDaJornada = numeroCicloDaJornada;
        this.tituloTemaPedagogico = tituloTemaPedagogico;
        this.andarEhDeChefe = andarEhDeChefe;
    }

    public int getNumeroAndarNaTorre() {
        return numeroAndarNaTorre;
    }

    public int getNumeroCicloDaJornada() {
        return numeroCicloDaJornada;
    }

    public String getTituloTemaPedagogico() {
        return tituloTemaPedagogico;
    }

    public boolean isAndarEhDeChefe() {
        return andarEhDeChefe;
    }

    public static Optional<TemaAndarCiclo> buscarTemaPorNumeroAndar(int numeroAndarInformado) {
        return Arrays.stream(values())
                .filter(temaAtual -> temaAtual.numeroAndarNaTorre == numeroAndarInformado)
                .findFirst();
    }

    public static List<TemaAndarCiclo> listarTemasDoCiclo(int numeroCicloInformado) {
        return Arrays.stream(values())
                .filter(temaAtual -> temaAtual.numeroCicloDaJornada == numeroCicloInformado)
                .toList();
    }
}
