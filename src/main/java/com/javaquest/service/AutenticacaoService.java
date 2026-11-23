package com.javaquest.service;

import com.javaquest.persistencia.ExecutorComandoBancoJogador;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase.RegistroAparenciaHeroi2D;
import com.javaquest.persistencia.RepositorioMetricasEstudoSupabase;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

// autentica via JWT do Supabase Auth (Google OAuth) e sincroniza o perfil/sessao de estudo no banco
@Service
public class AutenticacaoService {

    private final ExecutorComandoBancoJogador executorComandoBancoJogador;
    private final RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso;
    private final RepositorioCatalogoBancoSupabase repositorioCatalogoBanco;
    private final RepositorioMetricasEstudoSupabase repositorioMetricasEstudo;

    public AutenticacaoService(
            ExecutorComandoBancoJogador executorComandoBancoJogador,
            RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso,
            RepositorioCatalogoBancoSupabase repositorioCatalogoBanco,
            RepositorioMetricasEstudoSupabase repositorioMetricasEstudo) {
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

        // checa antes se o jogador ja tinha cadastro pra avisar o front se eh primeiro acesso
        Optional<RegistroPerfilComProgresso> perfilExistenteAntes =
                repositorioPerfilEProgresso.buscarPerfilComProgresso(identificadorJogador);
        boolean primeiroAcessoJogador = perfilExistenteAntes.isEmpty();

        // register eh idempotente no banco (cria players com HERO_DEFAULT_2D e player_progress no ciclo 1)
        executorComandoBancoJogador.executarComandoIdempotente(
                identificadorJogador,
                chaveSegura,
                "register",
                Map.of());

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
                aparenciaPadrao2D);
    }

    // RF-05: fecha a sessao de estudo no banco; a revogacao do token acontece no cliente via Supabase Auth
    public void encerrarSessaoJogador(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID identificadorSessaoEstudoAtiva) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado pelo JWT eh obrigatorio.");
        if (identificadorSessaoEstudoAtiva == null) {
            return;
        }
        repositorioMetricasEstudo.encerrarSessaoEstudo(
                usuarioAutenticado.identificadorUnicoJogador(),
                identificadorSessaoEstudoAtiva);
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
            RegistroAparenciaHeroi2D aparenciaPadrao2D) {
    }
}
