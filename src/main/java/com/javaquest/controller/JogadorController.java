package com.javaquest.controller;

import com.javaquest.dominio.TipoArmamentoHeroi;
import com.javaquest.dto.RequisicaoAtualizacaoApelido;
import com.javaquest.dto.RequisicaoOnboardingJogador;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroAparenciaHeroi2D;
import com.javaquest.repository.RepositorioCatalogoBancoSupabase.RegistroArmamentoCatalogo2D;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import com.javaquest.service.JogadorService;
import com.javaquest.service.JogadorService.DadosOnboardingJogador;
import com.javaquest.service.JogadorService.PerfilCompletoJogador;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// controla perfil do jogador, conclusao de onboarding e catalogos 2D (RF-02 a RF-07)
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Jogador e Catálogo 2D", description = "Perfil do jogador, onboarding, apelido e catálogos de armas/aparência 2D.")
public class JogadorController {

    private final JogadorService servicoJogador;

    public JogadorController(JogadorService servicoJogador) {
        this.servicoJogador = Objects.requireNonNull(servicoJogador);
    }

    @GetMapping("/jogadores/eu")
    @Operation(summary = "Obter perfil completo do jogador logado")
    public ResponseEntity<PerfilCompletoJogador> obterMeuPerfil(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        return ResponseEntity.ok(servicoJogador.obterPerfilCompleto(usuarioAutenticado));
    }

    @PostMapping("/jogadores/eu/onboarding")
    @Operation(
            summary = "Concluir onboarding do jogador",
            description = "Grava apelido, nível de experiência, canal de aquisição e armamento inicial (SWORD/STAFF) de forma idempotente.")
    public ResponseEntity<PerfilCompletoJogador> concluirOnboarding(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @RequestHeader(name = "Idempotency-Key", required = false) UUID chaveIdempotenciaRequisicao,
            @Valid @RequestBody RequisicaoOnboardingJogador requisicaoOnboarding) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        TipoArmamentoHeroi armamentoConvertido =
                TipoArmamentoHeroi.converterDeTexto(requisicaoOnboarding.tipoArmamentoInicial());

        DadosOnboardingJogador dadosOnboarding = new DadosOnboardingJogador(
                requisicaoOnboarding.apelidoHeroi(),
                requisicaoOnboarding.nivelExperiencia(),
                requisicaoOnboarding.canalAquisicao(),
                armamentoConvertido);

        PerfilCompletoJogador perfilAtualizado = servicoJogador.concluirOnboardingJogador(
                usuarioAutenticado,
                chaveIdempotenciaRequisicao,
                dadosOnboarding);
        return ResponseEntity.ok(perfilAtualizado);
    }

    @PatchMapping("/jogadores/eu/apelido")
    @Operation(summary = "Atualizar apelido do herói")
    public ResponseEntity<PerfilCompletoJogador> atualizarApelido(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @Valid @RequestBody RequisicaoAtualizacaoApelido requisicaoApelido) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        PerfilCompletoJogador perfilAtualizado = servicoJogador.atualizarApelidoJogador(
                usuarioAutenticado,
                requisicaoApelido.novoApelidoHeroi());
        return ResponseEntity.ok(perfilAtualizado);
    }

    @GetMapping("/catalogo/armamentos")
    @Operation(summary = "Listar armamentos 2D ativos (Espada e Cajado)")
    public ResponseEntity<List<RegistroArmamentoCatalogo2D>> listarArmamentosAtivos() {
        return ResponseEntity.ok(servicoJogador.listarArmamentosAtivos());
    }

    @GetMapping("/catalogo/aparencia")
    @Operation(summary = "Obter aparência padrão 2D do herói")
    public ResponseEntity<RegistroAparenciaHeroi2D> obterAparenciaPadraoHeroi() {
        return ResponseEntity.ok(servicoJogador.obterAparenciaPadraoHeroi());
    }
}
