package com.javaquest.service;

import com.javaquest.repository.ExecutorComandoBancoJogador;
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

    public VidasDicasService(
            ExecutorComandoBancoJogador executorComandoBancoJogador) {
        this.executorComandoBancoJogador = Objects.requireNonNull(executorComandoBancoJogador);
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

        int dicasRestantesAtualizadas = respostaBanco.required("hints").asInt();
        UUID identificadorCicloOrigem = UUID.fromString(respostaBanco.required("run_id").asString());

        return new ResultadoEntregaDicaPedagogica(
                identificadorSubmissaoIncorreta,
                identificadorCicloOrigem,
                textoDicaPedagogica,
                dicasRestantesAtualizadas);
    }

    public record ResultadoEntregaDicaPedagogica(
            UUID identificadorSubmissaoOrigem,
            UUID identificadorTentativaCicloOrigem,
            String textoDicaPedagogica,
            int quantidadeDicasRestantesNaRun) {
    }
}
