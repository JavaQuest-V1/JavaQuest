package com.javaquest.service;

import com.javaquest.dominio.CategoriaErro;
import com.javaquest.dominio.DefinicaoBlocoVariante;
import com.javaquest.dominio.DefinicaoLacunaCodigo;
import com.javaquest.dominio.DefinicaoParametroAleatorio;
import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import com.javaquest.dominio.TemaAndarCiclo;
import com.javaquest.dominio.TipoAcaoHeroi;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

// catalogo com 3 variantes em blocos pra cada um dos 10 andares oficiais da apresentacao
@Component
public class CatalogoDesafiosBlocosPadrao implements ProvedorCatalogoDesafiosBlocos {

    private static final List<TipoAcaoHeroi> ACOES_PADRAO_ESPADA = List.of(TipoAcaoHeroi.MOVER, TipoAcaoHeroi.ATACAR);
    private static final List<TipoAcaoHeroi> ACOES_PADRAO_CAJADO = List.of(TipoAcaoHeroi.ATACAR);

    private final Map<Integer, List<DefinicaoVarianteDesafioBlocos>> mapaVariantesPorAndar = new LinkedHashMap<>();
    private final Map<Long, DefinicaoVarianteDesafioBlocos> mapaVariantesPorIdentificador = new LinkedHashMap<>();
    private long proximoIdentificadorDesafio = 1L;

    public CatalogoDesafiosBlocosPadrao() {
        carregarAndar01VariaveisETipagem();
        carregarAndar02DadosPrimitivos();
        carregarAndar03DadosNaoPrimitivos();
        carregarAndar04Condicionais();
        carregarAndar05Scanners();
        carregarAndar06SwitchCasesETratamento();
        carregarAndar07UsoDeTernarios();
        carregarAndar08IntroducaoAArrays();
        carregarAndar09LacoForEWhile();
        carregarAndar10BossIntegrador();
    }

    @Override
    public List<DefinicaoVarianteDesafioBlocos> listarVariantesAtivasPorAndar(int numeroAndarNaTorre) {
        List<DefinicaoVarianteDesafioBlocos> variantes = mapaVariantesPorAndar.getOrDefault(
                numeroAndarNaTorre,
                Collections.emptyList());
        return variantes.stream()
                .filter(DefinicaoVarianteDesafioBlocos::varianteAtivaNoCatalogo)
                .toList();
    }

    @Override
    public Optional<DefinicaoVarianteDesafioBlocos> buscarVariantePorIdentificador(Long identificadorDesafioNoBanco) {
        return Optional.ofNullable(mapaVariantesPorIdentificador.get(identificadorDesafioNoBanco));
    }

    @Override
    public Optional<DefinicaoVarianteDesafioBlocos> buscarVariantePorAndarEChave(
            int numeroAndarNaTorre,
            String chaveVarianteNoAndar) {
        if (chaveVarianteNoAndar == null || chaveVarianteNoAndar.isBlank()) {
            return Optional.empty();
        }
        return listarVariantesAtivasPorAndar(numeroAndarNaTorre).stream()
                .filter(variante -> chaveVarianteNoAndar.equalsIgnoreCase(variante.chaveVarianteNoAndar()))
                .findFirst();
    }

    // andar 1: variaveis e tipagem estatica em java
    private void carregarAndar01VariaveisETipagem() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_01_VARIAVEIS_E_TIPAGEM, "v1",
                "Declare a variavel tipada de ataque com valor {{VALOR_ATAQUE}} e dispare o golpe do heroi.",
                "{{LACUNA_1}} ataqueHeroi = {{LACUNA_2}};\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("int")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.TIPO_DE_DADO, List.of("{{VALOR_ATAQUE}}")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar(ataqueHeroi)"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("int"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("{{VALOR_ATAQUE}}"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(ataqueHeroi)"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("String", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("\"{{VALOR_ATAQUE}}\"", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("VALOR_ATAQUE", List.of("10", "14", "18", "22"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_01_VARIAVEIS_E_TIPAGEM, "v2",
                "Inicialize corretamente a variavel de energia com {{VALOR_ENERGIA}} usando o operador de atribuicao.",
                "{{LACUNA_1}} energiaTurno {{LACUNA_2}} {{VALOR_ENERGIA}};\nheroi.{{LACUNA_3}}(energiaTurno);",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("int")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.SINTAXE, List.of("=")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("atacar"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("int"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("="),
                        DefinicaoBlocoVariante.criarBlocoCorreto("atacar"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("boolean", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("==", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("descansar", CategoriaErro.METODO)),
                List.of(new DefinicaoParametroAleatorio("VALOR_ENERGIA", List.of("8", "12", "16", "20"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_01_VARIAVEIS_E_TIPAGEM, "v3",
                "Escolha um nome de variavel valido em Java para guardar {{VALOR_PASSOS}} passos e atacar.",
                "int {{LACUNA_1}} = {{LACUNA_2}};\nheroi.mover(passosHeroi);\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.SINTAXE, List.of("passosHeroi")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.TIPO_DE_DADO, List.of("{{VALOR_PASSOS}}")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("passosHeroi"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("{{VALOR_PASSOS}}"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("1passosHeroi", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("true", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("VALOR_PASSOS", List.of("2", "3", "4", "5"))));
    }

    // andar 2: dados primitivos (int, double, boolean, char)
    private void carregarAndar02DadosPrimitivos() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_02_DADOS_PRIMITIVOS, "v1",
                "Use os tipos primitivos corretos para numero decimal {{TAXA_CRITICO}} e flag logica ativa.",
                "{{LACUNA_1}} multiplicadorCritico = {{TAXA_CRITICO}};\n{{LACUNA_2}} ataqueAtivo = true;\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("double")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.TIPO_DE_DADO, List.of("boolean")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar(multiplicadorCritico)"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("double"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("boolean"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(multiplicadorCritico)"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("int", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("String", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("TAXA_CRITICO", List.of("1.5", "2.5", "3.2"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_02_DADOS_PRIMITIVOS, "v2",
                "Guarde o caractere unico de rank '{{RANK_RUNA}}' usando o tipo primitivo char e ataque.",
                "{{LACUNA_1}} rankRuna = {{LACUNA_2}};\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("char")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.SINTAXE, List.of("'{{RANK_RUNA}}'")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("char"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("'{{RANK_RUNA}}'"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("String", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("\"{{RANK_RUNA}}\"", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.dormir()", CategoriaErro.METODO)),
                List.of(new DefinicaoParametroAleatorio("RANK_RUNA", List.of("S", "A", "B"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_02_DADOS_PRIMITIVOS, "v3",
                "Declare um inteiro longo {{XP_CHEFE}} com sufixo L e o booleano prontoParaBatalha.",
                "{{LACUNA_1}} experienciaAcumulada = {{XP_CHEFE}}L;\nboolean prontoParaBatalha = {{LACUNA_2}};\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("long")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.TIPO_DE_DADO, List.of("true")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("long"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("true"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("byte", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("\"true\"", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("XP_CHEFE", List.of("50000", "75000", "90000"))));
    }

    // andar 3: dados nao primitivos (String, metodos de objeto, Integer/wrappers)
    private void carregarAndar03DadosNaoPrimitivos() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_03_DADOS_NAO_PRIMITIVOS, "v1",
                "Declare a String com o grito de guerra \"{{GRITO_GUERRA}}\", converta para maiusculas e ataque.",
                "{{LACUNA_1}} gritoGuerra = \"{{GRITO_GUERRA}}\";\nString gritoForte = gritoGuerra.{{LACUNA_2}};\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("String")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.METODO, List.of("toUpperCase()")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("String"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("toUpperCase()"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("char", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("toUpperCase", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.recuar()", CategoriaErro.METODO)),
                List.of(new DefinicaoParametroAleatorio("GRITO_GUERRA", List.of("fogo", "trovao", "lamina"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_03_DADOS_NAO_PRIMITIVOS, "v2",
                "Compare duas Strings corretamente usando o metodo de objeto (nunca ==) para liberar o golpe.",
                "String senhaPortal = \"{{SENHA_RUNA}}\";\nif (senhaPortal.{{LACUNA_1}}(\"{{SENHA_RUNA}}\")) {\n    {{LACUNA_2}};\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.METODO, List.of("equals")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("equals"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("==", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("length", CategoriaErro.METODO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("SENHA_RUNA", List.of("JAVA", "QUEST", "TORRE"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_03_DADOS_NAO_PRIMITIVOS, "v3",
                "Converta o texto \"{{NUMERO_TEXTO}}\" para numero inteiro usando o wrapper Integer e ataque.",
                "String textoDano = \"{{NUMERO_TEXTO}}\";\nint danoConvertido = {{LACUNA_1}}.{{LACUNA_2}}(textoDano);\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("Integer")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.METODO, List.of("parseInt")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar(danoConvertido)"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("Integer"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("parseInt"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(danoConvertido)"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("int", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("toString", CategoriaErro.METODO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar()", CategoriaErro.METODO)),
                List.of(new DefinicaoParametroAleatorio("NUMERO_TEXTO", List.of("15", "25", "40"))));
    }

    // andar 4: condicionais (if, else if, else, operadores logicos)
    private void carregarAndar04Condicionais() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_04_CONDICIONAIS, "v1",
                "Ataque o monstro somente se a forca do heroi for maior ou igual a {{MINIMO_FORCA}}.",
                "{{LACUNA_1}} (forcaHeroi {{LACUNA_2}} {{MINIMO_FORCA}}) {\n    {{LACUNA_3}};\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.SINTAXE, List.of("if")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.LOGICA, List.of(">=")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("if"),
                        DefinicaoBlocoVariante.criarBlocoCorreto(">="),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("else", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("<", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("MINIMO_FORCA", List.of("10", "15", "20"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_04_CONDICIONAIS, "v2",
                "Se a mana for suficiente ({{CUSTO_MANA}}) ataque, senao recarregue usando else.",
                "if (manaHeroi >= {{CUSTO_MANA}}) {\n    {{LACUNA_1}};\n} {{LACUNA_2}} {\n    heroi.interagir();\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.METODO, List.of("heroi.atacar()")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.SINTAXE, List.of("else"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("else"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("then", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("while", CategoriaErro.LOGICA)),
                List.of(new DefinicaoParametroAleatorio("CUSTO_MANA", List.of("8", "12", "16"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_04_CONDICIONAIS, "v3",
                "Exija que o heroi esteja vivo E tenha energia maior que {{LIMITE_ENERGIA}} usando &&.",
                "if (heroiVivo {{LACUNA_1}} energia {{LACUNA_2}} {{LIMITE_ENERGIA}}) {\n    {{LACUNA_3}};\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.LOGICA, List.of("&&")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.LOGICA, List.of(">")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("&&"),
                        DefinicaoBlocoVariante.criarBlocoCorreto(">"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("||", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("<=", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("=", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("LIMITE_ENERGIA", List.of("5", "10", "15"))));
    }

    // andar 5: Scanners (leitura de entrada com java.util.Scanner)
    private void carregarAndar05Scanners() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_05_SCANNERS, "v1",
                "Instancie o Scanner lendo de System.in, leia um numero inteiro de dano e ataque.",
                "Scanner leitor = new {{LACUNA_1}}({{LACUNA_2}});\nint danoLido = leitor.{{LACUNA_3}};\nheroi.atacar(danoLido);",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("Scanner")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.METODO, List.of("System.in")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("nextInt()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("Scanner"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("System.in"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("nextInt()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("String", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("System.out", CategoriaErro.METODO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("nextLine()", CategoriaErro.TIPO_DE_DADO)),
                List.of());

        registrarVariante(
                TemaAndarCiclo.ANDAR_05_SCANNERS, "v2",
                "Leia o comando de texto digitado pelo jogador usando nextLine() e feche o Scanner.",
                "Scanner entrada = new Scanner(System.in);\nString comando = entrada.{{LACUNA_1}};\nentrada.{{LACUNA_2}};\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.METODO, List.of("nextLine()")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.METODO, List.of("close()")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("nextLine()"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("close()"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("nextInt()", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("close", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("System.exit(0)", CategoriaErro.LOGICA)),
                List.of());

        registrarVariante(
                TemaAndarCiclo.ANDAR_05_SCANNERS, "v3",
                "Leia um valor decimal (double) de multiplicador pelo Scanner para potencializar o golpe {{MULTIPLICADOR_BASE}}.",
                "Scanner teclado = new Scanner({{LACUNA_1}});\n{{LACUNA_2}} bonus = teclado.{{LACUNA_3}};\nheroi.atacar({{MULTIPLICADOR_BASE}} * bonus);",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.METODO, List.of("System.in")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.TIPO_DE_DADO, List.of("double")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("nextDouble()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("System.in"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("double"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("nextDouble()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("System.err", CategoriaErro.METODO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("int", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("nextBoolean()", CategoriaErro.TIPO_DE_DADO)),
                List.of(new DefinicaoParametroAleatorio("MULTIPLICADOR_BASE", List.of("10", "15", "20"))));
    }

    // andar 6: switch cases e tratamento de dados (default, break, trim/toUpperCase)
    private void carregarAndar06SwitchCasesETratamento() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_06_SWITCH_CASES_E_TRATAMENTO, "v1",
                "Normalize o comando removendo espacos e direcione o ataque no switch com break.",
                "String acaoLimpa = entrada.{{LACUNA_1}}.toUpperCase();\n{{LACUNA_2}} (acaoLimpa) {\n    case \"ATACAR\":\n        heroi.atacar();\n        {{LACUNA_3}};\n    default:\n        heroi.mover();\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.METODO, List.of("trim()")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.SINTAXE, List.of("switch")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.SINTAXE, List.of("break"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("trim()"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("switch"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("break"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("split()", CategoriaErro.METODO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("if", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("continue", CategoriaErro.LOGICA)),
                List.of());

        registrarVariante(
                TemaAndarCiclo.ANDAR_06_SWITCH_CASES_E_TRATAMENTO, "v2",
                "Complete o switch por nivel de poder {{NIVEL_ESCOLHIDO}} com case e bloco default para entradas invalidas.",
                "switch (nivelPoder) {\n    {{LACUNA_1}} {{NIVEL_ESCOLHIDO}}:\n        heroi.atacar();\n        {{LACUNA_2}};\n    {{LACUNA_3}}:\n        heroi.interagir();\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.SINTAXE, List.of("case")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.SINTAXE, List.of("break")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.SINTAXE, List.of("default"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("case"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("break"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("default"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("when", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("stop", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("else", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("NIVEL_ESCOLHIDO", List.of("1", "2", "3"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_06_SWITCH_CASES_E_TRATAMENTO, "v3",
                "Trate o texto de entrada evitando erro se vier em minusculas antes de comparar no switch.",
                "String comandoTratado = textoBruto.trim().{{LACUNA_1}};\nswitch (comandoTratado) {\n    case \"{{COMANDO_MAGICO}}\":\n        {{LACUNA_2}};\n        {{LACUNA_3}};\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.METODO, List.of("toLowerCase()")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.METODO, List.of("heroi.atacar()")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.SINTAXE, List.of("break"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("toLowerCase()"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("break"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("toUpperCase()", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("return", CategoriaErro.LOGICA)),
                List.of(new DefinicaoParametroAleatorio("COMANDO_MAGICO", List.of("golpe", "raio", "chama"))));
    }

    // andar 7: uso de ternarios para simplificar codigo (condicao ? valorSeVerdadeiro : valorSeFalso)
    private void carregarAndar07UsoDeTernarios() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_07_USO_DE_TERNARIOS, "v1",
                "Simplifique o calculo do dano usando operador ternario: se critico for verdadeiro use {{DANO_ALTO}}, senao {{DANO_NORMAL}}.",
                "int danoGolpe = critico {{LACUNA_1}} {{DANO_ALTO}} {{LACUNA_2}} {{DANO_NORMAL}};\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.SINTAXE, List.of("?")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.SINTAXE, List.of(":")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar(danoGolpe)"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("?"),
                        DefinicaoBlocoVariante.criarBlocoCorreto(":"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(danoGolpe)"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("&&", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator(";", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(
                        new DefinicaoParametroAleatorio("DANO_ALTO", List.of("30", "40", "50")),
                        new DefinicaoParametroAleatorio("DANO_NORMAL", List.of("10", "15", "20"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_07_USO_DE_TERNARIOS, "v2",
                "Defina o status de combate com ternario verificando se a vida eh maior que {{VIDA_MINIMA}}.",
                "{{LACUNA_1}} status = (vidaHeroi {{LACUNA_2}} {{VIDA_MINIMA}}) ? \"ATACAR\" {{LACUNA_3}} \"DEFENDER\";\nheroi.atacar();",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("String")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.LOGICA, List.of(">")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.SINTAXE, List.of(":"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("String"),
                        DefinicaoBlocoVariante.criarBlocoCorreto(">"),
                        DefinicaoBlocoVariante.criarBlocoCorreto(":"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("int", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("<=", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("?", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("VIDA_MINIMA", List.of("1", "2", "3"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_07_USO_DE_TERNARIOS, "v3",
                "Aplique o bonus {{BONUS_ARMA}} somente quando a energia for igual ou maior que 10 em uma unica linha.",
                "int poderFinal = (energia >= 10) {{LACUNA_1}} (base + {{BONUS_ARMA}}) : {{LACUNA_2}};\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.SINTAXE, List.of("?")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.LOGICA, List.of("base")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar(poderFinal)"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("?"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("base"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(poderFinal)"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("else", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("\"base\"", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("System.out.println(poderFinal)", CategoriaErro.METODO)),
                List.of(new DefinicaoParametroAleatorio("BONUS_ARMA", List.of("5", "8", "12"))));
    }

    // andar 8: introducao a arrays (declaracao, indice 0, length)
    private void carregarAndar08IntroducaoAArrays() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_08_INTRODUCAO_A_ARRAYS, "v1",
                "Crie um array de inteiros de danos e acesse o primeiro elemento (indice 0) para atacar.",
                "{{LACUNA_1}} danos = { {{DANO_1}}, {{DANO_2}}, {{DANO_3}} };\nint primeiroDano = danos[{{LACUNA_2}}];\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("int[]")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.LOGICA, List.of("0")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar(primeiroDano)"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("int[]"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("0"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(primeiroDano)"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("int", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("1", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar(danos)", CategoriaErro.TIPO_DE_DADO)),
                List.of(
                        new DefinicaoParametroAleatorio("DANO_1", List.of("10", "12", "15")),
                        new DefinicaoParametroAleatorio("DANO_2", List.of("20", "25")),
                        new DefinicaoParametroAleatorio("DANO_3", List.of("30", "35"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_08_INTRODUCAO_A_ARRAYS, "v2",
                "Instancie um array de {{TAMANHO_ARRAY}} posicoes e obtenha o tamanho dele usando .length.",
                "int[] golpes = new {{LACUNA_1}}[{{TAMANHO_ARRAY}}];\nint totalGolpes = golpes.{{LACUNA_2}};\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("int")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.METODO, List.of("length")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar(totalGolpes)"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("int"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("length"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(totalGolpes)"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("String", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("length()", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("size()", CategoriaErro.METODO)),
                List.of(new DefinicaoParametroAleatorio("TAMANHO_ARRAY", List.of("3", "4", "5"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_08_INTRODUCAO_A_ARRAYS, "v3",
                "Acesse o ultimo inimigo de um array de Strings usando length - 1 e ataque.",
                "{{LACUNA_1}} inimigos = {\"Goblin\", \"Orc\", \"Dragao\"};\nString alvo = inimigos[inimigos.{{LACUNA_2}} - 1];\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.TIPO_DE_DADO, List.of("String[]")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.METODO, List.of("length")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("String[]"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("length"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("String", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("size", CategoriaErro.METODO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of());
    }

    // andar 9: laco for e while
    private void carregarAndar09LacoForEWhile() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_09_LACO_FOR_E_WHILE, "v1",
                "Use um laco for para desferir exatamente {{QTD_GOLPES}} golpes seguidos no inimigo.",
                "{{LACUNA_1}} (int i = 0; i {{LACUNA_2}} {{QTD_GOLPES}}; i++) {\n    {{LACUNA_3}};\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.SINTAXE, List.of("for")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.LOGICA, List.of("<")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar()"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("for"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("<"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar()"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("if", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator(">", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(new DefinicaoParametroAleatorio("QTD_GOLPES", List.of("3", "4", "5"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_09_LACO_FOR_E_WHILE, "v2",
                "Use um laco while para atacar enquanto a energia restante for maior que 0, evitando loop infinito.",
                "int energia = {{ENERGIA_INICIAL}};\n{{LACUNA_1}} (energia > 0) {\n    heroi.atacar();\n    {{LACUNA_2}};\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.SINTAXE, List.of("while")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.LOGICA, List.of("energia--"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("while"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("energia--"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("for", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("energia++", CategoriaErro.LOGICA),
                        DefinicaoBlocoVariante.criarBlocoDistrator("break", CategoriaErro.LOGICA)),
                List.of(new DefinicaoParametroAleatorio("ENERGIA_INICIAL", List.of("3", "4", "6"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_09_LACO_FOR_E_WHILE, "v3",
                "Percorra todo o array de danos usando for e acumule o golpe total antes de atacar.",
                "int total = 0;\n{{LACUNA_1}} (int i = 0; i < danos.{{LACUNA_2}}; i++) {\n    total += danos[i];\n}\n{{LACUNA_3}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.SINTAXE, List.of("for")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.METODO, List.of("length")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("heroi.atacar(total)"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("for"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("length"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(total)"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("switch", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("length()", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("System.out.println(total)", CategoriaErro.METODO)),
                List.of());
    }

    // andar 10: boss desafio integrando todos os temas (tipagem, primitivos/nao primitivos, scanner, switch, ternario, arrays e lacos)
    private void carregarAndar10BossIntegrador() {
        registrarVariante(
                TemaAndarCiclo.ANDAR_10_BOSS_TODOS_OS_TEMAS, "v1",
                "BOSS FINAL: Leia o modo via Scanner, some os golpes do array com for, aplique ternario e derrote o Chefe!",
                "String modo = leitor.{{LACUNA_1}}.trim().toUpperCase();\nint[] golpes = { {{GOLPE_A}}, {{GOLPE_B}} };\nint soma = 0;\n{{LACUNA_2}} (int i = 0; i < golpes.length; i++) { soma += golpes[i]; }\nint danoFinal = modo.equals(\"CRITICO\") {{LACUNA_3}} soma * 2 : soma;\n{{LACUNA_4}};",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.METODO, List.of("nextLine()")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.SINTAXE, List.of("for")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.SINTAXE, List.of("?")),
                        new DefinicaoLacunaCodigo("LACUNA_4", CategoriaErro.METODO, List.of("heroi.atacar(danoFinal)"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("nextLine()"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("for"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("?"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(danoFinal)"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("nextInt()", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("if", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator(":", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(
                        new DefinicaoParametroAleatorio("GOLPE_A", List.of("10", "15", "20")),
                        new DefinicaoParametroAleatorio("GOLPE_B", List.of("12", "18", "24"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_10_BOSS_TODOS_OS_TEMAS, "v2",
                "BOSS FINAL: Trate o comando no switch, percorra o array de runas e finalize o Chefe com while!",
                "String comando = entrada.trim().toUpperCase();\n{{LACUNA_1}} (comando) {\n    case \"GOLPE\":\n        int turnos = {{TURNOS_BOSS}};\n        {{LACUNA_2}} (turnos > 0) {\n            heroi.atacar(bonusAtivo ? 20 {{LACUNA_3}} 10);\n            {{LACUNA_4}};\n        }\n        break;\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.SINTAXE, List.of("switch")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.SINTAXE, List.of("while")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.SINTAXE, List.of(":")),
                        new DefinicaoLacunaCodigo("LACUNA_4", CategoriaErro.LOGICA, List.of("turnos--"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("switch"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("while"),
                        DefinicaoBlocoVariante.criarBlocoCorreto(":"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("turnos--"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("if", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("for", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("?", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("turnos++", CategoriaErro.LOGICA)),
                List.of(new DefinicaoParametroAleatorio("TURNOS_BOSS", List.of("2", "3", "4"))));

        registrarVariante(
                TemaAndarCiclo.ANDAR_10_BOSS_TODOS_OS_TEMAS, "v3",
                "BOSS FINAL: Combine Scanner, array tipado, condicional e laco for para quebrar o escudo do Chefe!",
                "int minimo = leitor.{{LACUNA_1}};\n{{LACUNA_2}} ataques = { {{ATAQUE_1}}, {{ATAQUE_2}}, {{ATAQUE_3}} };\nfor (int i = 0; i < ataques.{{LACUNA_3}}; i++) {\n    if (ataques[i] >= minimo) {\n        {{LACUNA_4}};\n    }\n}",
                List.of(
                        new DefinicaoLacunaCodigo("LACUNA_1", CategoriaErro.METODO, List.of("nextInt()")),
                        new DefinicaoLacunaCodigo("LACUNA_2", CategoriaErro.TIPO_DE_DADO, List.of("int[]")),
                        new DefinicaoLacunaCodigo("LACUNA_3", CategoriaErro.METODO, List.of("length")),
                        new DefinicaoLacunaCodigo("LACUNA_4", CategoriaErro.METODO, List.of("heroi.atacar(ataques[i])"))),
                List.of(
                        DefinicaoBlocoVariante.criarBlocoCorreto("nextInt()"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("int[]"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("length"),
                        DefinicaoBlocoVariante.criarBlocoCorreto("heroi.atacar(ataques[i])"),
                        DefinicaoBlocoVariante.criarBlocoDistrator("nextLine()", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("int", CategoriaErro.TIPO_DE_DADO),
                        DefinicaoBlocoVariante.criarBlocoDistrator("length()", CategoriaErro.SINTAXE),
                        DefinicaoBlocoVariante.criarBlocoDistrator("heroi.atacar", CategoriaErro.SINTAXE)),
                List.of(
                        new DefinicaoParametroAleatorio("ATAQUE_1", List.of("8", "10")),
                        new DefinicaoParametroAleatorio("ATAQUE_2", List.of("15", "18")),
                        new DefinicaoParametroAleatorio("ATAQUE_3", List.of("22", "25"))));
    }

    private void registrarVariante(
            TemaAndarCiclo temaAndar,
            String chaveVarianteNoAndar,
            String enunciadoComMarcadores,
            String templateCodigoComLacunas,
            List<DefinicaoLacunaCodigo> lacunasObrigatorias,
            List<DefinicaoBlocoVariante> blocosDisponiveis,
            List<DefinicaoParametroAleatorio> parametrosAleatorios) {
        long idAtual = proximoIdentificadorDesafio++;
        DefinicaoVarianteDesafioBlocos variante = new DefinicaoVarianteDesafioBlocos(
                idAtual,
                temaAndar.getNumeroAndarNaTorre(),
                chaveVarianteNoAndar,
                1,
                temaAndar.getTituloTemaPedagogico(),
                enunciadoComMarcadores,
                templateCodigoComLacunas,
                lacunasObrigatorias,
                blocosDisponiveis,
                parametrosAleatorios,
                ACOES_PADRAO_ESPADA,
                ACOES_PADRAO_CAJADO,
                true);

        mapaVariantesPorAndar
                .computeIfAbsent(temaAndar.getNumeroAndarNaTorre(), chave -> new ArrayList<>())
                .add(variante);
        mapaVariantesPorIdentificador.put(idAtual, variante);
    }
}
