package com.javaquest.controller;

import com.javaquest.dto.RequisicaoEventoTempoEstudo;
import com.javaquest.repository.RepositorioMetricasEstudoSupabase.RegistroHistoricoCicloBanco;
import com.javaquest.seguranca.UsuarioAutenticadoJwt;
import com.javaquest.service.MetricasService;
import com.javaquest.service.MetricasService.DadosEventoTempoEstudo;
import com.javaquest.service.MetricasService.ResultadoAberturaSessaoEstudo;
import com.javaquest.service.MetricasService.ResumoDashboardJogador;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// endpoints do dashboard, historico de runs e cronometro de sessao de estudo (RF-22, RF-23 e RF-24)
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Métricas, Dashboard e Sessões de Estudo", description = "Dashboard do jogador, streak oficial em America/Sao_Paulo, histórico de runs e cronômetro de estudo.")
public class MetricasController {

    private final MetricasService servicoMetricas;

    public MetricasController(MetricasService servicoMetricas) {
        this.servicoMetricas = Objects.requireNonNull(servicoMetricas);
    }

    @GetMapping("/metricas/dashboard")
    @Operation(summary = "Obter dashboard consolidado do jogador")
    public ResponseEntity<ResumoDashboardJogador> obterDashboardJogador(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        return ResponseEntity.ok(servicoMetricas.montarDashboardJogador(usuarioAutenticado));
    }

    @GetMapping("/metricas/historico-ciclos")
    @Operation(summary = "Listar histórico de tentativas de ciclo (vitórias, derrotas, abandonos e replays)")
    public ResponseEntity<List<RegistroHistoricoCicloBanco>> listarHistoricoCiclos(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        return ResponseEntity.ok(servicoMetricas.listarHistoricoCiclos(usuarioAutenticado));
    }

    @PostMapping("/sessoes-estudo/abrir")
    @Operation(summary = "Abrir ou recuperar sessão única de estudo ativa")
    public ResponseEntity<ResultadoAberturaSessaoEstudo> abrirSessaoEstudo(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        return ResponseEntity.ok(servicoMetricas.abrirOuRecuperarSessaoEstudo(usuarioAutenticado));
    }

    @PostMapping("/sessoes-estudo/{identificadorSessaoEstudo}/eventos-tempo")
    @Operation(
            summary = "Registrar intervalo de tempo ativo na sessão",
            description = "Idempotente por sequence_number; pausa após 300s sem interação no cliente e bloqueia sobreposição.")
    public ResponseEntity<Void> registrarEventoTempoEstudo(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @PathVariable UUID identificadorSessaoEstudo,
            @Valid @RequestBody RequisicaoEventoTempoEstudo requisicaoTempo) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);

        DadosEventoTempoEstudo dadosEvento = new DadosEventoTempoEstudo(
                identificadorSessaoEstudo,
                requisicaoTempo.numeroSequenciaEvento(),
                requisicaoTempo.identificadorTentativaAndar(),
                requisicaoTempo.inicioIntervalo(),
                requisicaoTempo.fimIntervalo(),
                requisicaoTempo.segundosAtivosNoIntervalo());

        servicoMetricas.registrarIntervaloTempoEstudo(usuarioAutenticado, dadosEvento);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sessoes-estudo/{identificadorSessaoEstudo}/encerrar")
    @Operation(summary = "Encerrar sessão de estudo ativa")
    public ResponseEntity<Void> encerrarSessaoEstudo(
            @AuthenticationPrincipal Jwt tokenJwtAutenticado,
            @PathVariable UUID identificadorSessaoEstudo) {
        UsuarioAutenticadoJwt usuarioAutenticado = UsuarioAutenticadoJwt.extrairDeTokenJwt(tokenJwtAutenticado);
        servicoMetricas.encerrarSessaoEstudo(usuarioAutenticado, identificadorSessaoEstudo);
        return ResponseEntity.noContent().build();
    }
}
