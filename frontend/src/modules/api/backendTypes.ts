/**
 * Espelho dos records Java devolvidos pelos @RestController do Spring Boot
 * (`/api/v1`). Os nomes dos campos são exatamente os dos records — o Jackson
 * serializa records com os nomes dos componentes.
 *
 * Fonte: src/main/java/com/javaquest/{controller,service,repository,dominio}.
 */

export type CodigoArmamentoBanco = "SWORD" | "STAFF";

export type StatusTentativaCiclo = "PREPARING" | "ACTIVE" | "WON" | "DEFEATED" | "ABANDONED";

export type CategoriaErroBackend = "SINTAXE" | "LOGICA" | "METODO" | "TIPO_DE_DADO";

export type ResultadoExecucaoSubmissao = "CORRETA" | "INCORRETA" | "ERRO_TECNICO";

/* ---------- repository records ---------- */

export interface RegistroPerfilComProgresso {
  identificadorUnicoJogador: string;
  apelidoHeroi: string | null;
  nivelExperienciaBanco: string | null;
  canalAquisicaoBanco: string | null;
  codigoAparencia2D: string | null;
  codigoArmamentoPreferido: string | null;
  dataConclusaoOnboarding: string | null;
  maiorCicloDesbloqueado: number;
}

export interface RegistroTentativaCiclo {
  identificadorTentativaCiclo: string;
  identificadorUnicoJogador: string;
  numeroCiclo: number;
  codigoArmamentoFixo: string;
  statusTentativaCiclo: StatusTentativaCiclo;
  numeroAndarAtual: number;
  quantidadeVidasRestantes: number;
  quantidadeDicasRestantes: number;
  iniciadaEm: string | null;
  encerradaEm: string | null;
}

export interface RegistroMetricasConsolidadasJogador {
  identificadorUnicoJogador: string;
  totalVitoriasAndares: number;
  totalAndaresDistintosVencidos: number;
  totalSegundosAtivosEstudo: number;
  maiorSequenciaDiasAtivos: number;
  sequenciaAtualDiasAtivos: number;
}

export interface RegistroHistoricoCicloBanco {
  identificadorTentativaCiclo: string;
  numeroCiclo: number;
  codigoArmamento: string;
  statusTentativaCiclo: StatusTentativaCiclo;
  andarAlcancado: number;
  vidasRestantes: number;
  dicasRestantes: number;
  iniciadaEm: string | null;
  encerradaEm: string | null;
  quantidadeVitoriasNaRun: number;
  segundosAtivosNaRun: number;
}

export interface RegistroInimigoAndar {
  identificadorInimigo: number;
  nomeInimigo: string;
  inimigoEhChefe: boolean;
  urlSpritesheet2D: string | null;
  metadadosAnimacaoJson: string | null;
  quantidadeNoAndar: number;
}

/* ---------- AutenticacaoController ---------- */

/** POST /api/v1/autenticacao/sessao */
export interface ResultadoSincronizacaoGoogle {
  identificadorUnicoJogador: string;
  emailContaGoogle: string | null;
  nomeCompletoContaGoogle: string | null;
  urlFotoPerfilGoogle: string | null;
  primeiroAcesso: boolean;
  onboardingPendente: boolean;
  apelidoSugerido: string | null;
  identificadorSessaoEstudoAtiva: string | null;
  perfilComProgresso: RegistroPerfilComProgresso;
  tentativaAtiva: RegistroTentativaCiclo | null;
  metricas: RegistroMetricasConsolidadasJogador;
}

/* ---------- JogadorController ---------- */

/** POST /api/v1/jogadores/eu/onboarding */
export interface RequisicaoOnboardingJogador {
  apelidoHeroi: string;
  nivelExperiencia: string;
  canalAquisicao: string;
  tipoArmamentoInicial: string;
}

/** GET /api/v1/jogadores/eu */
export interface PerfilCompletoJogador {
  emailContaGoogle: string | null;
  nomeCompletoContaGoogle: string | null;
  urlFotoPerfilGoogle: string | null;
  perfilComProgresso: RegistroPerfilComProgresso;
}

/* ---------- TrilhaCiclosController ---------- */

/** GET /api/v1/tentativas-ciclo/atual (204 quando não há run aberta) */
export interface EstadoTentativaCicloAtual {
  identificadorTentativaCiclo: string;
  numeroCiclo: number;
  codigoArmamentoFixo: string;
  statusTentativaCiclo: StatusTentativaCiclo;
  numeroAndarAtual: number;
  andarCheckpointDoCiclo: number;
  quantidadeVidasRestantes: number;
  quantidadeDicasRestantes: number;
  podeTrocarArmamentoAgora: boolean;
}

/** POST /api/v1/tentativas-ciclo */
export interface RequisicaoPreparacaoCiclo {
  numeroCiclo: number;
  tipoArmamento: string;
}

export interface ResultadoPreparacaoCiclo {
  identificadorTentativaCiclo: string;
  numeroCiclo: number;
  andarInicialDoCiclo: number;
  codigoArmamentoSelecionado: string;
  statusTentativaCiclo: StatusTentativaCiclo;
  quantidadeVidasIniciais: number;
  quantidadeDicasIniciais: number;
  podeTrocarArmamentoAgora: boolean;
}

/** PATCH /api/v1/tentativas-ciclo/{id}/armamento */
export interface ResultadoTrocaArmamentoCiclo {
  identificadorTentativaCiclo: string;
  codigoArmamentoAtualizado: string;
}

/* ---------- CombateController ---------- */

export interface BlocoCodigoDisponivel {
  codigoIdentificadorBloco: string;
  textoCodigoBloco: string;
}

export interface InstanciaDesafioBlocosPublica {
  identificadorTentativaAndar: string;
  identificadorDesafioNoBanco: number | null;
  numeroAndarNaTorre: number;
  chaveVarianteNoAndar: string;
  tituloTemaPedagogico: string | null;
  enunciadoDesafioResolvido: string;
  templateCodigoComLacunasResolvido: string;
  identificadoresLacunasOrdenados: string[];
  blocosDisponiveisEmbaralhados: BlocoCodigoDisponivel[];
}

/** POST /api/v1/tentativas-ciclo/{id}/andares/iniciar */
export interface AberturaAndarArenaSupabase {
  identificadorTentativaCiclo: string;
  identificadorTentativaAndar: string;
  numeroAndarNaTorre: number;
  andarDeChefe: boolean;
  codigoArmamentoFixoDaRun: string;
  quantidadeVidasRestantes: number;
  quantidadeDicasRestantes: number;
  desafioPublicoEmbaralhado: InstanciaDesafioBlocosPublica;
  inimigosDoAndar: RegistroInimigoAndar[];
}

/** POST /api/v1/tentativas-andar/{id}/submissoes */
export interface RequisicaoSubmissaoBlocos {
  blocosEscolhidosPorLacuna: Record<string, string>;
}

export interface ResultadoSubmissaoArenaSupabase {
  identificadorSubmissaoCriada: string;
  identificadorTentativaAndar: string;
  identificadorTentativaCiclo: string;
  resultadoExecucao: ResultadoExecucaoSubmissao;
  categoriaErroDetectada: CategoriaErroBackend | null;
  codigoJavaMontadoFinal: string | null;
  acoesHeroiNaArena: { tipo: "MOVER" | "INTERAGIR" | "ATACAR" }[] | null;
  statusRunAtualizado: StatusTentativaCiclo;
  proximoAndarDaRun: number;
  quantidadeVidasRestantes: number;
  quantidadeDicasRestantes: number;
  maiorCicloDesbloqueado: number;
  andarMaiorCheckpoint: number;
  andarCheckpointDeReinicio: number;
  inimigoContraAtacou: boolean;
  venceuChefeDoCiclo: boolean;
  desbloqueouNovoCheckpoint: boolean;
  recursosRestauradosNoProximoCiclo: boolean;
  tentativaCicloDerrotada: boolean;
  dicaDisponivelParaSubmissao: boolean;
  mensagemFeedback: string | null;
}

/** POST /api/v1/submissoes/{id}/dica */
export interface ResultadoEntregaDicaPedagogica {
  identificadorSubmissaoOrigem: string;
  identificadorTentativaCicloOrigem: string;
  textoDicaPedagogica: string;
  quantidadeDicasRestantesNaRun: number;
}

/* ---------- MetricasController ---------- */

/** GET /api/v1/metricas/dashboard */
export interface ResumoDashboardJogador {
  identificadorUnicoJogador: string;
  apelidoHeroi: string | null;
  urlFotoPerfilGoogle: string | null;
  nivelExperiencia: string | null;
  canalAquisicao: string | null;
  codigoArmamentoPreferido: string | null;
  maiorCicloDesbloqueado: number;
  andarMaiorCheckpoint: number;
  totalVitoriasAndares: number;
  totalAndaresDistintosVencidos: number;
  totalSegundosAtivosEstudo: number;
  sequenciaAtualDiasAtivos: number;
  maiorSequenciaDiasAtivos: number;
  limiteInatividadeSegundos: number;
  tentativaCicloAberta: RegistroTentativaCiclo | null;
  historicoTentativasCiclo: RegistroHistoricoCicloBanco[];
}

/** POST /api/v1/sessoes-estudo/abrir */
export interface ResultadoAberturaSessaoEstudo {
  identificadorSessaoEstudo: string;
  limiteInatividadeSegundos: number;
}

/** POST /api/v1/sessoes-estudo/{id}/eventos-tempo */
export interface RequisicaoEventoTempoEstudo {
  numeroSequenciaEvento: number;
  identificadorTentativaAndar?: string | null;
  inicioIntervalo: string;
  fimIntervalo: string;
  segundosAtivosNoIntervalo: number;
}
