package com.javaquest.controller;

import com.javaquest.dto.RequisicaoLogoutJogador;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import com.javaquest.service.AutenticacaoService;
import com.javaquest.service.AutenticacaoService.ResultadoSincronizacaoGoogle;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// endpoints de saude e sincronizacao da sessao Google (Supabase Auth -> Backend Java)
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Autenticação e Sessão", description = "Sincronização do login Google via JWT do Supabase Auth e logout.")
public class AutenticacaoController {

    private final AutenticacaoService servicoAutenticacao;

    public AutenticacaoController(AutenticacaoService servicoAutenticacao) {
        this.servicoAutenticacao = Objects.requireNonNull(servicoAutenticacao);
    }

    // rota publica soh pro front e deploy checarem se a API subiu certinho
    @GetMapping("/saude")
    @Operation(summary = "Verifica saúde da API", description = "Endpoint público para checar se o backend está online.")
    public ResponseEntity<Map<String, Object>> verificarSaudeApi() {
        return ResponseEntity.ok(Map.of(
                "status", "ONLINE",
                "aplicacao", "JavaQuest",
                "instanteServidor", OffsetDateTime.now()));
    }

    @PostMapping("/autenticacao/sessao")
    @Operation(
            summary = "Sincronizar sessão após login Google",
            description = "Cria perfil/progresso no primeiro acesso (idempotente), abre sessão de estudo e indica se o onboarding está pendente (RF-01/RF-02).")
    public ResponseEntity<ResultadoSincronizacaoGoogle> sincronizarSessaoGoogle(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @RequestHeader(name = "Idempotency-Key", required = false) UUID chaveIdempotenciaRequisicao) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        ResultadoSincronizacaoGoogle resultado = servicoAutenticacao.sincronizarSessaoComGoogle(
                usuarioAutenticado,
                chaveIdempotenciaRequisicao);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/autenticacao/logout")
    @Operation(
            summary = "Encerrar sessão no backend",
            description = "Fecha a sessão de estudo ativa do jogador antes de encerrar o token no cliente Supabase Auth (RF-05).")
    public ResponseEntity<Void> encerrarSessaoJogador(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @RequestBody(required = false) RequisicaoLogoutJogador requisicaoLogout) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        UUID identificadorSessao = requisicaoLogout != null ? requisicaoLogout.identificadorSessaoEstudo() : null;
        servicoAutenticacao.encerrarSessaoJogador(usuarioAutenticado, identificadorSessao);
        return ResponseEntity.noContent().build();
    }
}
