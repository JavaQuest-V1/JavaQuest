package com.javaquest.service;

import com.javaquest.persistencia.ExecutorComandoBancoJogador;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase;
import com.javaquest.persistencia.RepositorioPerfilEProgressoSupabase.RegistroTentativaCiclo;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

// entrega dica pedagogica soh a partir de uma submissao INCORRECT ativa (RF-14 e RNF-11)
@Service
public class VidasDicasService {

    private final ExecutorComandoBancoJogador executorComandoBancoJogador;
    private final RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso;

    public VidasDicasService(
            ExecutorComandoBancoJogador executorComandoBancoJogador,
            RepositorioPerfilEProgressoSupabase repositorioPerfilEProgresso) {
        this.executorComandoBancoJogador = Objects.requireNonNull(executorComandoBancoJogador);
        this.repositorioPerfilEProgresso = Objects.requireNonNull(repositorioPerfilEProgresso);
    }

    // cliente manda soh o submission_id; categoria do erro e limite de 3 dicas ficam 100% no server/banco
    public ResultadoEntregaDicaPedagogica solicitarDicaParaSubmissaoIncorreta(
            UsuarioAutenticadoJwt usuarioAutenticado,
            UUID chaveIdempotenciaRequisicao,
            UUID identificadorSubmissaoIncorreta) {
        Objects.requireNonNull(usuarioAutenticado, "O usuario autenticado eh obrigatorio.");
        Objects.requireNonNull(identificadorSubmissaoIncorreta, "O id da submissao incorreta eh obrigatorio.");

        UUID chaveSegura = chaveIdempotenciaRequisicao != null
                ? chaveIdempotenciaRequisicao
                : UUID.randomUUID();
        UUID identificadorJogador = usuarioAutenticado.identificadorUnicoJogador();

        // se o front mandar dnv por queda de rede, o banco devolve a msm dica sem gastar outra
        JsonNode respostaBanco = executorComandoBancoJogador.executarComandoIdempotente(
                identificadorJogador,
                chaveSegura,
                "hint",
                Map.of("submission_id", identificadorSubmissaoIncorreta.toString()));

        String textoDicaPedagogica = respostaBanco.path("hint").asString();
        if (textoDicaPedagogica == null || textoDicaPedagogica.isBlank()) {
            throw new IllegalStateException("Dica pedagogica nao retornada pelo banco para esta submissao.");
        }

        int dicasRestantesAtualizadas = repositorioPerfilEProgresso
                .buscarTentativaCicloAberta(identificadorJogador)
                .map(RegistroTentativaCiclo::quantidadeDicasRestantes)
                .orElse(0);

        return new ResultadoEntregaDicaPedagogica(
                identificadorSubmissaoIncorreta,
                textoDicaPedagogica,
                dicasRestantesAtualizadas);
    }

    public record ResultadoEntregaDicaPedagogica(
            UUID identificadorSubmissaoOrigem,
            String textoDicaPedagogica,
            int quantidadeDicasRestantesNaRun) {
    }
}
