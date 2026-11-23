package com.javaquest.service;

import com.javaquest.repository.ExecutorComandoBancoJogador;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroAparenciaHeroi2D;
import com.javaquest.repository.RepositorioMetricasEstudoSupabase;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import com.javaquest.repository.RepositorioSessoesAutenticadas;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.Objects;
import com.javaquest.repository.RepositorioMetricasEstudoSupabase.RegistroMetricasConsolidadasJogador;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroTentativaCiclo;
import java.util.UUID;
import org.springframework.stereotype.Service;

// autentica via JWT do Supabase Auth (Google OAuth) e sincroniza o perfil/sessao de estudo no banco
@Service
public class AutenticacaoService {

    private final RepositorioSessoesAutenticadas sessoesAutenticadas;
    private final MetricasService metricasService;
    private final ExecutorComandoBancoJogador executorComandoBancoJogador;
    private final RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso;
    private final RepositorioCatalogoBancoSupabase repositorioCatalogoBanco;
    private final RepositorioMetricasEstudoSupabase repositorioMetricasEstudo;

    public AutenticacaoService(
            ExecutorComandoBancoJogador executorComandoBancoJogador,
            RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso,
            RepositorioCatalogoBancoSupabase repositorioCatalogoBanco,
            RepositorioMetricasEstudoSupabase repositorioMetricasEstudo,
            MetricasService metricasService, RepositorioSessoesAutenticadas sessoesAutenticadas) {
        this.sessoesAutenticadas = Objects.requireNonNull(sessoesAutenticadas);
        this.metricasService = Objects.requireNonNull(metricasService);
        this.executorComandoBancoJogador = Objects.requireNonNull(executorComandoBancoJogador);
        this.repositorioPerfilEProgresso = Objects.requireNonNull(repositorioPerfilEProgresso);
        this.repositorioCatalogoBanco = Objects.requireNonNull(repositorioCatalogoBanco);
        this.repositorioMetricasEstudo = Objects.requireNonNull(repositorioMetricasEstudo);
    }

    // RF-01 e RF-02: cria perfil/progresso no primeiro acesso via command('register') ou carrega estado salvo
    public ResultadoSincronizacaoGoogle sincronizarSessaoComGoogle(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID chaveIdempotenciaRequisicao) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado pelo JWT eh obrigatorio.");
        UUID chaveSegura = chaveIdempotenciaRequisicao != null
                ? chaveIdempotenciaRequisicao
                : UUID.randomUUID();
        UUID identificadorJogador = usuarioAutenticado.identificadorUnicoJogador();

        boolean primeiroAcessoJogador = executorComandoBancoJogador.executarComandoIdempotente(
                identificadorJogador, chaveSegura, "register", Map.of()).required("created").asBoolean();

        // abre ou recupera a sessao unica de estudo ativa pro cronometro (RF-24)
        UUID identificadorSessaoEstudoAtiva =
                repositorioMetricasEstudo.abrirOuRecuperarSessaoEstudo(identificadorJogador);

        RegistroPerfilComProgresso perfilAtualizado = repositorioPerfilEProgresso
                .buscarPerfilComProgresso(identificadorJogador)
                .orElseThrow(() -> new IllegalStateException("Perfil do jogador nao encontrado apos registro."));

        RegistroAparenciaHeroi2D aparenciaPadrao2D = repositorioCatalogoBanco
                .buscarAparenciaPadraoHeroi()
                .orElse(null);

        boolean onboardingPendente = !perfilAtualizado.onboardingFoiConcluido();
        String apelidoSugeridoPrimeiroNome = onboardingPendente
                ? limitarSugestaoApelido(usuarioAutenticado.sugerirPrimeiroNomeApelido())
                : perfilAtualizado.apelidoHeroi();

        return new ResultadoSincronizacaoGoogle(
                identificadorJogador,
                usuarioAutenticado.emailContaGoogle(),
                usuarioAutenticado.nomeCompletoContaGoogle(),
                usuarioAutenticado.urlFotoPerfilGoogle(),
                primeiroAcessoJogador,
                onboardingPendente,
                apelidoSugeridoPrimeiroNome,
                identificadorSessaoEstudoAtiva,
                perfilAtualizado,
                aparenciaPadrao2D,
                repositorioPerfilEProgresso.buscarTentativaCicloAberta(identificadorJogador).orElse(null),
                repositorioMetricasEstudo.buscarMetricasConsolidadas(identificadorJogador)
                        .orElseThrow(() -> new IllegalStateException("Metricas do perfil registrado indisponiveis.")));
    }

    @Transactional
    public void encerrarSessaoJogador(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID identificadorSessaoEstudoAtiva) {
        encerrarSessaoJogador(usuarioAutenticado, identificadorSessaoEstudoAtiva, null);
    }

    @Transactional
    public void encerrarSessaoJogador(UsuarioAutenticadoJwt usuarioAutenticado, UUID identificadorSessaoEstudoAtiva,
            MetricasService.DadosEventoTempoEstudo intervaloFinal) {
        metricasService.encerrarSessaoEstudo(usuarioAutenticado, identificadorSessaoEstudoAtiva, intervaloFinal);
        sessoesAutenticadas.encerrar(usuarioAutenticado.identificadorUnicoJogador(), usuarioAutenticado.identificadorSessaoAutenticada());
    }

    private String limitarSugestaoApelido(String sugestaoBruta) {
        if (sugestaoBruta == null || sugestaoBruta.isBlank()) {
            return "";
        }
        String sugestaoLimpa = sugestaoBruta.trim();
        // respeita o varchar(30) da coluna nickname no banco
        return sugestaoLimpa.length() > JogadorService.TAMANHO_MAXIMO_APELIDO
                ? sugestaoLimpa.substring(0, JogadorService.TAMANHO_MAXIMO_APELIDO)
                : sugestaoLimpa;
    }

    public record ResultadoSincronizacaoGoogle(
            UUID identificadorUnicoJogador,
            String emailContaGoogle,
            String nomeCompletoContaGoogle,
            String urlFotoPerfilGoogle,
            boolean primeiroAcesso,
            boolean onboardingPendente,
            String apelidoSugerido,
            UUID identificadorSessaoEstudoAtiva,
            RegistroPerfilComProgresso perfilComProgresso,
            RegistroAparenciaHeroi2D aparenciaPadrao2D,
            RegistroTentativaCiclo tentativaAtiva,
            RegistroMetricasConsolidadasJogador metricas) {
    }
}
