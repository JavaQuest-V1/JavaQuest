package com.javaquest.controller;

import com.javaquest.dominio.RespostaBlocosEnviadaJogador;
import com.javaquest.dto.RequisicaoSubmissaoBlocos;
import com.javaquest.seguranca.ControladorLimiteTaxaRequisicoes;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import com.javaquest.service.CombateService;
import com.javaquest.service.CombateService.AberturaAndarArenaSupabase;
import com.javaquest.service.CombateService.ResultadoSubmissaoArenaSupabase;
import com.javaquest.service.VidasDicasService;
import com.javaquest.service.VidasDicasService.ResultadoEntregaDicaPedagogica;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// endpoints criticos de combate em blocos, sorteio anti-memorizacao e dicas pedagogicas (RF-13 a RF-21)
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Combate na Arena e Dicas", description = "Início de andar com sorteio rogue-lite, submissão de blocos e solicitação de dica pedagógica.")
public class CombateController {

    private final CombateService servicoCombate;
    private final VidasDicasService servicoVidasDicas;
    private final ControladorLimiteTaxaRequisicoes controladorLimiteTaxa;

    public CombateController(
            CombateService servicoCombate,
            VidasDicasService servicoVidasDicas,
            ControladorLimiteTaxaRequisicoes controladorLimiteTaxa) {
        this.servicoCombate = Objects.requireNonNull(servicoCombate);
        this.servicoVidasDicas = Objects.requireNonNull(servicoVidasDicas);
        this.controladorLimiteTaxa = Objects.requireNonNull(controladorLimiteTaxa);
    }

    @PostMapping("/tentativas-ciclo/{identificadorTentativaCiclo}/andares/iniciar")
    @Operation(
            summary = "Iniciar andar atual e sortear desafio em blocos",
            description = "Sorteia uma variante diferente da anterior (RF-21), trava a arma da run e retorna os blocos embaralhados sem gabarito.")
    public ResponseEntity<AberturaAndarArenaSupabase> iniciarAndarAtual(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @RequestHeader(name = "Idempotency-Key", required = false) UUID chaveIdempotenciaRequisicao,
            @PathVariable UUID identificadorTentativaCiclo) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        AberturaAndarArenaSupabase abertura = servicoCombate.iniciarAndarNaRunSupabase(
                usuarioAutenticado,
                chaveIdempotenciaRequisicao,
                identificadorTentativaCiclo);
        return ResponseEntity.ok(abertura);
    }

    @PostMapping("/tentativas-andar/{identificadorTentativaAndar}/submissoes")
    @Operation(
            summary = "Submeter blocos preenchidos nas lacunas",
            description = "Valida os blocos fora da transação do banco, classifica o erro se houver e grava o resultado atomicamente (sujeito a Rate Limiting RNF-14).")
    public ResponseEntity<ResultadoSubmissaoArenaSupabase> submeterBlocosDoAndar(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @RequestHeader(name = "Idempotency-Key", required = false) UUID chaveIdempotenciaRequisicao,
            @PathVariable UUID identificadorTentativaAndar,
            @Valid @RequestBody RequisicaoSubmissaoBlocos requisicaoSubmissao) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);

        // trava rate limit antes msm de validar ou tocar no banco (RNF-14)
        controladorLimiteTaxa.validarLimiteSubmissaoCodigo(usuarioAutenticado.identificadorUnicoJogador());

        RespostaBlocosEnviadaJogador respostaBlocos =
                new RespostaBlocosEnviadaJogador(requisicaoSubmissao.blocosEscolhidosPorLacuna());

        ResultadoSubmissaoArenaSupabase resultado = servicoCombate.submeterBlocosNaTentativaSupabase(
                usuarioAutenticado,
                chaveIdempotenciaRequisicao,
                identificadorTentativaAndar,
                respostaBlocos);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/submissoes/{identificadorSubmissao}/dica")
    @Operation(
            summary = "Solicitar dica pedagógica para submissão incorreta",
            description = "Libera no máximo 1 dica por submissão incorreta (até 3 por ciclo) com retry idempotente e Rate Limiting (RF-14 / RNF-14).")
    public ResponseEntity<ResultadoEntregaDicaPedagogica> solicitarDicaParaSubmissao(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @RequestHeader(name = "Idempotency-Key", required = false) UUID chaveIdempotenciaRequisicao,
            @PathVariable UUID identificadorSubmissao) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);

        controladorLimiteTaxa.validarLimiteSolicitacaoDica(usuarioAutenticado.identificadorUnicoJogador());

        ResultadoEntregaDicaPedagogica dica = servicoVidasDicas.solicitarDicaParaSubmissaoIncorreta(
                usuarioAutenticado,
                chaveIdempotenciaRequisicao,
                identificadorSubmissao);
        return ResponseEntity.ok(dica);
    }
}
