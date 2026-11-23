package com.javaquest.excecao;

import com.javaquest.dto.RespostaErroPadraoApi;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

// traduz excecoes de dominio, validacao e banco pra status HTTP padronizados sem vazar SQL pro front
@RestControllerAdvice
public class TratadorGlobalExcecoesApi {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RespostaErroPadraoApi> tratarErroValidacaoCorpo(
            MethodArgumentNotValidException excecaoValidacao,
            HttpServletRequest requisicaoHttp) {
        List<String> detalhes = excecaoValidacao.getBindingResult().getFieldErrors().stream()
                .map(erroCampo -> erroCampo.getField() + ": " + erroCampo.getDefaultMessage())
                .toList();

        return construirResposta(
                HttpStatus.BAD_REQUEST,
                "DADOS_INVALIDOS",
                "Um ou mais campos da requisicao sao invalidos.",
                requisicaoHttp,
                detalhes);
    }

    @ExceptionHandler({
        ConstraintViolationException.class,
        IllegalArgumentException.class,
        MethodArgumentTypeMismatchException.class,
        HttpMessageNotReadableException.class
    })
    public ResponseEntity<RespostaErroPadraoApi> tratarRequisicaoInvalida(
            Exception excecaoEntrada,
            HttpServletRequest requisicaoHttp) {
        String mensagem = excecaoEntrada instanceof HttpMessageNotReadableException
                ? "Corpo JSON invalido ou campo com formato incorreto."
                : excecaoEntrada.getMessage();
        return construirResposta(
                HttpStatus.BAD_REQUEST,
                "REQUISICAO_INVALIDA",
                mensagem,
                requisicaoHttp,
                List.of());
    }

    @ExceptionHandler(ExcecaoLimiteTaxaExcedido.class)
    public ResponseEntity<RespostaErroPadraoApi> tratarLimiteTaxaExcedido(
            ExcecaoLimiteTaxaExcedido excecaoLimite,
            HttpServletRequest requisicaoHttp) {
        RespostaErroPadraoApi corpo = new RespostaErroPadraoApi(
                HttpStatus.TOO_MANY_REQUESTS.value(),
                "LIMITE_REQUISICOES_EXCEDIDO",
                excecaoLimite.getMessage(),
                requisicaoHttp.getRequestURI(),
                OffsetDateTime.now(),
                List.of());

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(excecaoLimite.getSegundosParaTentarNovamente()))
                .body(corpo);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<RespostaErroPadraoApi> tratarConflitoEstado(
            IllegalStateException excecaoEstado,
            HttpServletRequest requisicaoHttp) {
        return construirResposta(
                HttpStatus.CONFLICT,
                "CONFLITO_ESTADO_NEGOCIO",
                excecaoEstado.getMessage(),
                requisicaoHttp,
                List.of());
    }

    // interpreta erros controlados disparados pelas funcoes PL/pgSQL do Supabase sem vazar query interna
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<RespostaErroPadraoApi> tratarErroBancoDados(
            DataAccessException excecaoBanco,
            HttpServletRequest requisicaoHttp) {
        Throwable causaRaiz = excecaoBanco.getMostSpecificCause();
        String mensagemBanco = causaRaiz != null && causaRaiz.getMessage() != null
                ? causaRaiz.getMessage()
                : "";
        String textoMinusculo = mensagemBanco.toLowerCase(Locale.ROOT);

        if (textoMinusculo.contains("idempotency key reused")) {
            return construirResposta(HttpStatus.CONFLICT, "CONFLITO_IDEMPOTENCIA",
                    "Chave Idempotency-Key ja usada com um payload diferente.", requisicaoHttp, List.of());
        }
        if (textoMinusculo.contains("one_open_run") || textoMinusculo.contains("duplicate key")) {
            return construirResposta(HttpStatus.CONFLICT, "TENTATIVA_CICLO_JA_ABERTA",
                    "Ja existe uma tentativa de ciclo aberta. Conclua ou abandone antes de iniciar outra.", requisicaoHttp, List.of());
        }
        if (textoMinusculo.contains("cycle locked or unpublished")) {
            return construirResposta(HttpStatus.CONFLICT, "CICLO_BLOQUEADO_OU_NAO_PUBLICADO",
                    "Ciclo ainda bloqueado ou nao publicado no catalogo.", requisicaoHttp, List.of());
        }
        if (textoMinusculo.contains("complete onboarding first")) {
            return construirResposta(HttpStatus.CONFLICT, "ONBOARDING_PENDENTE",
                    "Conclua o onboarding antes de iniciar um ciclo.", requisicaoHttp, List.of());
        }
        if (textoMinusculo.contains("weapon locked for this run")) {
            return construirResposta(HttpStatus.CONFLICT, "ARMAMENTO_TRAVADO_NA_RUN",
                    "A arma soh pode ser trocada antes de iniciar o primeiro andar do ciclo.", requisicaoHttp, List.of());
        }
        if (textoMinusculo.contains("attempt closed") || textoMinusculo.contains("stale submission")
                || textoMinusculo.contains("run unavailable") || textoMinusculo.contains("run already closed")) {
            return construirResposta(HttpStatus.CONFLICT, "ESTADO_COMBATE_ENCERRADO",
                    "Tentativa ou ciclo ja encerrado ou indisponivel para esta operacao.", requisicaoHttp, List.of());
        }
        if (textoMinusculo.contains("hint not eligible") || textoMinusculo.contains("incorrect submission required")) {
            return construirResposta(HttpStatus.CONFLICT, "DICA_INDISPONIVEL",
                    "Dica indisponivel para esta submissao ou limite de 3 dicas do ciclo atingido.", requisicaoHttp, List.of());
        }
        if (textoMinusculo.contains("sequence reused") || textoMinusculo.contains("overlapping interval")
                || textoMinusculo.contains("invalid session interval") || textoMinusculo.contains("invalid attempt interval")) {
            return construirResposta(HttpStatus.CONFLICT, "CONFLITO_EVENTO_TEMPO",
                    "Intervalo de tempo de estudo invalido, sobreposto ou sequencia reutilizada.", requisicaoHttp, List.of());
        }
        if (textoMinusculo.contains("profile not initialized") || textoMinusculo.contains("session unavailable")) {
            return construirResposta(HttpStatus.NOT_FOUND, "RECURSO_NAO_ENCONTRADO",
                    "Perfil ou sessao ainda nao inicializados para o jogador.", requisicaoHttp, List.of());
        }

        // fallback seguro pra nn vazar detalhes internos de SQL pro cliente
        return construirResposta(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "ERRO_PERSISTENCIA_BANCO",
                "Nao foi possivel concluir a operacao no banco de dados.",
                requisicaoHttp,
                List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<RespostaErroPadraoApi> tratarErroInesperado(
            Exception excecaoGenerica,
            HttpServletRequest requisicaoHttp) {
        return construirResposta(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "ERRO_INTERNO_SERVIDOR",
                "Ocorreu um erro interno inesperado ao processar a requisicao.",
                requisicaoHttp,
                List.of());
    }

    private ResponseEntity<RespostaErroPadraoApi> construirResposta(
            HttpStatus statusHttp,
            String codigoErro,
            String mensagemErro,
            HttpServletRequest requisicaoHttp,
            List<String> detalhesValidacao) {
        RespostaErroPadraoApi corpo = new RespostaErroPadraoApi(
                statusHttp.value(),
                codigoErro,
                mensagemErro,
                requisicaoHttp.getRequestURI(),
                OffsetDateTime.now(),
                detalhesValidacao);
        return ResponseEntity.status(statusHttp).body(corpo);
    }
}
