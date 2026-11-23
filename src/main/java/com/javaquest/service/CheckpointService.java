package com.javaquest.service;

import com.javaquest.dominio.TipoArmamentoHeroi;
import com.javaquest.persistencia.ExecutorComandoBancoJogador;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase.RegistroAndarCatalogo;
import com.javaquest.persistencia.RepositorioCatalogoBancoSupabase.RegistroCicloCatalogo;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroPerfilComProgresso;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroTentativaCiclo;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

// gerencia trilha de ciclos, checkpoints permanentes (11, 21, 31...) e ciclo de vida das runs no Supabase
@Service
public class CheckpointService {

    public static final int QUANTIDADE_ANDARES_POR_CICLO = 10;

    private final ExecutorComandoBancoJogador executorComandoBancoJogador;
    private final RepositorioCatalogoBancoSupabase repositorioCatalogoBanco;
    private final RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso;

    public CheckpointService(
            ExecutorComandoBancoJogador executorComandoBancoJogador,
            RepositorioCatalogoBancoSupabase repositorioCatalogoBanco,
            RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso) {
        this.executorComandoBancoJogador = Objects.requireNonNull(executorComandoBancoJogador);
        this.repositorioCatalogoBanco = Objects.requireNonNull(repositorioCatalogoBanco);
        this.repositorioPerfilEProgresso = Objects.requireNonNull(repositorioPerfilEProgresso);
    }

    // checkpoint eh sempre o primeiro andar de cada bloco: 1, 11, 21, 31... (e nunca 10, 20, 30 q sao chefes)
    public boolean ehAndarDeCheckpoint(int numeroAndarNaTorre) {
        return numeroAndarNaTorre > 0 && ((numeroAndarNaTorre - 1) % QUANTIDADE_ANDARES_POR_CICLO == 0);
    }

    public int calcularAndarCheckpointDoCiclo(int numeroCicloInformado) {
        if (numeroCicloInformado <= 0) {
            throw new IllegalArgumentException("Numero do ciclo precisa ser maior que zero.");
        }
        return (QUANTIDADE_ANDARES_POR_CICLO * (numeroCicloInformado - 1)) + 1;
    }

    // qnd vence o chefe (10, 20, 30), libera o checkpoint seguinte (11, 21, 31)
    public int calcularProximoCheckpointAposChefe(int numeroAndarChefe) {
        if (numeroAndarChefe <= 0 || numeroAndarChefe % QUANTIDADE_ANDARES_POR_CICLO != 0) {
            throw new IllegalArgumentException("O andar " + numeroAndarChefe + " nao eh um andar de chefe.");
        }
        return numeroAndarChefe + 1;
    }

    // RF-09 e RF-12: monta a trilha com ciclos desbloqueados, publicados e andares do catalogo
    public ResumoTrilhaCiclosJogador listarTrilhaCiclosEAndares(UsuarioAutenticadoJwt usuarioAutenticado) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        UUID identificadorJogador = usuarioAutenticado.identificadorUnicoJogador();

        RegistroPerfilComProgresso perfilAtual = repositorioPerfilEProgresso
                .buscarPerfilComProgresso(identificadorJogador)
                .orElseThrow(() -> new IllegalStateException(
                        "Perfil do jogador nao inicializado. Sincronize a sessao primeiro."));

        int maiorCicloLiberado = perfilAtual.maiorCicloDesbloqueado();
        int andarMaiorCheckpoint = calcularAndarCheckpointDoCiclo(maiorCicloLiberado);

        List<RegistroCicloCatalogo> ciclosNoBanco = repositorioCatalogoBanco.listarTodosCiclos();
        List<ItemCicloNaTrilha> itensTrilha = new ArrayList<>();

        boolean maiorCicloEstaPublicado = false;
        for (RegistroCicloCatalogo cicloAtual : ciclosNoBanco) {
            boolean desbloqueado = cicloAtual.numeroCiclo() <= maiorCicloLiberado;
            boolean publicado = cicloAtual.cicloEstaPublicado();
            boolean disponivelParaJogar = desbloqueado && publicado;

            if (cicloAtual.numeroCiclo() == maiorCicloLiberado && publicado) {
                maiorCicloEstaPublicado = true;
            }

            List<RegistroAndarCatalogo> andaresDoCiclo =
                    repositorioCatalogoBanco.listarAndaresPorCiclo(cicloAtual.numeroCiclo());

            itensTrilha.add(new ItemCicloNaTrilha(
                    cicloAtual.numeroCiclo(),
                    cicloAtual.tituloCiclo(),
                    cicloAtual.andarInicial(),
                    cicloAtual.andarFinal(),
                    calcularAndarCheckpointDoCiclo(cicloAtual.numeroCiclo()),
                    desbloqueado,
                    publicado,
                    disponivelParaJogar,
                    andaresDoCiclo));
        }

        // adendo RF-10/RF-19: jogador pode ter checkpoint 11/21 liberado msm antes do ciclo seguinte ser publicado
        boolean aguardandoPublicacaoProximoCiclo = !maiorCicloEstaPublicado;

        Optional<EstadoTentativaCicloAtual> tentativaCicloAberta =
                obterTentativaCicloAberta(usuarioAutenticado);

        return new ResumoTrilhaCiclosJogador(
                maiorCicloLiberado,
                andarMaiorCheckpoint,
                aguardandoPublicacaoProximoCiclo,
                tentativaCicloAberta.orElse(null),
                List.copyOf(itensTrilha));
    }

    public Optional<EstadoTentativaCicloAtual> obterTentativaCicloAberta(UsuarioAutenticadoJwt usuarioAutenticado) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        return repositorioPerfilEProgresso
                .buscarTentativaCicloAberta(usuarioAutenticado.identificadorUnicoJogador())
                .map(this::mapearEstadoTentativaCiclo);
    }

    // RF-08, RF-11, RF-12, RF-15: abre nova run em PREPARING com 3 vidas e 3 dicas restauradas
    public ResultadoPreparacaoCiclo prepararNovaTentativaCiclo(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID chaveIdempotenciaRequisicao,
            int numeroCicloDesejado,
            TipoArmamentoHeroi armamentoEscolhido) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        if (numeroCicloDesejado <= 0) {
            throw new IllegalArgumentException("Numero do ciclo precisa ser maior que zero.");
        }
        Objects.requireNonNull(armamentoEscolhido, "Armamento da tentativa de ciclo eh obrigatorio.");

        UUID chaveSegura = chaveIdempotenciaRequisicao != null
                ? chaveIdempotenciaRequisicao
                : UUID.randomUUID();

        // payload exato esperado por javaquest.command('prepare') no Supabase
        Map<String, Object> payloadPreparacaoBanco = new LinkedHashMap<>();
        payloadPreparacaoBanco.put("cycle", numeroCicloDesejado);
        payloadPreparacaoBanco.put("weapon", armamentoEscolhido.getCodigoArmamentoBanco());

        JsonNode respostaBanco = executorComandoBancoJogador.executarComandoIdempotente(
                usuarioAutenticado.identificadorUnicoJogador(),
                chaveSegura,
                "prepare",
                payloadPreparacaoBanco);

        UUID identificadorRunCriada = UUID.fromString(respostaBanco.path("run_id").asString());
        int quantidadeVidas = respostaBanco.path("lives").asInt(3);
        int quantidadeDicas = respostaBanco.path("hints").asInt(3);

        return new ResultadoPreparacaoCiclo(
                identificadorRunCriada,
                numeroCicloDesejado,
                calcularAndarCheckpointDoCiclo(numeroCicloDesejado),
                armamentoEscolhido.getCodigoArmamentoBanco(),
                "PREPARING",
                quantidadeVidas,
                quantidadeDicas,
                true);
    }

    // RF-08: troca arma soh enquanto a run ainda ta em PREPARING (inclusive no andar 1, sem o bug antigo!)
    public ResultadoTrocaArmamentoCiclo trocarArmamentoEmPreparacao(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID chaveIdempotenciaRequisicao,
            UUID identificadorTentativaCiclo,
            TipoArmamentoHeroi novoArmamentoEscolhido) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        Objects.requireNonNull(identificadorTentativaCiclo, "O id da tentativa de ciclo eh obrigatorio.");
        Objects.requireNonNull(novoArmamentoEscolhido, "O novo armamento eh obrigatorio.");

        UUID chaveSegura = chaveIdempotenciaRequisicao != null
                ? chaveIdempotenciaRequisicao
                : UUID.randomUUID();

        Map<String, Object> payloadTrocaArma = new LinkedHashMap<>();
        payloadTrocaArma.put("run_id", identificadorTentativaCiclo.toString());
        payloadTrocaArma.put("weapon", novoArmamentoEscolhido.getCodigoArmamentoBanco());

        JsonNode respostaBanco = executorComandoBancoJogador.executarComandoIdempotente(
                usuarioAutenticado.identificadorUnicoJogador(),
                chaveSegura,
                "weapon",
                payloadTrocaArma);

        String codigoArmaConfirmada = respostaBanco.path("weapon").asString(
                novoArmamentoEscolhido.getCodigoArmamentoBanco());

        return new ResultadoTrocaArmamentoCiclo(identificadorTentativaCiclo, codigoArmaConfirmada);
    }

    // encerra uma run aberta preservando historico e tempo ativo (pra liberar inicio de outra run/replay)
    public ResultadoAbandonoCiclo abandonarTentativaCiclo(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID chaveIdempotenciaRequisicao,
            UUID identificadorTentativaCiclo) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        Objects.requireNonNull(identificadorTentativaCiclo, "O id da tentativa de ciclo eh obrigatorio.");

        UUID chaveSegura = chaveIdempotenciaRequisicao != null
                ? chaveIdempotenciaRequisicao
                : UUID.randomUUID();

        Map<String, Object> payloadAbandono = Map.of("run_id", identificadorTentativaCiclo.toString());

        JsonNode respostaBanco = executorComandoBancoJogador.executarComandoIdempotente(
                usuarioAutenticado.identificadorUnicoJogador(),
                chaveSegura,
                "abandon",
                payloadAbandono);

        String statusConfirmado = respostaBanco.path("status").asString("ABANDONED");
        return new ResultadoAbandonoCiclo(identificadorTentativaCiclo, statusConfirmado);
    }

    private EstadoTentativaCicloAtual mapearEstadoTentativaCiclo(RegistroTentativaCiclo registroRun) {
        // arma fica liberada pra troca soh antes de iniciar o primeiro andar (status PREPARING)
        boolean podeTrocarArmamento = "PREPARING".equalsIgnoreCase(registroRun.statusTentativaCiclo());
        return new EstadoTentativaCicloAtual(
                registroRun.identificadorTentativaCiclo(),
                registroRun.numeroCiclo(),
                registroRun.codigoArmamentoFixo(),
                registroRun.statusTentativaCiclo(),
                registroRun.numeroAndarAtual(),
                calcularAndarCheckpointDoCiclo(registroRun.numeroCiclo()),
                registroRun.quantidadeVidasRestantes(),
                registroRun.quantidadeDicasRestantes(),
                podeTrocarArmamento);
    }

    public record ItemCicloNaTrilha(
            int numeroCiclo,
            String tituloCiclo,
            int andarInicial,
            int andarFinal,
            int andarCheckpointInicial,
            boolean desbloqueadoParaJogador,
            boolean publicadoNoCatalogo,
            boolean disponivelParaJogar,
            List<RegistroAndarCatalogo> andaresDoCiclo) {
    }

    public record EstadoTentativaCicloAtual(
            UUID identificadorTentativaCiclo,
            int numeroCiclo,
            String codigoArmamentoFixo,
            String statusTentativaCiclo,
            int numeroAndarAtual,
            int andarCheckpointDoCiclo,
            int quantidadeVidasRestantes,
            int quantidadeDicasRestantes,
            boolean podeTrocarArmamentoAgora) {
    }

    public record ResumoTrilhaCiclosJogador(
            int maiorCicloDesbloqueado,
            int andarMaiorCheckpointDesbloqueado,
            boolean proximoCicloAguardandoPublicacao,
            EstadoTentativaCicloAtual tentativaCicloAberta,
            List<ItemCicloNaTrilha> ciclosDaTrilha) {
    }

    public record ResultadoPreparacaoCiclo(
            UUID identificadorTentativaCiclo,
            int numeroCiclo,
            int andarInicialDoCiclo,
            String codigoArmamentoSelecionado,
            String statusTentativaCiclo,
            int quantidadeVidasIniciais,
            int quantidadeDicasIniciais,
            boolean podeTrocarArmamentoAgora) {
    }

    public record ResultadoTrocaArmamentoCiclo(
            UUID identificadorTentativaCiclo,
            String codigoArmamentoAtualizado) {
    }

    public record ResultadoAbandonoCiclo(
            UUID identificadorTentativaCiclo,
            String statusFinalCiclo) {
    }
}
