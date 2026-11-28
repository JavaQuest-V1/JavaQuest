import {
  CategoriaErro,
  EnemyArchetype,
  InimigoArena,
  TipoAcaoHeroi,
} from "../types/gameplay";

export interface DicaTemplate {
  tituloRegra: string;
  texto: string;
  exemploCerto: string;
  exemploErro: string;
}

export interface ChallengeVariationBlueprint {
  id: string;
  objetivo: string;
  codigoCorreto: string;
  blocosCorretos: string[];
  conceitoResumo: string;
  acoesEsperadas: TipoAcaoHeroi[];
  dicas: Record<CategoriaErro, DicaTemplate>;
}

export interface FloorBlueprint {
  numeroAndar: number;
  topicoJava: string;
  nivelDificuldade: "BASICO" | "INTERMEDIARIO" | "CHEFE";
  xpRecompensa: number;
  inimigo: InimigoArena;
  variacoes: ChallengeVariationBlueprint[];
}

function makeEnemy(
  nome: string,
  titulo: string,
  arquetipo: EnemyArchetype,
  corAura: string,
  falaConjura: string,
  ehChefe = false
): InimigoArena {
  return {
    nome,
    titulo,
    arquetipo,
    ehChefe,
    hpMaximo: ehChefe ? 300 : 100,
    falaConjura,
    corAura,
  };
}

/**
 * Catálogo completo do Ciclo 1 (Andares 1–10 com Chefe Integrador no 10)
 * + Andar 11 (Checkpoint 2) com 3 variações equivalentes por andar (RF-20 / RF-21).
 */
export const FLOORS_CATALOG: FloorBlueprint[] = [
  {
    numeroAndar: 1,
    topicoJava: "Variáveis & int",
    nivelDificuldade: "BASICO",
    xpRecompensa: 25,
    inimigo: makeEnemy(
      "Bug da Variável",
      "Andar 1 • Fundamentos",
      "slime",
      "#5A8F49",
      "Sua memória vai vazar! Monte a declaração inteira para me derrotar!"
    ),
    variacoes: [
      {
        id: "f1-v1",
        objetivo: "Declare uma variável inteira chamada dano com valor 25.",
        codigoCorreto: "int dano = 25;",
        blocosCorretos: ["int", "dano", "=", "25;"],
        conceitoResumo:
          "Em Java, variáveis inteiras usam o tipo primitivo `int`, seguido do nome, `=`, valor e ponto e vírgula `;`.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "TIPO PRIMITIVO INT",
            texto: "Números inteiros começam sempre pela palavra-chave `int` em minúsculas.",
            exemploCerto: "int forca = 25;",
            exemploErro: "Int forca = 25;",
          },
          SINTAXE: {
            tituloRegra: "ORDEM E PONTO E VÍRGULA (;)",
            texto: "A ordem correta é: tipo -> nome -> sinal `=` -> valor com `;` no final.",
            exemploCerto: "int dano = 25;",
            exemploErro: "dano int = 25",
          },
          LOGICA: {
            tituloRegra: "ATRIBUIÇÃO DE VALOR",
            texto: "O nome da variável fica à esquerda do `=` e o número inteiro fica à direita.",
            exemploCerto: "int dano = 25;",
            exemploErro: "int 25 = dano;",
          },
          METODO: {
            tituloRegra: "DECLARAÇÃO SIMPLES",
            texto: "Neste andar você apenas declara uma variável `int` — não é necessário chamar método.",
            exemploCerto: "int dano = 25;",
            exemploErro: "int dano(25);",
          },
        },
      },
      {
        id: "f1-v2",
        objetivo: "Declare uma variável inteira chamada vida inicializada com 100.",
        codigoCorreto: "int vida = 100;",
        blocosCorretos: ["int", "vida", "=", "100;"],
        conceitoResumo:
          "Toda instrução simples de declaração em Java segue o padrão `tipo nome = valor;`.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "TIPO INT PARA INTEIROS",
            texto: "Use `int` primeiro para indicar ao compilador que `vida` guarda um número inteiro.",
            exemploCerto: "int vida = 100;",
            exemploErro: "vida = 100;",
          },
          SINTAXE: {
            tituloRegra: "PONTO E VÍRGULA NO FINAL",
            texto: "O bloco com `;` (`100;`) deve fechar a instrução por último.",
            exemploCerto: "int vida = 100;",
            exemploErro: "int vida = 100",
          },
          LOGICA: {
            tituloRegra: "IDENTIFICADOR ANTES DO =",
            texto: "Coloque `vida` antes do `=` para receber o valor `100;`.",
            exemploCerto: "int vida = 100;",
            exemploErro: "int = vida 100;",
          },
          METODO: {
            tituloRegra: "DECLARAÇÃO DE VARIÁVEL",
            texto: "Comece com `int`, depois `vida`, depois `=`, e feche com `100;`.",
            exemploCerto: "int vida = 100;",
            exemploErro: "vida.set(100);",
          },
        },
      },
      {
        id: "f1-v3",
        objetivo: "Declare uma variável inteira chamada nivel com valor 5.",
        codigoCorreto: "int nivel = 5;",
        blocosCorretos: ["int", "nivel", "=", "5;"],
        conceitoResumo:
          "Variáveis `int` armazenam números sem casas decimais e terminam obrigatoriamente com `;`.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "INICIE COM INT",
            texto: "O tipo `int` sempre vem na primeira posição da declaração.",
            exemploCerto: "int nivel = 5;",
            exemploErro: "nivel int = 5;",
          },
          SINTAXE: {
            tituloRegra: "ESTRUTURA DA DECLARAÇÃO",
            texto: "Monte na ordem: `int` -> `nivel` -> `=` -> `5;`.",
            exemploCerto: "int nivel = 5;",
            exemploErro: "int nivel 5; =",
          },
          LOGICA: {
            tituloRegra: "ATRIBUIÇÃO COM =",
            texto: "O operador `=` atribui o valor da direita (`5;`) à variável da esquerda (`nivel`).",
            exemploCerto: "int nivel = 5;",
            exemploErro: "int = 5 nivel;",
          },
          METODO: {
            tituloRegra: "SINTAXE BÁSICA JAVA",
            texto: "Siga o padrão clássico `int nome = valor;`.",
            exemploCerto: "int nivel = 5;",
            exemploErro: "int(nivel) = 5;",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 2,
    topicoJava: "Decimais & double",
    nivelDificuldade: "BASICO",
    xpRecompensa: 25,
    inimigo: makeEnemy(
      "Bug do Ponto Flutuante",
      "Andar 2 • Tipos Primitivos",
      "wisp",
      "#52B7E8",
      "Números quebrados desestabilizam seu golpe!"
    ),
    variacoes: [
      {
        id: "f2-v1",
        objetivo: "Declare a constante decimal pi do tipo double com valor 3.14.",
        codigoCorreto: "double pi = 3.14;",
        blocosCorretos: ["double", "pi", "=", "3.14;"],
        conceitoResumo:
          "Em Java, números com casas decimais usam `double` e ponto `.` (nunca vírgula) como separador decimal.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "TIPO DOUBLE PARA DECIMAIS",
            texto: "Sempre comece com `double` quando o valor possuir ponto decimal como `3.14`.",
            exemploCerto: "double pi = 3.14;",
            exemploErro: "int pi = 3.14;",
          },
          SINTAXE: {
            tituloRegra: "ORDEM DO DOUBLE",
            texto: "Posicione `double`, depois `pi`, depois `=` e encerre com `3.14;`.",
            exemploCerto: "double pi = 3.14;",
            exemploErro: "pi double = 3.14;",
          },
          LOGICA: {
            tituloRegra: "ATRIBUIÇÃO DECIMAL",
            texto: "A variável `pi` recebe `3.14;` através do operador `=`.",
            exemploCerto: "double pi = 3.14;",
            exemploErro: "double 3.14; = pi",
          },
          METODO: {
            tituloRegra: "DECLARAÇÃO PRIMITIVA",
            texto: "Não há chamadas de função aqui — apenas `double pi = 3.14;`.",
            exemploCerto: "double pi = 3.14;",
            exemploErro: "double.pi(3.14);",
          },
        },
      },
      {
        id: "f2-v2",
        objetivo: "Declare um multiplicador crítico double chamado bonus com valor 1.5.",
        codigoCorreto: "double bonus = 1.5;",
        blocosCorretos: ["double", "bonus", "=", "1.5;"],
        conceitoResumo:
          "O tipo `double` oferece alta precisão para multiplicadores e danos fracionados em Java.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "DOUBLE SEMPRE PRIMEIRO",
            texto: "Comece pelo tipo `double` para armazenar `1.5;`.",
            exemploCerto: "double bonus = 1.5;",
            exemploErro: "bonus double = 1.5;",
          },
          SINTAXE: {
            tituloRegra: "FECHE COM PONTO E VÍRGULA",
            texto: "O bloco `1.5;` contém o `;` final e precisa ser o último.",
            exemploCerto: "double bonus = 1.5;",
            exemploErro: "double bonus 1.5; =",
          },
          LOGICA: {
            tituloRegra: "NOME ANTES DO VALOR",
            texto: "Escreva `bonus = 1.5;` após o tipo `double`.",
            exemploCerto: "double bonus = 1.5;",
            exemploErro: "double 1.5; = bonus",
          },
          METODO: {
            tituloRegra: "PADRÃO DE DECLARAÇÃO",
            texto: "Padrão: `double` + `bonus` + `=` + `1.5;`.",
            exemploCerto: "double bonus = 1.5;",
            exemploErro: "bonus(1.5);",
          },
        },
      },
      {
        id: "f2-v3",
        objetivo: "Declare uma taxa de defesa double chamada escudo com valor 2.75.",
        codigoCorreto: "double escudo = 2.75;",
        blocosCorretos: ["double", "escudo", "=", "2.75;"],
        conceitoResumo:
          "Tipos numéricos decimais usam `double nome = valor;` com ponto decimal.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "PALAVRA-CHAVE DOUBLE",
            texto: "Use `double` no primeiro slot da linha.",
            exemploCerto: "double escudo = 2.75;",
            exemploErro: "Double escudo = 2.75;",
          },
          SINTAXE: {
            tituloRegra: "SEQUÊNCIA CORRETA",
            texto: "A sequência completa é `double`, `escudo`, `=`, `2.75;`.",
            exemploCerto: "double escudo = 2.75;",
            exemploErro: "escudo = double 2.75;",
          },
          LOGICA: {
            tituloRegra: "ATRIBUIÇÃO SIMPLES",
            texto: "O valor `2.75;` deve vir logo após o operador `=`.",
            exemploCerto: "double escudo = 2.75;",
            exemploErro: "double = escudo 2.75;",
          },
          METODO: {
            tituloRegra: "DECLARAÇÃO SEM MÉTODO",
            texto: "Apenas atribua `2.75;` à variável `double escudo`.",
            exemploCerto: "double escudo = 2.75;",
            exemploErro: "escudo.double(2.75);",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 3,
    topicoJava: "boolean & String",
    nivelDificuldade: "BASICO",
    xpRecompensa: 25,
    inimigo: makeEnemy(
      "Bug Booleano",
      "Andar 3 • Verdadeiro ou Falso",
      "phantom",
      "#A45EE5",
      "Verdadeiro ou falso? Um único caractere errado e eu contra-ataco!"
    ),
    variacoes: [
      {
        id: "f3-v1",
        objetivo: "Declare uma variável booleana chamada ativo como verdadeira (true).",
        codigoCorreto: "boolean ativo = true;",
        blocosCorretos: ["boolean", "ativo", "=", "true;"],
        conceitoResumo:
          "O tipo `boolean` aceita apenas `true` ou `false` (sem aspas e em minúsculas).",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "TIPO BOOLEAN",
            texto: "`boolean` guarda estados lógicos (`true` ou `false`) e vem no início da instrução.",
            exemploCerto: "boolean ativo = true;",
            exemploErro: "String ativo = true;",
          },
          SINTAXE: {
            tituloRegra: "ORDEM DA DECLARAÇÃO BOOLEANA",
            texto: "Coloque `boolean` -> `ativo` -> `=` -> `true;`.",
            exemploCerto: "boolean ativo = true;",
            exemploErro: "ativo boolean = true;",
          },
          LOGICA: {
            tituloRegra: "VALOR À DIREITA DO =",
            texto: "`true;` é o valor atribuído e deve ficar após o `=`.",
            exemploCerto: "boolean ativo = true;",
            exemploErro: "boolean true; = ativo",
          },
          METODO: {
            tituloRegra: "DECLARAÇÃO DIRETA",
            texto: "Use o formato `boolean nome = true;`.",
            exemploCerto: "boolean ativo = true;",
            exemploErro: "boolean(ativo) = true;",
          },
        },
      },
      {
        id: "f3-v2",
        objetivo: 'Declare uma String chamada heroi com o texto "Kael".',
        codigoCorreto: 'String heroi = "Kael";',
        blocosCorretos: ["String", "heroi", "=", '"Kael";'],
        conceitoResumo:
          "`String` começa com S maiúsculo em Java e textos literais sempre usam aspas duplas `\"...\"`.",
        acoesEsperadas: ["INTERAGIR", "ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "STRING COM S MAIÚSCULO",
            texto: "`String` é uma classe em Java — sempre inicia a declaração com `S` maiúsculo.",
            exemploCerto: 'String heroi = "Kael";',
            exemploErro: "string heroi = 'Kael';",
          },
          SINTAXE: {
            tituloRegra: "ASPAS DUPLAS E ; NO FINAL",
            texto: 'O literal `"Kael";` fica por último, logo após o sinal `=`.',
            exemploCerto: 'String heroi = "Kael";',
            exemploErro: 'String "Kael"; = heroi',
          },
          LOGICA: {
            tituloRegra: "NOME DA VARIÁVEL",
            texto: "A variável `heroi` fica entre `String` e `=`.",
            exemploCerto: 'String heroi = "Kael";',
            exemploErro: 'String = heroi "Kael";',
          },
          METODO: {
            tituloRegra: "ATRIBUIÇÃO DE TEXTO",
            texto: 'Monte `String` -> `heroi` -> `=` -> `"Kael";`.',
            exemploCerto: 'String heroi = "Kael";',
            exemploErro: 'String.heroi("Kael");',
          },
        },
      },
      {
        id: "f3-v3",
        objetivo: "Declare uma variável booleana chamada travado com valor false.",
        codigoCorreto: "boolean travado = false;",
        blocosCorretos: ["boolean", "travado", "=", "false;"],
        conceitoResumo:
          "Variáveis `boolean` controlam estados do jogo como portas travadas ou escudos ativos.",
        acoesEsperadas: ["INTERAGIR", "ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "BOOLEAN EM MINÚSCULAS",
            texto: "Comece sempre com `boolean` seguido do nome `travado`.",
            exemploCerto: "boolean travado = false;",
            exemploErro: "Boolean travado = false;",
          },
          SINTAXE: {
            tituloRegra: "PONTO E VÍRGULA FINAL",
            texto: "O bloco `false;` encerra a instrução.",
            exemploCerto: "boolean travado = false;",
            exemploErro: "boolean travado = false",
          },
          LOGICA: {
            tituloRegra: "ORDEM DE ATRIBUIÇÃO",
            texto: "Primeiro o nome `travado`, depois `=`, depois `false;`.",
            exemploCerto: "boolean travado = false;",
            exemploErro: "boolean = false; travado",
          },
          METODO: {
            tituloRegra: "ESTADO BOOLEANO",
            texto: "Monte `boolean` + `travado` + `=` + `false;`.",
            exemploCerto: "boolean travado = false;",
            exemploErro: "travado(false);",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 4,
    topicoJava: "Operadores Aritméticos",
    nivelDificuldade: "BASICO",
    xpRecompensa: 25,
    inimigo: makeEnemy(
      "Golem de Cálculo",
      "Andar 4 • Expressões",
      "golem",
      "#E5A93B",
      "Calcule o dano exato ou minha armadura absorverá o ataque!"
    ),
    variacoes: [
      {
        id: "f4-v1",
        objetivo: "Calcule o inteiro total multiplicando dano por 2.",
        codigoCorreto: "int total = dano * 2;",
        blocosCorretos: ["int total", "=", "dano", "* 2;"],
        conceitoResumo:
          "Operadores aritméticos (`+`, `-`, `*`, `/`) combinam variáveis e literais no lado direito da atribuição.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "TIPO DO RESULTADO",
            texto: "Inicie com `int total` à esquerda do sinal `=`.",
            exemploCerto: "int total = dano * 2;",
            exemploErro: "total = int dano * 2;",
          },
          SINTAXE: {
            tituloRegra: "OPERADOR ENTRE OPERANDOS",
            texto: "Coloque `dano` antes de `* 2;` para formar a multiplicação válida.",
            exemploCerto: "int total = dano * 2;",
            exemploErro: "int total = * 2; dano",
          },
          LOGICA: {
            tituloRegra: "EXPRESSÃO À DIREITA",
            texto: "Tudo que será calculado (`dano * 2;`) vai depois do `=`.",
            exemploCerto: "int total = dano * 2;",
            exemploErro: "dano * 2; = int total",
          },
          METODO: {
            tituloRegra: "OPERAÇÃO ARITMÉTICA",
            texto: "Use `int total` -> `=` -> `dano` -> `* 2;`.",
            exemploCerto: "int total = dano * 2;",
            exemploErro: "int total = multiplicar(dano, 2);",
          },
        },
      },
      {
        id: "f4-v2",
        objetivo: "Declare o inteiro soma somando 10 com 15.",
        codigoCorreto: "int soma = 10 + 15;",
        blocosCorretos: ["int soma", "=", "10 +", "15;"],
        conceitoResumo:
          "O operador `+` realiza soma aritmética quando aplicado entre dois números inteiros.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "DECLARAÇÃO INT SOMA",
            texto: "Comece pela variável `int soma` seguida de `=`.",
            exemploCerto: "int soma = 10 + 15;",
            exemploErro: "soma int = 10 + 15;",
          },
          SINTAXE: {
            tituloRegra: "PONTO E VÍRGULA NO FINAL",
            texto: "`15;` termina com `;`, portanto é o último bloco da expressão.",
            exemploCerto: "int soma = 10 + 15;",
            exemploErro: "int soma = 15; 10 +",
          },
          LOGICA: {
            tituloRegra: "ORDEM DA SOMA",
            texto: "Posicione `10 +` antes de `15;` para o operador `+` unir os números.",
            exemploCerto: "int soma = 10 + 15;",
            exemploErro: "int soma 10 + = 15;",
          },
          METODO: {
            tituloRegra: "EXPRESSÃO NUMÉRICA",
            texto: "Monte: `int soma` -> `=` -> `10 +` -> `15;`.",
            exemploCerto: "int soma = 10 + 15;",
            exemploErro: "int soma = add(10, 15);",
          },
        },
      },
      {
        id: "f4-v3",
        objetivo: "Calcule o inteiro resta subtraindo 20 da variável vida.",
        codigoCorreto: "int resta = vida - 20;",
        blocosCorretos: ["int resta", "=", "vida", "- 20;"],
        conceitoResumo:
          "Na subtração em Java, a ordem dos operandos importa: `vida - 20` reduz 20 pontos de `vida`.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "VARIÁVEL DESTINO",
            texto: "`int resta` vai primeiro, antes do `=`.",
            exemploCerto: "int resta = vida - 20;",
            exemploErro: "vida - 20 = int resta;",
          },
          SINTAXE: {
            tituloRegra: "FECHAMENTO COM ;",
            texto: "`- 20;` fecha a expressão e vem depois de `vida`.",
            exemploCerto: "int resta = vida - 20;",
            exemploErro: "int resta = - 20; vida",
          },
          LOGICA: {
            tituloRegra: "MINUENDO ANTES DO SUBTRAENDO",
            texto: "Coloque `vida` primeiro e `- 20;` em seguida.",
            exemploCerto: "int resta = vida - 20;",
            exemploErro: "int resta = 20 - vida;",
          },
          METODO: {
            tituloRegra: "SUBTRAÇÃO DIRETA",
            texto: "Ordem: `int resta` -> `=` -> `vida` -> `- 20;`.",
            exemploCerto: "int resta = vida - 20;",
            exemploErro: "resta.subtrair(20);",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 5,
    topicoJava: "Saída & System.out",
    nivelDificuldade: "BASICO",
    xpRecompensa: 25,
    inimigo: makeEnemy(
      "Eco da Sintaxe",
      "Andar 5 • Console Java",
      "wisp",
      "#5A8F49",
      "Invoque o comando de console corretamente para quebrar meu selo!"
    ),
    variacoes: [
      {
        id: "f5-v1",
        objetivo: 'Imprima o grito de guerra "Ataque!" no console com System.out.println.',
        codigoCorreto: 'System.out.println("Ataque!");',
        blocosCorretos: ["System.out", ".println(", '"Ataque!"', ");"],
        conceitoResumo:
          "`System.out.println(...)` exibe mensagens no console Java e quebra linha automaticamente.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          METODO: {
            tituloRegra: "CHAMADA SYSTEM.OUT.PRINTLN",
            texto: "A chamada de método encadeia `System.out` + `.println(` + argumento + `);`.",
            exemploCerto: 'System.out.println("Java");',
            exemploErro: 'println.System.out("Java");',
          },
          SINTAXE: {
            tituloRegra: "PARÊNTESES BALANCEADOS",
            texto: "O bloco `.println(` abre parêntese e `);` fecha a chamada no final.",
            exemploCerto: 'System.out.println("Ataque!");',
            exemploErro: 'System.out.println("Ataque!"',
          },
          TIPO_DE_DADO: {
            tituloRegra: "TEXTO ENTRE ASPAS DUPLAS",
            texto: '`"Ataque!"` deve ficar dentro dos parênteses de `.println(...)`.',
            exemploCerto: 'System.out.println("Ataque!");',
            exemploErro: "System.out.println(Ataque!);",
          },
          LOGICA: {
            tituloRegra: "ENCADEAMENTO COM PONTO",
            texto: "Primeiro o objeto `System.out`, depois o método `.println(`.",
            exemploCerto: 'System.out.println("Ataque!");',
            exemploErro: '.println(System.out "Ataque!");',
          },
        },
      },
      {
        id: "f5-v2",
        objetivo: 'Concatene e imprima "Java " + 10 usando System.out.println.',
        codigoCorreto: 'System.out.println("Java " + 10);',
        blocosCorretos: ["System.out", ".println(", '"Java "', "+ 10", ");"],
        conceitoResumo:
          "Quando `+` une uma `String` com um número, Java realiza concatenação de texto.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          METODO: {
            tituloRegra: "MÉTODO PRINTLN",
            texto: "Comece sempre com `System.out` seguido imediatamente de `.println(`.",
            exemploCerto: 'System.out.println("XP: " + 50);',
            exemploErro: 'System.print("XP: " + 50);',
          },
          SINTAXE: {
            tituloRegra: "FECHAMENTO COM );",
            texto: "Coloque `);` no último bloco para fechar o parêntese e terminar a linha.",
            exemploCerto: 'System.out.println("Java " + 10);',
            exemploErro: 'System.out.println("Java " + 10;',
          },
          TIPO_DE_DADO: {
            tituloRegra: "CONCATENAÇÃO STRING + INT",
            texto: 'Posicione `"Java "` antes de `+ 10` dentro dos parênteses.',
            exemploCerto: 'System.out.println("Java " + 10);',
            exemploErro: 'System.out.println(+ 10 "Java ");',
          },
          LOGICA: {
            tituloRegra: "ARGUMENTO COMPLETO",
            texto: 'Monte `System.out` -> `.println(` -> `"Java "` -> `+ 10` -> `);`.',
            exemploCerto: 'System.out.println("Java " + 10);',
            exemploErro: 'System.out("Java ").println(+ 10);',
          },
        },
      },
      {
        id: "f5-v3",
        objetivo: "Imprima a variável dano no console Java.",
        codigoCorreto: "System.out.println(dano);",
        blocosCorretos: ["System.out", ".println(", "dano", ");"],
        conceitoResumo:
          "Variáveis passadas a `System.out.println(variavel);` vão sem aspas para imprimir seu valor.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          METODO: {
            tituloRegra: "CHAMADA DE SAÍDA",
            texto: "Ligue `System.out` diretamente ao método `.println(`.",
            exemploCerto: "System.out.println(dano);",
            exemploErro: "out.System.println(dano);",
          },
          SINTAXE: {
            tituloRegra: "PARÊNTESE E ; NO FIM",
            texto: "`dano` fica entre `.println(` e `);`.",
            exemploCerto: "System.out.println(dano);",
            exemploErro: "System.out.println dano;",
          },
          TIPO_DE_DADO: {
            tituloRegra: "VARIÁVEL SEM ASPAS",
            texto: "Coloque o identificador `dano` como argumento dentro de `.println(...)`.",
            exemploCerto: "System.out.println(dano);",
            exemploErro: 'System.out.println("dano");',
          },
          LOGICA: {
            tituloRegra: "ORDEM DE INVOCAÇÃO",
            texto: "Ordem: `System.out` -> `.println(` -> `dano` -> `);`.",
            exemploCerto: "System.out.println(dano);",
            exemploErro: "dano.println(System.out);",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 6,
    topicoJava: "Condicional if",
    nivelDificuldade: "INTERMEDIARIO",
    xpRecompensa: 30,
    inimigo: makeEnemy(
      "Monstro Condicional",
      "Andar 6 • Decisões",
      "gargoyle",
      "#E5A93B",
      "Só cairei se sua condição for avaliada corretamente!"
    ),
    variacoes: [
      {
        id: "f6-v1",
        objetivo: "Se dano for maior que 10, execute o método atacar();.",
        codigoCorreto: "if (dano > 10) { atacar(); }",
        blocosCorretos: ["if", "(dano > 10)", "{", "atacar();", "}"],
        conceitoResumo:
          "Blocos `if` exigem a condição entre parênteses `(...)` e o corpo da ação entre chaves `{ ... }`.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          SINTAXE: {
            tituloRegra: "PARÊNTESES E CHAVES NO IF",
            texto: "Condições ficam entre `()` logo após `if`, e o comando dentro de `{` e `}`.",
            exemploCerto: "if (atk > 10) { atacar(); }",
            exemploErro: "if atk > 10 atacar();",
          },
          LOGICA: {
            tituloRegra: "CONDIÇÃO ANTES DA AÇÃO",
            texto: "Primeiro avalie `(dano > 10)`, depois abra `{`, chame `atacar();` e feche `}`.",
            exemploCerto: "if (dano > 10) { atacar(); }",
            exemploErro: "if { atacar(); } (dano > 10)",
          },
          METODO: {
            tituloRegra: "CHAMADA DENTRO DO BLOCO",
            texto: "`atacar();` fica protegido entre `{` e `}`.",
            exemploCerto: "if (dano > 10) { atacar(); }",
            exemploErro: "atacar(); if (dano > 10)",
          },
          TIPO_DE_DADO: {
            tituloRegra: "EXPRESSÃO BOOLEANA NO IF",
            texto: "`(dano > 10)` retorna verdadeiro/falso e deve vir logo após `if`.",
            exemploCerto: "if (dano > 10) { atacar(); }",
            exemploErro: "if (int dano) { atacar(); }",
          },
        },
      },
      {
        id: "f6-v2",
        objetivo: "Se vida for igual a 0 (==), execute o método recuar();.",
        codigoCorreto: "if (vida == 0) { recuar(); }",
        blocosCorretos: ["if", "(vida == 0)", "{", "recuar();", "}"],
        conceitoResumo:
          "Use dois sinais `==` para comparar igualdade em Java; um sinal `=` faz atribuição.",
        acoesEsperadas: ["MOVER", "ATACAR"],
        dicas: {
          LOGICA: {
            tituloRegra: "IGUALDADE (==) NO IF",
            texto: "Após `if`, insira a comparação `(vida == 0)` e só depois o bloco `{ recuar(); }`.",
            exemploCerto: "if (hp == 0) { recuar(); }",
            exemploErro: "if (hp = 0) { recuar(); }",
          },
          SINTAXE: {
            tituloRegra: "ABERTURA E FECHAMENTO DE CHAVES",
            texto: "Abra com `{`, coloque `recuar();` dentro, e termine com `}`.",
            exemploCerto: "if (vida == 0) { recuar(); }",
            exemploErro: "if (vida == 0) } recuar(); {",
          },
          METODO: {
            tituloRegra: "CORPO DO IF",
            texto: "O método `recuar();` deve estar cercado pelas chaves `{` e `}`.",
            exemploCerto: "if (vida == 0) { recuar(); }",
            exemploErro: "if (vida == 0) recuar();",
          },
          TIPO_DE_DADO: {
            tituloRegra: "TESTE LÓGICO",
            texto: "Monte `if` -> `(vida == 0)` -> `{` -> `recuar();` -> `}`.",
            exemploCerto: "if (vida == 0) { recuar(); }",
            exemploErro: "(vida == 0) if { recuar(); }",
          },
        },
      },
      {
        id: "f6-v3",
        objetivo: "Se a variável booleana alvoVisivel for verdadeira, execute disparar();.",
        codigoCorreto: "if (alvoVisivel) { disparar(); }",
        blocosCorretos: ["if", "(alvoVisivel)", "{", "disparar();", "}"],
        conceitoResumo:
          "Variáveis `boolean` podem ser testadas diretamente dentro de `if (variavel)` sem precisar de `== true`.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          SINTAXE: {
            tituloRegra: "ESTRUTURA IF { ... }",
            texto: "Comece com `if`, seguido de `(alvoVisivel)`, `{`, `disparar();` e `}`.",
            exemploCerto: "if (ativo) { disparar(); }",
            exemploErro: "if ativo { disparar(); }",
          },
          LOGICA: {
            tituloRegra: "CONDIÇÃO BOOLEANA DIRETA",
            texto: "A condição `(alvoVisivel)` precede o bloco de execução `{ disparar(); }`.",
            exemploCerto: "if (alvoVisivel) { disparar(); }",
            exemploErro: "{ disparar(); } if (alvoVisivel)",
          },
          METODO: {
            tituloRegra: "AÇÃO DO HERÓI",
            texto: "`disparar();` só executa dentro das chaves `{` e `}`.",
            exemploCerto: "if (alvoVisivel) { disparar(); }",
            exemploErro: "if (disparar();) { alvoVisivel }",
          },
          TIPO_DE_DADO: {
            tituloRegra: "BOOLEAN NO PARÊNTESE",
            texto: "Coloque `(alvoVisivel)` imediatamente após `if`.",
            exemploCerto: "if (alvoVisivel) { disparar(); }",
            exemploErro: "if (int alvoVisivel) { disparar(); }",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 7,
    topicoJava: "Desvio if / else",
    nivelDificuldade: "INTERMEDIARIO",
    xpRecompensa: 30,
    inimigo: makeEnemy(
      "Cavaleiro Bifurcado",
      "Andar 7 • Dois Caminhos",
      "knight",
      "#CA1C08",
      "Dois caminhos diante da lâmina — erre o else e sinta o golpe!"
    ),
    variacoes: [
      {
        id: "f7-v1",
        objetivo: "Se hp > 0 execute atacar(); senão (else) execute recuar();.",
        codigoCorreto: "if (hp > 0) { atacar(); } else { recuar(); }",
        blocosCorretos: ["if (hp > 0)", "{ atacar(); }", "else", "{ recuar(); }"],
        conceitoResumo:
          "`else` define o caminho alternativo executado quando a condição do `if` é falsa.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          LOGICA: {
            tituloRegra: "RAMO VERDADEIRO ANTES DO ELSE",
            texto: "O bloco `{ atacar(); }` pertence ao `if (hp > 0)` e `{ recuar(); }` vem depois de `else`.",
            exemploCerto: "if (hp > 0) { atacar(); } else { recuar(); }",
            exemploErro: "if (hp > 0) else { atacar(); }",
          },
          SINTAXE: {
            tituloRegra: "PALAVRA-CHAVE ELSE ENTRE BLOCOS",
            texto: "`else` conecta o primeiro `{ ... }` ao segundo `{ ... }` sem condição própria.",
            exemploCerto: "if (x > 0) { a(); } else { b(); }",
            exemploErro: "else { b(); } if (x > 0) { a(); }",
          },
          METODO: {
            tituloRegra: "MÉTODOS EM CADA RAMO",
            texto: "Primeiro `{ atacar(); }`, depois `else`, depois `{ recuar(); }`.",
            exemploCerto: "if (hp > 0) { atacar(); } else { recuar(); }",
            exemploErro: "if (hp > 0) { recuar(); } else { atacar(); }",
          },
          TIPO_DE_DADO: {
            tituloRegra: "INICIE PELO IF",
            texto: "Comece com `if (hp > 0)` na primeira posição.",
            exemploCerto: "if (hp > 0) { atacar(); } else { recuar(); }",
            exemploErro: "else (hp > 0) { atacar(); }",
          },
        },
      },
      {
        id: "f7-v2",
        objetivo: "Se perto for verdadeiro, golpeie; senão avance com mover();.",
        codigoCorreto: "if (perto) { golpear(); } else { mover(); }",
        blocosCorretos: ["if (perto)", "{ golpear(); }", "else", "{ mover(); }"],
        conceitoResumo:
          "Estruturas `if / else` permitem ao herói escolher entre atacar ou se aproximar conforme a distância.",
        acoesEsperadas: ["MOVER", "ATACAR"],
        dicas: {
          LOGICA: {
            tituloRegra: "CONDIÇÃO PERTO -> GOLPEAR",
            texto: "Quando `perto` é verdadeiro executa `{ golpear(); }`; no `else`, executa `{ mover(); }`.",
            exemploCerto: "if (perto) { golpear(); } else { mover(); }",
            exemploErro: "if (perto) { mover(); } else { golpear(); }",
          },
          SINTAXE: {
            tituloRegra: "BLOCO ELSE",
            texto: "A ordem estrutural é `if (perto)` -> `{ golpear(); }` -> `else` -> `{ mover(); }`.",
            exemploCerto: "if (perto) { golpear(); } else { mover(); }",
            exemploErro: "if (perto) else { golpear(); }",
          },
          METODO: {
            tituloRegra: "AÇÕES EM CHAVES",
            texto: "Cada ação já está dentro de chaves — basta ordenar os 4 blocos.",
            exemploCerto: "if (perto) { golpear(); } else { mover(); }",
            exemploErro: "{ golpear(); } if (perto) else { mover(); }",
          },
          TIPO_DE_DADO: {
            tituloRegra: "BOOLEANO EM IF",
            texto: "`if (perto)` abre a instrução condicional.",
            exemploCerto: "if (perto) { golpear(); } else { mover(); }",
            exemploErro: "else if (perto)",
          },
        },
      },
      {
        id: "f7-v3",
        objetivo: "Se mana >= 5 execute disparar(); senão execute mover();.",
        codigoCorreto: "if (mana >= 5) { disparar(); } else { mover(); }",
        blocosCorretos: ["if (mana >= 5)", "{ disparar(); }", "else", "{ mover(); }"],
        conceitoResumo:
          "Operadores relacionais (`>=`, `<=`, `!=`, `==`) permitem decisões precisas de combate em `if / else`.",
        acoesEsperadas: ["MOVER", "ATACAR"],
        dicas: {
          LOGICA: {
            tituloRegra: "MANA SUFICIENTE DISPARA",
            texto: "Se `mana >= 5` chame `{ disparar(); }`; no `else`, chame `{ mover(); }`.",
            exemploCerto: "if (mana >= 5) { disparar(); } else { mover(); }",
            exemploErro: "if (mana >= 5) { mover(); } else { disparar(); }",
          },
          SINTAXE: {
            tituloRegra: "SINTAXE IF / ELSE",
            texto: "Monte: `if (mana >= 5)` -> `{ disparar(); }` -> `else` -> `{ mover(); }`.",
            exemploCerto: "if (mana >= 5) { disparar(); } else { mover(); }",
            exemploErro: "else { mover(); } if (mana >= 5)",
          },
          METODO: {
            tituloRegra: "BLOCOS DE MÉTODO",
            texto: "`else` sempre fica exatamente entre `{ disparar(); }` e `{ mover(); }`.",
            exemploCerto: "if (mana >= 5) { disparar(); } else { mover(); }",
            exemploErro: "if (mana >= 5) { disparar(); } { mover(); } else",
          },
          TIPO_DE_DADO: {
            tituloRegra: "COMPARAÇÃO RELACIONAL",
            texto: "`if (mana >= 5)` é o cabeçalho inicial da estrutura.",
            exemploCerto: "if (mana >= 5) { disparar(); } else { mover(); }",
            exemploErro: "if (mana = 5) { disparar(); }",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 8,
    topicoJava: "Laço while",
    nivelDificuldade: "INTERMEDIARIO",
    xpRecompensa: 35,
    inimigo: makeEnemy(
      "Espírito do Loop Infinito",
      "Andar 8 • Repetição while",
      "vortex",
      "#8F49E5",
      "Cuidado para não ficar preso para sempre no meu vórtice!"
    ),
    variacoes: [
      {
        id: "f8-v1",
        objetivo: "Enquanto inimigo > 0, execute atacar();.",
        codigoCorreto: "while (inimigo > 0) { atacar(); }",
        blocosCorretos: ["while", "(inimigo > 0)", "{", "atacar();", "}"],
        conceitoResumo:
          "O laço `while (condicao) { ... }` repete o bloco enquanto a condição continuar verdadeira.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          SINTAXE: {
            tituloRegra: "ESTRUTURA DO WHILE",
            texto: "Comece por `while`, depois a condição entre parênteses e o corpo entre `{` e `}`.",
            exemploCerto: "while (hp > 0) { atacar(); }",
            exemploErro: "while hp > 0 { atacar(); }",
          },
          LOGICA: {
            tituloRegra: "CONDIÇÃO DE CONTINUIDADE",
            texto: "`(inimigo > 0)` vem logo após `while` para testar antes de cada ataque.",
            exemploCerto: "while (inimigo > 0) { atacar(); }",
            exemploErro: "while { atacar(); } (inimigo > 0)",
          },
          METODO: {
            tituloRegra: "AÇÃO REPETIDA",
            texto: "`atacar();` precisa estar entre `{` e `}`.",
            exemploCerto: "while (inimigo > 0) { atacar(); }",
            exemploErro: "atacar(); while (inimigo > 0)",
          },
          TIPO_DE_DADO: {
            tituloRegra: "EXPRESSÃO BOOLEANA",
            texto: "Monte: `while` -> `(inimigo > 0)` -> `{` -> `atacar();` -> `}`.",
            exemploCerto: "while (inimigo > 0) { atacar(); }",
            exemploErro: "(inimigo > 0) while { atacar(); }",
          },
        },
      },
      {
        id: "f8-v2",
        objetivo: "Enquanto passos < 3, avance chamando mover();.",
        codigoCorreto: "while (passos < 3) { mover(); }",
        blocosCorretos: ["while", "(passos < 3)", "{", "mover();", "}"],
        conceitoResumo:
          "Usar um contador com `<` no `while` controla quantas vezes o herói se movimenta na arena.",
        acoesEsperadas: ["MOVER", "ATACAR"],
        dicas: {
          SINTAXE: {
            tituloRegra: "CHAVES DO WHILE",
            texto: "Abra `{`, coloque `mover();` dentro e encerre com `}`.",
            exemploCerto: "while (passos < 3) { mover(); }",
            exemploErro: "while (passos < 3) } mover(); {",
          },
          LOGICA: {
            tituloRegra: "ORDEM DO LAÇO",
            texto: "Primeiro `while`, depois `(passos < 3)`, depois `{ mover(); }`.",
            exemploCerto: "while (passos < 3) { mover(); }",
            exemploErro: "(passos < 3) while { mover(); }",
          },
          METODO: {
            tituloRegra: "COMANDO DE MOVIMENTO",
            texto: "`mover();` vai dentro do bloco delimitado pelas chaves.",
            exemploCerto: "while (passos < 3) { mover(); }",
            exemploErro: "while (mover();) { passos < 3 }",
          },
          TIPO_DE_DADO: {
            tituloRegra: "CABEÇALHO WHILE",
            texto: "Palavra-chave `while` inicia a linha.",
            exemploCerto: "while (passos < 3) { mover(); }",
            exemploErro: "While (passos < 3) { mover(); }",
          },
        },
      },
      {
        id: "f8-v3",
        objetivo: "Enquanto alvoAtivo for verdadeiro, dispare com disparar();.",
        codigoCorreto: "while (alvoAtivo) { disparar(); }",
        blocosCorretos: ["while", "(alvoAtivo)", "{", "disparar();", "}"],
        conceitoResumo:
          "Assim como `if`, o laço `while` aceita diretamente uma variável booleana entre parênteses.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          SINTAXE: {
            tituloRegra: "SINTAXE WHILE",
            texto: "Monte: `while` -> `(alvoAtivo)` -> `{` -> `disparar();` -> `}`.",
            exemploCerto: "while (vivo) { disparar(); }",
            exemploErro: "while vivo { disparar(); }",
          },
          LOGICA: {
            tituloRegra: "TESTE NO INÍCIO",
            texto: "A condição `(alvoAtivo)` deve aparecer antes das chaves `{` e `}`.",
            exemploCerto: "while (alvoAtivo) { disparar(); }",
            exemploErro: "while { disparar(); } (alvoAtivo)",
          },
          METODO: {
            tituloRegra: "DISPARO NO CORPO",
            texto: "`disparar();` fica entre `{` e `}`.",
            exemploCerto: "while (alvoAtivo) { disparar(); }",
            exemploErro: "disparar(); while (alvoAtivo)",
          },
          TIPO_DE_DADO: {
            tituloRegra: "CONDIÇÃO BOOLEANA",
            texto: "`while` sempre começa na posição 1.",
            exemploCerto: "while (alvoAtivo) { disparar(); }",
            exemploErro: "(alvoAtivo) while { disparar(); }",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 9,
    topicoJava: "Laço for",
    nivelDificuldade: "INTERMEDIARIO",
    xpRecompensa: 35,
    inimigo: makeEnemy(
      "Esqueleto do For",
      "Andar 9 • Iteração Controlada",
      "skeleton",
      "#B08A6E",
      "Inicialização, condição e incremento — erre um e meus ossos se recompõem!"
    ),
    variacoes: [
      {
        id: "f9-v1",
        objetivo: "Crie um laço for de i = 0 até i < 3 (i++) executando atacar();.",
        codigoCorreto: "for (int i = 0; i < 3; i++) { atacar(); }",
        blocosCorretos: ["for", "(int i = 0;", "i < 3;", "i++)", "{ atacar(); }"],
        conceitoResumo:
          "O laço `for` organiza as 3 partes do contador entre parênteses: `(inicialização; condição; incremento)`.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          SINTAXE: {
            tituloRegra: "AS 3 PARTES DO FOR",
            texto: "Dentro do `for`: 1º `(int i = 0;`, 2º `i < 3;`, 3º `i++)` e por fim `{ atacar(); }`.",
            exemploCerto: "for (int i = 0; i < 3; i++) { atacar(); }",
            exemploErro: "for (i < 3; int i = 0; i++) { atacar(); }",
          },
          LOGICA: {
            tituloRegra: "ORDEM DO CONTADOR",
            texto: "Inicialize `int i = 0;`, verifique `i < 3;` e só depois incremente `i++)`.",
            exemploCerto: "for (int i = 0; i < 3; i++) { atacar(); }",
            exemploErro: "for (i++) (int i = 0; i < 3;)",
          },
          METODO: {
            tituloRegra: "CORPO APÓS PARÊNTESE",
            texto: "`{ atacar(); }` fecha o laço depois de `i++)`.",
            exemploCerto: "for (int i = 0; i < 3; i++) { atacar(); }",
            exemploErro: "for { atacar(); } (int i = 0; i < 3; i++)",
          },
          TIPO_DE_DADO: {
            tituloRegra: "INICIALIZAÇÃO COM INT",
            texto: "`(int i = 0;` declara o índice e abre o parêntese logo após `for`.",
            exemploCerto: "for (int i = 0; i < 3; i++) { atacar(); }",
            exemploErro: "for (i = 0; i < 3; i++)",
          },
        },
      },
      {
        id: "f9-v2",
        objetivo: "Crie um laço for de i = 1 até i <= 5 (i++) executando mover();.",
        codigoCorreto: "for (int i = 1; i <= 5; i++) { mover(); }",
        blocosCorretos: ["for", "(int i = 1;", "i <= 5;", "i++)", "{ mover(); }"],
        conceitoResumo:
          "Com `i <= 5`, o laço inclui o valor 5, executando exatamente 5 iterações de 1 a 5.",
        acoesEsperadas: ["MOVER", "ATACAR"],
        dicas: {
          SINTAXE: {
            tituloRegra: "CABEÇALHO DO FOR",
            texto: "Ordem obrigatória: `for` -> `(int i = 1;` -> `i <= 5;` -> `i++)` -> `{ mover(); }`.",
            exemploCerto: "for (int i = 1; i <= 5; i++) { mover(); }",
            exemploErro: "for (int i = 1; i++) i <= 5;",
          },
          LOGICA: {
            tituloRegra: "CONDIÇÃO NO MEIO",
            texto: "A comparação `i <= 5;` fica sempre entre a inicialização e o incremento `i++)`.",
            exemploCerto: "for (int i = 1; i <= 5; i++) { mover(); }",
            exemploErro: "for (i <= 5; int i = 1; i++)",
          },
          METODO: {
            tituloRegra: "BLOCO FINAL",
            texto: "`{ mover(); }` fica na última posição.",
            exemploCerto: "for (int i = 1; i <= 5; i++) { mover(); }",
            exemploErro: "{ mover(); } for (int i = 1; i <= 5; i++)",
          },
          TIPO_DE_DADO: {
            tituloRegra: "VARIÁVEL DE CONTROLE",
            texto: "`(int i = 1;` vem imediatamente depois de `for`.",
            exemploCerto: "for (int i = 1; i <= 5; i++) { mover(); }",
            exemploErro: "for int i = 1;",
          },
        },
      },
      {
        id: "f9-v3",
        objetivo: "Repita golpear(); 4 vezes com for usando x de 0 até x < 4.",
        codigoCorreto: "for (int x = 0; x < 4; x++) { golpear(); }",
        blocosCorretos: ["for", "(int x = 0;", "x < 4;", "x++)", "{ golpear(); }"],
        conceitoResumo:
          "A variável de controle do `for` pode ter qualquer nome válido (como `i`, `x` ou `turno`).",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          SINTAXE: {
            tituloRegra: "PARÊNTESES DO FOR",
            texto: "`(int x = 0;` abre o parêntese e `x++)` fecha o parêntese antes de `{ golpear(); }`.",
            exemploCerto: "for (int x = 0; x < 4; x++) { golpear(); }",
            exemploErro: "for (x++) (int x = 0; x < 4;)",
          },
          LOGICA: {
            tituloRegra: "SEQUÊNCIA DO LOOP",
            texto: "Início `(int x = 0;` -> Teste `x < 4;` -> Passo `x++)` -> Ação `{ golpear(); }`.",
            exemploCerto: "for (int x = 0; x < 4; x++) { golpear(); }",
            exemploErro: "for (x < 4; int x = 0; x++)",
          },
          METODO: {
            tituloRegra: "AÇÃO DO LOOP",
            texto: "`{ golpear(); }` vem no final da estrutura.",
            exemploCerto: "for (int x = 0; x < 4; x++) { golpear(); }",
            exemploErro: "for { golpear(); }",
          },
          TIPO_DE_DADO: {
            tituloRegra: "DECLARAÇÃO INT X",
            texto: "Comece com `for` e logo depois `(int x = 0;`.",
            exemploCerto: "for (int x = 0; x < 4; x++) { golpear(); }",
            exemploErro: "for (x = 0; x < 4; x++)",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 10,
    topicoJava: "CHEFE • Integrador Java",
    nivelDificuldade: "CHEFE",
    xpRecompensa: 100,
    inimigo: makeEnemy(
      "Dragão da Sintaxe",
      "CHEFE DO CICLO 1 • ANDAR 10",
      "boss_dragon",
      "#CA1C08",
      "Combine variáveis, condicionais e laços! Derrote-me para conquistar o Checkpoint 11!",
      true
    ),
    variacoes: [
      {
        id: "f10-v1",
        objetivo:
          "Declare int golpe = 50; e, se golpe >= 50, avance com mover(); e finalize com atacar();.",
        codigoCorreto: "int golpe = 50; if (golpe >= 50) { mover(); atacar(); }",
        blocosCorretos: [
          "int golpe = 50;",
          "if (golpe >= 50)",
          "{",
          "mover();",
          "atacar();",
          "}",
        ],
        conceitoResumo:
          "Desafio Integrador de Chefe: combinamos declaração de variável `int`, condição `if` e sequência de comandos no mesmo bloco!",
        acoesEsperadas: ["MOVER", "ATACAR"],
        dicas: {
          LOGICA: {
            tituloRegra: "DECLARE ANTES DE TESTAR",
            texto: "Primeiro declare `int golpe = 50;`, depois teste `if (golpe >= 50)` e dentro de `{ ... }` chame `mover();` antes de `atacar();`.",
            exemploCerto: "int golpe = 50; if (golpe >= 50) { mover(); atacar(); }",
            exemploErro: "if (golpe >= 50) { atacar(); } int golpe = 50;",
          },
          SINTAXE: {
            tituloRegra: "BLOCO COM DUAS INSTRUÇÕES",
            texto: "Abra `{` após `if (golpe >= 50)`, coloque `mover();` e `atacar();`, e feche `}` no final.",
            exemploCerto: "if (golpe >= 50) { mover(); atacar(); }",
            exemploErro: "if (golpe >= 50) mover(); atacar(); }",
          },
          METODO: {
            tituloRegra: "SEQUÊNCIA DE AÇÕES DO HERÓI",
            texto: "Primeiro `mover();` para ganhar posição, depois `atacar();` para derrubar o Chefe!",
            exemploCerto: "{ mover(); atacar(); }",
            exemploErro: "{ atacar(); mover(); }",
          },
          TIPO_DE_DADO: {
            tituloRegra: "VARIÁVEL INICIAL",
            texto: "`int golpe = 50;` precisa existir no topo antes do `if` lê-la.",
            exemploCerto: "int golpe = 50; if (golpe >= 50) { ... }",
            exemploErro: "if (golpe >= 50) int golpe = 50;",
          },
        },
      },
      {
        id: "f10-v2",
        objetivo:
          "Repita 3 vezes com for (i de 0 a < 3): se ativo for verdadeiro, execute atacar();.",
        codigoCorreto: "for (int i = 0; i < 3; i++) { if (ativo) { atacar(); } }",
        blocosCorretos: [
          "for (int i = 0; i < 3; i++)",
          "{",
          "if (ativo)",
          "{ atacar(); }",
          "}",
        ],
        conceitoResumo:
          "Aninhamento de estruturas: um `if` dentro de um `for` permite filtrar ações a cada repetição do laço.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          LOGICA: {
            tituloRegra: "IF DENTRO DO FOR",
            texto: "O laço `for (...)` envolve todo o bloco `{ if (ativo) { atacar(); } }`.",
            exemploCerto: "for (int i = 0; i < 3; i++) { if (ativo) { atacar(); } }",
            exemploErro: "if (ativo) for (int i = 0; i < 3; i++)",
          },
          SINTAXE: {
            tituloRegra: "CHAVES ANINHADAS",
            texto: "Abra `{` logo após o `for`, coloque `if (ativo)` + `{ atacar(); }` e feche com `}`.",
            exemploCerto: "for (...) { if (ativo) { atacar(); } }",
            exemploErro: "for (...) } if (ativo) { atacar(); } {",
          },
          METODO: {
            tituloRegra: "ATAQUE CONDICIONAL",
            texto: "`{ atacar(); }` pertence ao `if (ativo)`.",
            exemploCerto: "if (ativo) { atacar(); }",
            exemploErro: "{ atacar(); } if (ativo)",
          },
          TIPO_DE_DADO: {
            tituloRegra: "LAÇO EXTERNO",
            texto: "Comece sempre pelo bloco `for (int i = 0; i < 3; i++)`.",
            exemploCerto: "for (int i = 0; i < 3; i++) { ... }",
            exemploErro: "{ for (int i = 0; i < 3; i++) }",
          },
        },
      },
      {
        id: "f10-v3",
        objetivo:
          "Declare boolean foco = true; e, enquanto foco for verdadeiro, execute disparar(); e encerre com foco = false;.",
        codigoCorreto: "boolean foco = true; while (foco) { disparar(); foco = false; }",
        blocosCorretos: [
          "boolean foco = true;",
          "while (foco)",
          "{",
          "disparar();",
          "foco = false;",
          "}",
        ],
        conceitoResumo:
          "Flags booleanas evitam loops infinitos: alteramos `foco = false;` dentro do `while` após disparar o ataque!",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          LOGICA: {
            tituloRegra: "EVITANDO LOOP INFINITO",
            texto: "Declare `boolean foco = true;`, entre no `while (foco)`, execute `disparar();` e finalize a flag com `foco = false;`.",
            exemploCerto: "boolean foco = true; while (foco) { disparar(); foco = false; }",
            exemploErro: "while (foco) { foco = false; } boolean foco = true;",
          },
          SINTAXE: {
            tituloRegra: "FECHAMENTO DO BLOCO WHILE",
            texto: "`{` abre após `while (foco)` e `}` fecha depois de `foco = false;`.",
            exemploCerto: "while (foco) { disparar(); foco = false; }",
            exemploErro: "while (foco) disparar(); foco = false; }",
          },
          METODO: {
            tituloRegra: "DISPARAR ANTES DE DESLIGAR FLAG",
            texto: "Coloque `disparar();` antes de `foco = false;` dentro das chaves.",
            exemploCerto: "{ disparar(); foco = false; }",
            exemploErro: "{ foco = false; disparar(); }",
          },
          TIPO_DE_DADO: {
            tituloRegra: "DECLARAÇÃO DA FLAG",
            texto: "`boolean foco = true;` vem na primeira posição.",
            exemploCerto: "boolean foco = true; while (foco) { ... }",
            exemploErro: "while (foco) boolean foco = true;",
          },
        },
      },
    ],
  },
  {
    numeroAndar: 11,
    topicoJava: "Ciclo 2 • Arrays Java",
    nivelDificuldade: "INTERMEDIARIO",
    xpRecompensa: 35,
    inimigo: makeEnemy(
      "Guardião de Vetores",
      "Andar 11 • Checkpoint 2",
      "knight",
      "#5A8F49",
      "Bem-vindo ao Ciclo 2! Mostre que domina arrays em Java!"
    ),
    variacoes: [
      {
        id: "f11-v1",
        objetivo: "Declare um array de inteiros chamado runas com os valores {1, 2, 3}.",
        codigoCorreto: "int[] runas = {1, 2, 3};",
        blocosCorretos: ["int[]", "runas", "=", "{1, 2, 3};"],
        conceitoResumo:
          "Arrays em Java usam colchetes `[]` após o tipo (`int[]`) e chaves `{...}` para inicialização literal.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "TIPO ARRAY INT[]",
            texto: "Comece com `int[]` para declarar um vetor de inteiros.",
            exemploCerto: "int[] runas = {1, 2, 3};",
            exemploErro: "int runas = {1, 2, 3};",
          },
          SINTAXE: {
            tituloRegra: "INICIALIZAÇÃO COM CHAVES",
            texto: "Monte: `int[]` -> `runas` -> `=` -> `{1, 2, 3};`.",
            exemploCerto: "int[] runas = {1, 2, 3};",
            exemploErro: "int[] {1, 2, 3}; = runas",
          },
          LOGICA: {
            tituloRegra: "ATRIBUIÇÃO DE VETOR",
            texto: "Nome `runas` à esquerda do `=` e `{1, 2, 3};` à direita.",
            exemploCerto: "int[] runas = {1, 2, 3};",
            exemploErro: "int[] = runas {1, 2, 3};",
          },
          METODO: {
            tituloRegra: "DECLARAÇÃO DE ARRAY",
            texto: "Não há método — apenas `int[] runas = {1, 2, 3};`.",
            exemploCerto: "int[] runas = {1, 2, 3};",
            exemploErro: "int[].runas(1, 2, 3);",
          },
        },
      },
      {
        id: "f11-v2",
        objetivo: 'Declare um array String[] chamado armas contendo {"Espada", "Cajado"}.',
        codigoCorreto: 'String[] armas = {"Espada", "Cajado"};',
        blocosCorretos: ["String[]", "armas", "=", '{"Espada", "Cajado"};'],
        conceitoResumo:
          "`String[]` armazena múltiplos textos ordenados por índice a partir de 0.",
        acoesEsperadas: ["INTERAGIR", "ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "ARRAY DE STRINGS",
            texto: "Inicie com `String[]` com `S` maiúsculo e colchetes.",
            exemploCerto: 'String[] armas = {"Espada", "Cajado"};',
            exemploErro: 'string[] armas = {"Espada", "Cajado"};',
          },
          SINTAXE: {
            tituloRegra: "FECHE COM ;",
            texto: '`{"Espada", "Cajado"};` fecha a instrução na última posição.',
            exemploCerto: 'String[] armas = {"Espada", "Cajado"};',
            exemploErro: 'String[] armas = {"Espada", "Cajado"}',
          },
          LOGICA: {
            tituloRegra: "ORDEM DO ARRAY",
            texto: "Ordem: `String[]` -> `armas` -> `=` -> `{\"Espada\", \"Cajado\"};`.",
            exemploCerto: 'String[] armas = {"Espada", "Cajado"};',
            exemploErro: 'armas String[] = {"Espada", "Cajado"};',
          },
          METODO: {
            tituloRegra: "LITERAL DE VETOR",
            texto: "Use a atribuição direta com `=` e chaves.",
            exemploCerto: 'String[] armas = {"Espada", "Cajado"};',
            exemploErro: 'String[].of("Espada", "Cajado");',
          },
        },
      },
      {
        id: "f11-v3",
        objetivo: "Guarde o tamanho do array runas na variável inteira tam usando runas.length.",
        codigoCorreto: "int tam = runas.length;",
        blocosCorretos: ["int", "tam", "=", "runas.length;"],
        conceitoResumo:
          "A propriedade `.length` (sem parênteses!) retorna a quantidade de elementos de um array em Java.",
        acoesEsperadas: ["ATACAR"],
        dicas: {
          TIPO_DE_DADO: {
            tituloRegra: "TAMANHO É INT",
            texto: "`runas.length` retorna um número inteiro, então comece com `int`.",
            exemploCerto: "int tam = runas.length;",
            exemploErro: "double tam = runas.length;",
          },
          METODO: {
            tituloRegra: "PROPRIEDADE .LENGTH",
            texto: "Em arrays, `runas.length;` fica à direita do `=` e não leva parênteses.",
            exemploCerto: "int tam = runas.length;",
            exemploErro: "int tam = runas.length();",
          },
          SINTAXE: {
            tituloRegra: "ORDEM DA INSTRUÇÃO",
            texto: "Monte: `int` -> `tam` -> `=` -> `runas.length;`.",
            exemploCerto: "int tam = runas.length;",
            exemploErro: "int = tam runas.length;",
          },
          LOGICA: {
            tituloRegra: "ATRIBUIÇÃO DO TAMANHO",
            texto: "`tam` recebe o valor de `runas.length;`.",
            exemploCerto: "int tam = runas.length;",
            exemploErro: "runas.length; = int tam",
          },
        },
      },
    ],
  },
];

export function getFloorBlueprint(numeroAndar: number): FloorBlueprint {
  const exact = FLOORS_CATALOG.find((f) => f.numeroAndar === numeroAndar);
  if (exact) {
    return exact;
  }
  // Extensibilidade (RNF-27): caso avancem para andares futuros (12+), recicla dinamicamente mantendo o número do andar
  const normalized = ((numeroAndar - 1) % 10) + 1;
  const fallback = FLOORS_CATALOG.find((f) => f.numeroAndar === normalized) ?? FLOORS_CATALOG[0];
  return {
    ...fallback,
    numeroAndar,
    inimigo: {
      ...fallback.inimigo,
      titulo:
        numeroAndar % 10 === 0
          ? `CHEFE DO CICLO ${Math.ceil(numeroAndar / 10)} • ANDAR ${numeroAndar}`
          : `Andar ${numeroAndar} • Ciclo ${Math.ceil(numeroAndar / 10)}`,
    },
  };
}
