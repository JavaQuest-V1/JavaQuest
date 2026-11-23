package com.javaquest.controller;

import com.javaquest.dominio.TipoArmamentoHeroi;
import com.javaquest.dto.RequisicaoPreparacaoCiclo;
import com.javaquest.dto.RequisicaoTrocaArmamentoCiclo;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import com.javaquest.service.CheckpointService;
import com.javaquest.service.CheckpointService.EstadoTentativaCicloAtual;
import com.javaquest.service.CheckpointService.ResultadoAbandonoCiclo;
import com.javaquest.service.CheckpointService.ResultadoPreparacaoCiclo;
import com.javaquest.service.CheckpointService.ResultadoTrocaArmamentoCiclo;
import com.javaquest.service.CheckpointService.ResumoTrilhaCiclosJogador;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// expoe trilha de ciclos, checkpoints desbloqueados e abertura/troca de arma/abandono de runs (RF-08 a RF-12)
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Trilha de Ciclos e Checkpoints", description = "Consulta da trilha de 10 andares, preparação de ciclo, troca de arma em PREPARING e abandono.")
public class TrilhaCiclosController {

    private final CheckpointService servicoCheckpoint;

    public TrilhaCiclosController(CheckpointService servicoCheckpoint) {
        this.servicoCheckpoint = Objects.requireNonNull(servicoCheckpoint);
    }

    @GetMapping("/ciclos")
    @Operation(summary = "Listar trilha de ciclos e andares com status de desbloqueio")
    public ResponseEntity<ResumoTrilhaCiclosJogador> listarTrilhaCiclos(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        return ResponseEntity.ok(servicoCheckpoint.listarTrilhaCiclosEAndares(usuarioAutenticado));
    }

    @GetMapping("/tentativas-ciclo/atual")
    @Operation(summary = "Obter tentativa de ciclo aberta (PREPARING ou ACTIVE)", description = "Retorna 204 caso não exista run aberta.")
    public ResponseEntity<EstadoTentativaCicloAtual> obterTentativaCicloAtual(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        return servicoCheckpoint.obterTentativaCicloAberta(usuarioAutenticado)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/tentativas-ciclo")
    @Operation(summary = "Preparar nova tentativa de ciclo", description = "Cria run em PREPARING com 3 vidas e 3 dicas a partir do checkpoint do ciclo.")
    public ResponseEntity<ResultadoPreparacaoCiclo> prepararNovaTentativaCiclo(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @RequestHeader(name = "Idempotency-Key", required = false) UUID chaveIdempotenciaRequisicao,
            @Valid @RequestBody RequisicaoPreparacaoCiclo requisicaoPreparacao) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        TipoArmamentoHeroi armamento = TipoArmamentoHeroi.converterDeTexto(requisicaoPreparacao.tipoArmamento());

        ResultadoPreparacaoCiclo resultado = servicoCheckpoint.prepararNovaTentativaCiclo(
                usuarioAutenticado,
                chaveIdempotenciaRequisicao,
                requisicaoPreparacao.numeroCiclo(),
                armamento);
        return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
    }

    @PatchMapping("/tentativas-ciclo/{identificadorTentativaCiclo}/armamento")
    @Operation(summary = "Trocar armamento em preparação", description = "Permitido apenas enquanto a run está em PREPARING, antes de iniciar o primeiro andar (RF-08).")
    public ResponseEntity<ResultadoTrocaArmamentoCiclo> trocarArmamentoDaRun(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @RequestHeader(name = "Idempotency-Key", required = false) UUID chaveIdempotenciaRequisicao,
            @PathVariable UUID identificadorTentativaCiclo,
            @Valid @RequestBody RequisicaoTrocaArmamentoCiclo requisicaoTroca) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        TipoArmamentoHeroi novoArmamento = TipoArmamentoHeroi.converterDeTexto(requisicaoTroca.novoTipoArmamento());

        ResultadoTrocaArmamentoCiclo resultado = servicoCheckpoint.trocarArmamentoEmPreparacao(
                usuarioAutenticado,
                chaveIdempotenciaRequisicao,
                identificadorTentativaCiclo,
                novoArmamento);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/tentativas-ciclo/{identificadorTentativaCiclo}/abandonar")
    @Operation(summary = "Abandonar tentativa de ciclo aberta")
    public ResponseEntity<ResultadoAbandonoCiclo> abandonarTentativaCiclo(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @RequestHeader(name = "Idempotency-Key", required = false) UUID chaveIdempotenciaRequisicao,
            @PathVariable UUID identificadorTentativaCiclo) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        ResultadoAbandonoCiclo resultado = servicoCheckpoint.abandonarTentativaCiclo(
                usuarioAutenticado,
                chaveIdempotenciaRequisicao,
                identificadorTentativaCiclo);
        return ResponseEntity.ok(resultado);
    }
}
