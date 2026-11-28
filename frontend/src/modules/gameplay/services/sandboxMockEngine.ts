import {
  ChallengeVariationBlueprint,
  getFloorBlueprint,
} from "../data/challengesCatalog";
import {
  BlocoCodigo,
  CategoriaErro,
  DesafioAndar,
  DicaPedagogica,
  ProgressoJogadorDTO,
  ResultadoTurnoDTO,
  SubmissaoCodigoResultado,
  TipoAcaoHeroi,
  TipoArmamento,
} from "../types/gameplay";

const MAX_VIDAS = 3;
const MAX_DICAS = 3;
const INTERVALO_CHECKPOINT = 10;

interface SandboxSessionState {
  progresso: ProgressoJogadorDTO;
  /** Última variação usada em cada andar para garantir RF-21 (variação diferente após derrota) */
  ultimaVariacaoPorAndar: Record<number, number>;
  desafioAtivo: DesafioAndar | null;
  blueprintAtivo: ChallengeVariationBlueprint | null;
  tempoTotalSessaoSegundos: number;
  tempoAndarAtualSegundos: number;
}

const sessions = new Map<string, SandboxSessionState>();

function sanitizeCode(raw: string): string {
  return raw.replace(/\u0000/g, "").trim();
}

function countBalance(text: string, openChar: string, closeChar: string): number {
  let balance = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === openChar) balance++;
    else if (ch === closeChar) {
      balance--;
      if (balance < 0) return balance;
    }
  }
  return balance;
}

/**
 * Espelha ValidacaoJavaService.extrairAcoes() do backend Java.
 */
function extrairAcoesDoCodigo(codigo: string, fallback: TipoAcaoHeroi[]): TipoAcaoHeroi[] {
  const lower = codigo.toLowerCase();
  const acoes: TipoAcaoHeroi[] = [];

  if (lower.includes("mover") || lower.includes("andar") || lower.includes("avancar") || lower.includes("recuar")) {
    acoes.push("MOVER");
  }
  if (lower.includes("interagir") || lower.includes("pegar") || lower.includes("abrir")) {
    acoes.push("INTERAGIR");
  }
  if (lower.includes("atacar") || lower.includes("golpear") || lower.includes("disparar")) {
    acoes.push("ATACAR");
  }

  return acoes.length > 0 ? acoes : [...fallback];
}

/**
 * Embaralha garantindo que a sequência nunca comece já na ordem correta.
 */
function shuffleGuaranteeDifferent(blocosCorretos: string[]): BlocoCodigo[] {
  const items: BlocoCodigo[] = blocosCorretos.map((texto, idx) => ({
    id: `blk-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    texto,
  }));

  if (items.length <= 1) return items;

  for (let tries = 0; tries < 10; tries++) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    const stillEqual = items.every((item, idx) => item.texto === blocosCorretos[idx]);
    if (!stillEqual) return items;
  }

  // Fallback determinístico: rotaciona 1 posição
  const first = items.shift();
  if (first) items.push(first);
  return items;
}

function classificarErroJava(
  blocosEnviados: string[],
  blocosCorretos: string[],
  codigoMontado: string
): { categoria: CategoriaErro; diagnostico: string; sintaxeValida: boolean } {
  if (blocosEnviados.length < blocosCorretos.length) {
    return {
      categoria: "SINTAXE",
      diagnostico: `Código incompleto: faltam ${blocosCorretos.length - blocosEnviados.length} bloco(s) para fechar a instrução Java.`,
      sintaxeValida: false,
    };
  }

  const chaves = countBalance(codigoMontado, "{", "}");
  const parenteses = countBalance(codigoMontado, "(", ")");
  const colchetes = countBalance(codigoMontado, "[", "]");

  if (chaves !== 0 || parenteses !== 0 || colchetes !== 0) {
    return {
      categoria: "SINTAXE",
      diagnostico: "Parênteses, chaves ou colchetes fora de ordem ou desbalanceados.",
      sintaxeValida: false,
    };
  }

  const firstExpected = blocosCorretos[0];
  const firstSent = blocosEnviados[0];
  const primitiveTypes = ["int", "double", "boolean", "String", "int[]", "String[]"];

  if (
    primitiveTypes.some((t) => firstExpected.startsWith(t)) &&
    !primitiveTypes.some((t) => firstSent.startsWith(t))
  ) {
    return {
      categoria: "TIPO_DE_DADO",
      diagnostico: `Em Java, declarações começam pelo tipo de dado (esperado "${firstExpected}" no início).`,
      sintaxeValida: false,
    };
  }

  if (
    codigoMontado.includes("println") ||
    codigoMontado.includes("();") ||
    codigoMontado.includes(".length")
  ) {
    const methodIndexExpected = blocosCorretos.findIndex(
      (b) => b.includes("println") || b.includes("();") || b.includes(".length")
    );
    const methodIndexSent = blocosEnviados.findIndex(
      (b) => b.includes("println") || b.includes("();") || b.includes(".length")
    );
    if (methodIndexExpected !== -1 && methodIndexExpected !== methodIndexSent) {
      return {
        categoria: "METODO",
        diagnostico: "A invocação do método ou propriedade está fora da posição esperada no bloco.",
        sintaxeValida: false,
      };
    }
  }

  const lastExpected = blocosCorretos[blocosCorretos.length - 1];
  const lastSent = blocosEnviados[blocosEnviados.length - 1];
  if ((lastExpected.endsWith(";") || lastExpected.endsWith("}")) && lastSent !== lastExpected) {
    return {
      categoria: "SINTAXE",
      diagnostico: `O fechamento da instrução está incorreto — verifique onde deve ficar "${lastExpected}".`,
      sintaxeValida: false,
    };
  }

  return {
    categoria: "LOGICA",
    diagnostico: "A sequência lógica dos blocos não atinge o objetivo do andar. Revise a ordem das expressões.",
    sintaxeValida: true,
  };
}

function getOrCreateSession(
  email: string,
  defaults?: {
    apelido?: string;
    andarAtual?: number;
    checkpointAtual?: number;
    armamentoAtual?: TipoArmamento;
    xpTotal?: number;
    streakDias?: number;
  }
): SandboxSessionState {
  const existing = sessions.get(email);
  if (existing) {
    return existing;
  }

  const checkpoint = defaults?.checkpointAtual ?? 1;
  const andar = defaults?.andarAtual ?? checkpoint;

  const created: SandboxSessionState = {
    progresso: {
      email,
      apelido: defaults?.apelido ?? "HEROI",
      nivelExperiencia: "INICIANTE",
      armamentoAtual: defaults?.armamentoAtual ?? "ESPADA",
      andarAtual: andar,
      checkpointAtual: checkpoint,
      vidasRestantes: MAX_VIDAS,
      dicasRestantes: MAX_DICAS,
      andarEmAndamento: false,
      xpTotal: defaults?.xpTotal ?? 0,
      streakDias: defaults?.streakDias ?? 1,
      andaresConcluidosNoCiclo: [],
      vidasGastasNoCiclo: 0,
      dicasUsadasNoCiclo: 0,
    },
    ultimaVariacaoPorAndar: {},
    desafioAtivo: null,
    blueprintAtivo: null,
    tempoTotalSessaoSegundos: 0,
    tempoAndarAtualSegundos: 0,
  };

  sessions.set(email, created);
  return created;
}

/**
 * Motor Sandbox local que replica integralmente as regras de negócio dos
 * `@services` Java para execução 100% jogável offline/standalone.
 */
export const sandboxMockEngine = {
  initSession(params: {
    email: string;
    apelido: string;
    andarInicial: number;
    checkpointInicial: number;
    armamentoInicial: TipoArmamento;
    xpInicial: number;
    streakInicial: number;
    forceReset?: boolean;
  }): ProgressoJogadorDTO {
    if (params.forceReset) {
      sessions.delete(params.email);
    }
    const session = getOrCreateSession(params.email, {
      apelido: params.apelido,
      andarAtual: params.andarInicial,
      checkpointAtual: params.checkpointInicial,
      armamentoAtual: params.armamentoInicial,
      xpTotal: params.xpInicial,
      streakDias: params.streakInicial,
    });
    return { ...session.progresso };
  },

  getProgresso(email: string): ProgressoJogadorDTO {
    return { ...getOrCreateSession(email).progresso };
  },

  sortearDesafioDoAndar(
    email: string,
    numeroAndar?: number,
    evitarVariacaoAnterior = true
  ): { desafio: DesafioAndar; progresso: ProgressoJogadorDTO } {
    const session = getOrCreateSession(email);
    const andarAlvo = numeroAndar ?? session.progresso.andarAtual;
    const floorBlueprint = getFloorBlueprint(andarAlvo);

    const lastIdx = session.ultimaVariacaoPorAndar[andarAlvo];
    const indicesDisponiveis = floorBlueprint.variacoes
      .map((_, i) => i)
      .filter((i) => !evitarVariacaoAnterior || floorBlueprint.variacoes.length <= 1 || i !== lastIdx);

    const chosenIdx =
      indicesDisponiveis[Math.floor(Math.random() * indicesDisponiveis.length)] ?? 0;
    const blueprint = floorBlueprint.variacoes[chosenIdx];

    session.ultimaVariacaoPorAndar[andarAlvo] = chosenIdx;
    session.progresso.andarAtual = andarAlvo;
    session.progresso.andarEmAndamento = true;

    const desafio: DesafioAndar = {
      id: `${blueprint.id}-${Date.now()}`,
      numeroAndar: andarAlvo,
      variacaoIndex: chosenIdx,
      topicoJava: floorBlueprint.topicoJava,
      nivelDificuldade: floorBlueprint.nivelDificuldade,
      objetivo: blueprint.objetivo,
      conceitoResumo: blueprint.conceitoResumo,
      codigoCorreto: blueprint.codigoCorreto,
      blocosCorretos: [...blueprint.blocosCorretos],
      blocosEmbaralhados: shuffleGuaranteeDifferent(blueprint.blocosCorretos),
      inimigo: { ...floorBlueprint.inimigo },
      xpRecompensa: floorBlueprint.xpRecompensa,
      acoesEsperadas: [...blueprint.acoesEsperadas],
    };

    session.desafioAtivo = desafio;
    session.blueprintAtivo = blueprint;

    return {
      desafio,
      progresso: { ...session.progresso },
    };
  },

  processarTurno(
    email: string,
    blocosMontados: string[]
  ): { resultado: ResultadoTurnoDTO; progresso: ProgressoJogadorDTO } {
    const t0 = performance.now();
    const session = getOrCreateSession(email);
    const desafio = session.desafioAtivo;

    if (!desafio) {
      throw new Error("Nenhum desafio ativo para processar o turno.");
    }

    const blocosSanitizados = blocosMontados.map(sanitizeCode).filter(Boolean);
    const codigoMontado = blocosSanitizados.join(" ");

    const ehCorreta =
      blocosSanitizados.length === desafio.blocosCorretos.length &&
      blocosSanitizados.every((blk, i) => blk === desafio.blocosCorretos[i]);

    const latenciaMs = Math.max(1, Math.round(performance.now() - t0));

    if (ehCorreta) {
      const acoes = extrairAcoesDoCodigo(codigoMontado, desafio.acoesEsperadas);
      const submissao: SubmissaoCodigoResultado = {
        codigoJava: desafio.codigoCorreto,
        sintaxeValida: true,
        objetivoAtingido: true,
        ehCorreta: true,
        diagnostico: `Compilação válida em ${latenciaMs}ms! Comandos traduzidos: ${acoes.join(" → ")}.`,
        acoes,
        latenciaMs,
      };

      const andarConcluido = desafio.numeroAndar;
      if (!session.progresso.andaresConcluidosNoCiclo.includes(andarConcluido)) {
        session.progresso.andaresConcluidosNoCiclo = [
          ...session.progresso.andaresConcluidosNoCiclo,
          andarConcluido,
        ];
      }

      session.progresso.xpTotal += desafio.xpRecompensa;
      session.progresso.andarAtual = andarConcluido + 1;
      session.progresso.andarEmAndamento = false;

      // RF-10 & RF-15: vencer o 10º andar de um ciclo (10, 20, 30...) desbloqueia checkpoint permanente (11, 21, 31...) e restaura 3/3 vidas e 3/3 dicas!
      const ehAndarDeChefeCheckpoint =
        andarConcluido > 0 && andarConcluido % INTERVALO_CHECKPOINT === 0;

      let checkpointRegistrado = false;
      let novoCheckpointAndar: number | undefined;

      if (ehAndarDeChefeCheckpoint) {
        novoCheckpointAndar = andarConcluido + 1;
        session.progresso.checkpointAtual = novoCheckpointAndar;
        session.progresso.vidasRestantes = MAX_VIDAS;
        session.progresso.dicasRestantes = MAX_DICAS;
        session.progresso.andaresConcluidosNoCiclo = [];
        session.progresso.vidasGastasNoCiclo = 0;
        session.progresso.dicasUsadasNoCiclo = 0;
        checkpointRegistrado = true;
      }

      const resultado: ResultadoTurnoDTO = {
        vitoriaTurno: true,
        submissao,
        vidasRestantes: session.progresso.vidasRestantes,
        dicasRestantes: session.progresso.dicasRestantes,
        andarAtual: session.progresso.andarAtual,
        checkpointAtual: session.progresso.checkpointAtual,
        reiniciouNoCheckpoint: false,
        checkpointRegistrado,
        novoCheckpointAndar,
        xpGanho: desafio.xpRecompensa,
        mensagem: checkpointRegistrado
          ? `Chefe derrotado! Checkpoint ${novoCheckpointAndar} desbloqueado e recursos restaurados (3/3 vidas e 3/3 dicas).`
          : `Turno vencido! ${desafio.inimigo.nome} derrotado (+${desafio.xpRecompensa} XP).`,
      };

      return { resultado, progresso: { ...session.progresso } };
    }

    // Erro: desconta 1 vida e aciona contra-ataque do inimigo (RF-13)
    const analiseErro = classificarErroJava(
      blocosSanitizados,
      desafio.blocosCorretos,
      codigoMontado
    );

    const submissao: SubmissaoCodigoResultado = {
      codigoJava: codigoMontado,
      sintaxeValida: analiseErro.sintaxeValida,
      objetivoAtingido: false,
      ehCorreta: false,
      categoriaErro: analiseErro.categoria,
      diagnostico: analiseErro.diagnostico,
      acoes: [],
      latenciaMs,
    };

    session.progresso.vidasRestantes = Math.max(0, session.progresso.vidasRestantes - 1);
    session.progresso.vidasGastasNoCiclo += 1;

    const semVidas = session.progresso.vidasRestantes <= 0;

    if (semVidas) {
      // RF-11: retorna exatamente ao andar inicial do último checkpoint desbloqueado
      const retornoAndar = session.progresso.checkpointAtual || 1;
      session.progresso.andarAtual = retornoAndar;
      session.progresso.andarEmAndamento = false;
      session.progresso.andaresConcluidosNoCiclo = [];

      const resultado: ResultadoTurnoDTO = {
        vitoriaTurno: false,
        submissao,
        vidasRestantes: 0,
        dicasRestantes: session.progresso.dicasRestantes,
        andarAtual: retornoAndar,
        checkpointAtual: session.progresso.checkpointAtual,
        reiniciouNoCheckpoint: true,
        checkpointRegistrado: false,
        xpGanho: 0,
        mensagem: `0 vidas restantes! Seu progresso neste ciclo será reiniciado no Checkpoint (Andar ${retornoAndar}) com novos desafios.`,
      };

      return { resultado, progresso: { ...session.progresso } };
    }

    const resultado: ResultadoTurnoDTO = {
      vitoriaTurno: false,
      submissao,
      vidasRestantes: session.progresso.vidasRestantes,
      dicasRestantes: session.progresso.dicasRestantes,
      andarAtual: session.progresso.andarAtual,
      checkpointAtual: session.progresso.checkpointAtual,
      reiniciouNoCheckpoint: false,
      checkpointRegistrado: false,
      xpGanho: 0,
      mensagem: `${desafio.inimigo.nome} contra-atacou! Você perdeu 1 vida (${session.progresso.vidasRestantes}/3 restantes).`,
    };

    return { resultado, progresso: { ...session.progresso } };
  },

  solicitarDica(
    email: string,
    categoriaErro: CategoriaErro
  ): { dica: DicaPedagogica; progresso: ProgressoJogadorDTO } {
    const session = getOrCreateSession(email);

    if (session.progresso.dicasRestantes <= 0) {
      throw new Error("Limite de 3 dicas por ciclo atingido.");
    }

    const blueprint = session.blueprintAtivo;
    const template = blueprint?.dicas[categoriaErro] ?? {
      tituloRegra: "REVISE A SINTAXE JAVA",
      texto: "Verifique o tipo da declaração, a ordem dos blocos e o ponto e vírgula `;` final.",
      exemploCerto: "int vida = 100;",
      exemploErro: "int vida = 100",
    };

    session.progresso.dicasRestantes -= 1;
    session.progresso.dicasUsadasNoCiclo += 1;

    const dica: DicaPedagogica = {
      texto: template.texto,
      categoriaErro,
      tituloRegra: template.tituloRegra,
      exemploCerto: template.exemploCerto,
      exemploErro: template.exemploErro,
      dicasRestantes: session.progresso.dicasRestantes,
    };

    return { dica, progresso: { ...session.progresso } };
  },

  retomarDoUltimoCheckpoint(email: string): ProgressoJogadorDTO {
    const session = getOrCreateSession(email);
    session.progresso.andarAtual = session.progresso.checkpointAtual || 1;
    session.progresso.vidasRestantes = MAX_VIDAS;
    session.progresso.dicasRestantes = MAX_DICAS;
    session.progresso.andarEmAndamento = false;
    session.progresso.andaresConcluidosNoCiclo = [];
    session.progresso.vidasGastasNoCiclo = 0;
    session.progresso.dicasUsadasNoCiclo = 0;
    return { ...session.progresso };
  },

  trocarArmamento(email: string, novoArmamento: TipoArmamento): ProgressoJogadorDTO {
    const session = getOrCreateSession(email);
    if (session.progresso.andarEmAndamento) {
      throw new Error("RF-08: Não é permitido trocar de arma no meio de um andar ativo.");
    }
    session.progresso.armamentoAtual = novoArmamento;
    return { ...session.progresso };
  },

  registrarTempo(email: string, deltaSessaoSegundos: number, tempoAndarSegundos: number): void {
    const session = getOrCreateSession(email);
    session.tempoTotalSessaoSegundos += Math.max(0, deltaSessaoSegundos);
    session.tempoAndarAtualSegundos = Math.max(0, tempoAndarSegundos);
  },
};
