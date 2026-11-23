package com.javaquest.service;

import com.javaquest.dominio.CanalAquisicao;
import com.javaquest.dominio.NivelExperiencia;
import com.javaquest.dominio.TipoArmamentoHeroi;
import com.javaquest.repository.ExecutorComandoBancoJogador;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroAparenciaHeroi2D;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroArmamentoCatalogo2D;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase;
import com.javaquest.repository.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;

// gerencia perfil, onboarding completo (RF-02 a RF-07) e catalogos 2D conectado direto ao Supabase
@Service
public class JogadorService {

    public static final int TAMANHO_MAXIMO_APELIDO = 30;

    private final ExecutorComandoBancoJogador executorComandoBancoJogador;
    private final RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso;
    private final RepositorioCatalogoBancoSupabase repositorioCatalogoBanco;

    public JogadorService(
            ExecutorComandoBancoJogador executorComandoBancoJogador,
            RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso,
            RepositorioCatalogoBancoSupabase repositorioCatalogoBanco) {
        this.executorComandoBancoJogador = Objects.requireNonNull(executorComandoBancoJogador);
        this.repositorioPerfilEProgresso = Objects.requireNonNull(repositorioPerfilEProgresso);
        this.repositorioCatalogoBanco = Objects.requireNonNull(repositorioCatalogoBanco);
    }

    public PerfilCompletoJogador obterPerfilCompleto(UsuarioAutenticadoJwt usuarioAutenticado) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        UUID identificadorJogador = usuarioAutenticado.identificadorUnicoJogador();

        RegistroPerfilComProgresso perfilAtual = repositorioPerfilEProgresso
                .buscarPerfilComProgresso(identificadorJogador)
                .orElseThrow(() -> new IllegalStateException(
                        "Perfil ainda nao inicializado. Chame a sincronizacao de sessao primeiro."));

        RegistroAparenciaHeroi2D aparenciaPadrao2D = repositorioCatalogoBanco
                .buscarAparenciaPadraoHeroi()
                .orElse(null);

        List<RegistroArmamentoCatalogo2D> armamentosAtivos = repositorioCatalogoBanco.listarArmamentosAtivos();

        return new PerfilCompletoJogador(
                usuarioAutenticado.emailContaGoogle(),
                usuarioAutenticado.nomeCompletoContaGoogle(),
                usuarioAutenticado.urlFotoPerfilGoogle(),
                perfilAtual,
                aparenciaPadrao2D,
                armamentosAtivos);
    }

    // conclui onboarding de uma vez via command('onboarding') garantindo os 4 campos obrigatorios no banco
    public PerfilCompletoJogador concluirOnboardingJogador(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID chaveIdempotenciaRequisicao,
            DadosOnboardingJogador dadosOnboarding) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        Objects.requireNonNull(dadosOnboarding, "Os dados do onboarding sao obrigatorios.");

        String apelidoValidado = validarENormalizarApelido(dadosOnboarding.apelidoHeroi());
        NivelExperiencia nivelValidado = Objects.requireNonNull(
                dadosOnboarding.nivelExperiencia(),
                "Nivel de experiencia eh obrigatorio (RF-03).");
        CanalAquisicao canalValidado = Objects.requireNonNull(
                dadosOnboarding.canalAquisicao(),
                "Canal de aquisicao eh obrigatorio (RF-04).");
        TipoArmamentoHeroi armamentoValidado = Objects.requireNonNull(
                dadosOnboarding.tipoArmamentoInicial(),
                "Armamento inicial eh obrigatorio (RF-07).");

        UUID chaveSegura = chaveIdempotenciaRequisicao != null
                ? chaveIdempotenciaRequisicao
                : UUID.randomUUID();

        // chaves do payload seguem o contrato exato da funcao SQL javaquest.command('onboarding')
        Map<String, Object> payloadOnboardingBanco = new LinkedHashMap<>();
        payloadOnboardingBanco.put("nickname", apelidoValidado);
        payloadOnboardingBanco.put("experience", nivelValidado.name());
        payloadOnboardingBanco.put("channel", canalValidado.name());
        payloadOnboardingBanco.put("weapon", armamentoValidado.getCodigoArmamentoBanco());

        executorComandoBancoJogador.executarComandoIdempotente(
                usuarioAutenticado.identificadorUnicoJogador(),
                chaveSegura,
                "onboarding",
                payloadOnboardingBanco);

        return obterPerfilCompleto(usuarioAutenticado);
    }

    // permite editar o apelido dps do onboarding (RF-02 permite apelidos repetidos pq a PK eh UUID)
    public PerfilCompletoJogador atualizarApelidoJogador(
            UsuarioAutenticadoJwt usuarioAutenticado,
            String novoApelidoInformado) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        String apelidoValidado = validarENormalizarApelido(novoApelidoInformado);

        int linhasAlteradas = repositorioPerfilEProgresso.atualizarApelidoJogador(
                usuarioAutenticado.identificadorUnicoJogador(),
                apelidoValidado);
        if (linhasAlteradas == 0) {
            throw new IllegalStateException("Perfil do jogador nao encontrado para atualizar apelido.");
        }

        return obterPerfilCompleto(usuarioAutenticado);
    }

    public List<RegistroArmamentoCatalogo2D> listarArmamentosAtivos() {
        return repositorioCatalogoBanco.listarArmamentosAtivos();
    }

    public RegistroAparenciaHeroi2D obterAparenciaPadraoHeroi() {
        return repositorioCatalogoBanco.buscarAparenciaPadraoHeroi()
                .orElseThrow(() -> new IllegalStateException("Aparencia padrao HERO_DEFAULT_2D nao cadastrada."));
    }

    private String validarENormalizarApelido(String apelidoInformado) {
        if (apelidoInformado == null || apelidoInformado.isBlank()) {
            throw new IllegalArgumentException("Apelido do heroi nao pode ser vazio.");
        }
        String apelidoLimpo = apelidoInformado.trim();
        if (apelidoLimpo.length() > TAMANHO_MAXIMO_APELIDO) {
            throw new IllegalArgumentException(
                    "Apelido do heroi deve ter no maximo " + TAMANHO_MAXIMO_APELIDO + " caracteres.");
        }
        return apelidoLimpo;
    }

    public record DadosOnboardingJogador(
            String apelidoHeroi,
            NivelExperiencia nivelExperiencia,
            CanalAquisicao canalAquisicao,
            TipoArmamentoHeroi tipoArmamentoInicial) {
    }

    public record PerfilCompletoJogador(
            String emailContaGoogle,
            String nomeCompletoContaGoogle,
            String urlFotoPerfilGoogle,
            RegistroPerfilComProgresso perfilComProgresso,
            RegistroAparenciaHeroi2D aparenciaPadrao2D,
            List<RegistroArmamentoCatalogo2D> armamentosAtivos) {
    }
}
