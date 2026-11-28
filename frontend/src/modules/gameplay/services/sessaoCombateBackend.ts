import {
  AberturaAndarArenaSupabase,
  EstadoTentativaCicloAtual,
  ResultadoPreparacaoCiclo,
  ResultadoSubmissaoArenaSupabase,
} from "@api/backendTypes";
import { gameplayApiClient } from "./apiClient";
import {
  andarCheckpointDoCiclo,
  armamentoParaTela,
  cicloDoAndar,
} from "@api/mapeadores";
import { getFloorBlueprint } from "../data/challengesCatalog";
import {
  BlocoCodigo,
  CategoriaErro,
  DesafioAndar,
  NivelExperiencia,
  ProgressoJogadorDTO,
  ResultadoTurnoDTO,
  TipoAcaoHeroi,
  TipoArmamento,
} from "../types/gameplay";

/**
 * Estado da run (tentativa de ciclo) aberta no backend Spring Boot.
 *
 * O backend trabalha com ids (run -> tentativa de andar -> submissão); as telas
 * trabalham com número do andar. Este módulo guarda os ids entre as chamadas e
 * converte as respostas Java para os DTOs que a arena já usa, para não mexer
 * nos componentes.
 */
interface EstadoSessaoCombate {
  /** true no modo Sandbox (sem backend) ou no Treino Livre (só existe no front). */
  usarSandbox: boolean;
  email: string;
  apelido: string;
  nivelExperiencia: NivelExperiencia;
  xpTotal: number;
  streakDias: number;
  armamento: TipoArmamento;
  runId?: string;
  statusRun?: string;
  numeroCiclo: number;
  andarAtual: number;
  checkpointAtual: number;
  vidas: number;
  dicas: number;
  attemptId?: string;
  lacunas: string[];
  ultimaSubmissaoId?: string;
  ultimaCategoriaErro?: CategoriaErro;
  vidasGastasNoCiclo: number;
  dicasUsadasNoCiclo: number;
  andaresConcluidosNoCiclo: number[];
}

const estado: EstadoSessaoCombate = {
  usarSandbox: true,
  email: "",
  apelido: "HEROI",
  nivelExperiencia: "INICIANTE",
  xpTotal: 0,
  streakDias: 1,
  armamento: "ESPADA",
  numeroCiclo: 1,
  andarAtual: 1,
  checkpointAtual: 1,
  vidas: 3,
  dicas: 3,
  lacunas: [],
  vidasGastasNoCiclo: 0,
  dicasUsadasNoCiclo: 0,
  andaresConcluidosNoCiclo: [],
};

function trocarTextoLacunas(template: string): string {
  return template.replace(/\{\{\s*[A-Z0-9_]+\s*\}\}/g, "___");
}

export const sessaoCombateBackend = {
  estado,

  /** Usa o backend quando a API está configurada e não é Treino Livre. */
  configurar(opcoes: {
    email: string;
    apelido: string;
    armamento: TipoArmamento;
    xpTotal: number;
    streakDias: number;
    andarInicial: number;
    checkpointInicial: number;
    modoTreino: boolean;
  }): void {
    estado.usarSandbox = !gameplayApiClient.isApiMode() || opcoes.modoTreino;
    estado.email = opcoes.email;
    estado.apelido = opcoes.apelido;
    estado.armamento = opcoes.armamento;
    estado.xpTotal = opcoes.xpTotal;
    estado.streakDias = opcoes.streakDias;
    estado.andarAtual = opcoes.andarInicial;
    estado.checkpointAtual = opcoes.checkpointInicial;
    estado.numeroCiclo = cicloDoAndar(opcoes.andarInicial);
    estado.runId = undefined;
    estado.attemptId = undefined;
    estado.ultimaSubmissaoId = undefined;
  },

  usarSandbox(): boolean {
    return estado.usarSandbox;
  },

  progresso(): ProgressoJogadorDTO {
    return {
      email: estado.email,
      apelido: estado.apelido,
      nivelExperiencia: estado.nivelExperiencia,
      armamentoAtual: estado.armamento,
      andarAtual: estado.andarAtual,
      checkpointAtual: estado.checkpointAtual,
      vidasRestantes: estado.vidas,
      dicasRestantes: estado.dicas,
      // RF-08: a arma trava quando a run sai de PREPARING
      andarEmAndamento: estado.statusRun === "ACTIVE",
      xpTotal: estado.xpTotal,
      streakDias: estado.streakDias,
      andaresConcluidosNoCiclo: [...estado.andaresConcluidosNoCiclo],
      vidasGastasNoCiclo: estado.vidasGastasNoCiclo,
      dicasUsadasNoCiclo: estado.dicasUsadasNoCiclo,
    };
  },

  aplicarRunAberta(run: EstadoTentativaCicloAtual): void {
    estado.runId = run.identificadorTentativaCiclo;
    estado.statusRun = run.statusTentativaCiclo;
    estado.numeroCiclo = run.numeroCiclo;
    estado.andarAtual = run.numeroAndarAtual;
    estado.checkpointAtual = Math.max(estado.checkpointAtual, run.andarCheckpointDoCiclo);
    estado.vidas = run.quantidadeVidasRestantes;
    estado.dicas = run.quantidadeDicasRestantes;
    estado.armamento = armamentoParaTela(run.codigoArmamentoFixo, estado.armamento);
  },

  aplicarRunPreparada(run: ResultadoPreparacaoCiclo): void {
    estado.runId = run.identificadorTentativaCiclo;
    estado.statusRun = run.statusTentativaCiclo;
    estado.numeroCiclo = run.numeroCiclo;
    estado.andarAtual = run.andarInicialDoCiclo;
    estado.vidas = run.quantidadeVidasIniciais;
    estado.dicas = run.quantidadeDicasIniciais;
    estado.armamento = armamentoParaTela(run.codigoArmamentoSelecionado, estado.armamento);
    estado.attemptId = undefined;
    estado.ultimaSubmissaoId = undefined;
    estado.vidasGastasNoCiclo = 0;
    estado.dicasUsadasNoCiclo = 0;
    estado.andaresConcluidosNoCiclo = [];
  },

  encerrarRun(): void {
    estado.runId = undefined;
    estado.statusRun = undefined;
    estado.attemptId = undefined;
  },

  /** AberturaAndarArenaSupabase -> DesafioAndar (formato já usado pela arena). */
  aplicarAbertura(abertura: AberturaAndarArenaSupabase): DesafioAndar {
    const publico = abertura.desafioPublicoEmbaralhado;
    const numeroAndar = abertura.numeroAndarNaTorre;
    // Visual do inimigo (arquétipo, cor, fala) continua do catálogo do front
    const blueprint = getFloorBlueprint(numeroAndar);
    const inimigoBanco = abertura.inimigosDoAndar?.find((i) => i.inimigoEhChefe === abertura.andarDeChefe)
      ?? abertura.inimigosDoAndar?.[0];

    estado.runId = abertura.identificadorTentativaCiclo;
    estado.statusRun = "ACTIVE";
    estado.attemptId = abertura.identificadorTentativaAndar;
    estado.lacunas = publico.identificadoresLacunasOrdenados ?? [];
    estado.andarAtual = numeroAndar;
    estado.numeroCiclo = cicloDoAndar(numeroAndar);
    estado.vidas = abertura.quantidadeVidasRestantes;
    estado.dicas = abertura.quantidadeDicasRestantes;
    estado.armamento = armamentoParaTela(abertura.codigoArmamentoFixoDaRun, estado.armamento);
    estado.ultimaSubmissaoId = undefined;
    estado.ultimaCategoriaErro = undefined;

    const blocos: BlocoCodigo[] = (publico.blocosDisponiveisEmbaralhados ?? []).map((b) => ({
      id: b.codigoIdentificadorBloco,
      texto: b.textoCodigoBloco,
    }));

    const template = publico.templateCodigoComLacunasResolvido ?? "";
    // O código com as lacunas vai inteiro para o painel de montagem (templateCodigo)
    const objetivo = publico.enunciadoDesafioResolvido;

    return {
      id: `${publico.chaveVarianteNoAndar}:${abertura.identificadorTentativaAndar}`,
      numeroAndar,
      variacaoIndex: 0,
      topicoJava: publico.tituloTemaPedagogico || blueprint.topicoJava,
      nivelDificuldade: abertura.andarDeChefe ? "CHEFE" : blueprint.nivelDificuldade,
      objetivo,
      conceitoResumo: publico.tituloTemaPedagogico || blueprint.topicoJava,
      // Atualizado com o código final validado pelo backend após o acerto
      codigoCorreto: trocarTextoLacunas(template),
      // O gabarito fica no servidor; aqui só a quantidade de lacunas (usada no "tudo posicionado")
      blocosCorretos: estado.lacunas.map(() => ""),
      blocosEmbaralhados: blocos,
      templateCodigo: template || undefined,
      lacunas: template ? [...estado.lacunas] : undefined,
      inimigo: {
        ...blueprint.inimigo,
        nome: inimigoBanco?.nomeInimigo || blueprint.inimigo.nome,
        ehChefe: abertura.andarDeChefe,
        hpMaximo: abertura.andarDeChefe ? 300 : blueprint.inimigo.hpMaximo,
      },
      // PRÓXIMA ATUALIZAÇÃO NO BACK: XP por andar (hoje vem do catálogo do front)
      xpRecompensa: blueprint.xpRecompensa,
      acoesEsperadas: ["ATACAR"],
    };
  },

  /** Bloco de cada posição de lacuna ("" = vazia) -> { LACUNA_1: BLOCO_x, ... } */
  montarEscolhasPorLacuna(idsBlocosNaOrdem: string[]): Record<string, string> {
    const escolhas: Record<string, string> = {};
    estado.lacunas.forEach((lacuna, i) => {
      const id = idsBlocosNaOrdem[i];
      if (id) escolhas[lacuna] = id;
    });
    return escolhas;
  },

  /** ResultadoSubmissaoArenaSupabase -> ResultadoTurnoDTO (formato já usado pela arena). */
  aplicarSubmissao(res: ResultadoSubmissaoArenaSupabase, xpRecompensa: number): ResultadoTurnoDTO {
    const correta = res.resultadoExecucao === "CORRETA";
    const andarDaTentativa = estado.andarAtual;
    const vidasAntes = estado.vidas;
    const categoria = (res.categoriaErroDetectada ?? undefined) as CategoriaErro | undefined;

    estado.ultimaSubmissaoId = res.identificadorSubmissaoCriada;
    estado.ultimaCategoriaErro = categoria;
    estado.statusRun = res.statusRunAtualizado;
    estado.vidas = res.quantidadeVidasRestantes;
    estado.dicas = res.quantidadeDicasRestantes;
    estado.vidasGastasNoCiclo += Math.max(0, vidasAntes - res.quantidadeVidasRestantes);
    estado.checkpointAtual = Math.max(estado.checkpointAtual, res.andarMaiorCheckpoint);

    let andarAtual = res.proximoAndarDaRun;
    let novoCheckpointAndar: number | undefined;

    if (correta) {
      estado.xpTotal += xpRecompensa;
      if (!estado.andaresConcluidosNoCiclo.includes(andarDaTentativa)) {
        estado.andaresConcluidosNoCiclo.push(andarDaTentativa);
      }
    }

    if (res.statusRunAtualizado === "WON") {
      // Chefe vencido: a run fecha e o próximo ciclo começa no checkpoint seguinte (11, 21...)
      novoCheckpointAndar = andarCheckpointDoCiclo(cicloDoAndar(andarDaTentativa) + 1);
      andarAtual = novoCheckpointAndar;
      this.encerrarRun();
    } else if (res.tentativaCicloDerrotada || res.statusRunAtualizado === "DEFEATED") {
      andarAtual = res.andarCheckpointDeReinicio;
      this.encerrarRun();
    }
    estado.andarAtual = andarAtual;

    const acoes: TipoAcaoHeroi[] = (res.acoesHeroiNaArena ?? []).map((a) => a.tipo);

    return {
      vitoriaTurno: correta,
      submissao: {
        codigoJava: res.codigoJavaMontadoFinal ?? "",
        sintaxeValida: categoria !== "SINTAXE",
        objetivoAtingido: correta,
        ehCorreta: correta,
        categoriaErro: categoria,
        diagnostico: res.mensagemFeedback ?? (correta ? "Código correto!" : "Código incorreto."),
        acoes: acoes.length > 0 ? acoes : correta ? ["ATACAR"] : [],
        latenciaMs: 0,
      },
      vidasRestantes: res.quantidadeVidasRestantes,
      dicasRestantes: res.quantidadeDicasRestantes,
      andarAtual,
      checkpointAtual: estado.checkpointAtual,
      reiniciouNoCheckpoint: res.tentativaCicloDerrotada,
      checkpointRegistrado: res.statusRunAtualizado === "WON",
      novoCheckpointAndar,
      xpGanho: correta ? xpRecompensa : 0,
      mensagem: res.mensagemFeedback ?? "",
    };
  },
};
