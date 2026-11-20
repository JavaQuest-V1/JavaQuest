package com.javaquest.service;

import com.javaquest.dominio.Avatar;
import com.javaquest.dominio.Jogador;
import com.javaquest.dominio.ProgressoJogador;
import com.javaquest.dominio.SessaoAutenticada;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Objects;
import java.util.Optional;

public class AutenticacaoService {

    private static final String AVATAR_PADRAO_MODELO_3D = "avatar_padrao_3d.glb";

    private final JogadorRepository jogadorRepository;
    private final SessaoRepository sessaoRepository;
    private final GoogleOAuthClient googleOAuthClient;
    private final JwtTokenProvider jwtTokenProvider;
    private final TransactionRunner transactionRunner;

    public AutenticacaoService(
            JogadorRepository jogadorRepository,
            SessaoRepository sessaoRepository,
            GoogleOAuthClient googleOAuthClient,
            JwtTokenProvider jwtTokenProvider,
            TransactionRunner transactionRunner) {
        this.jogadorRepository = Objects.requireNonNull(jogadorRepository);
        this.sessaoRepository = Objects.requireNonNull(sessaoRepository);
        this.googleOAuthClient = Objects.requireNonNull(googleOAuthClient);
        this.jwtTokenProvider = Objects.requireNonNull(jwtTokenProvider);
        this.transactionRunner = Objects.requireNonNull(transactionRunner);
    }

    public AuthResult autenticarComGoogle(String credencialGoogle) {
        GoogleUserInfo userInfo = googleOAuthClient.validarCredencial(credencialGoogle);
        if (userInfo == null || userInfo.email() == null || userInfo.email().isBlank()) {
            throw new IllegalArgumentException("Credencial Google OAuth 2.0 inválida.");
        }

        Optional<Jogador> existente = jogadorRepository.buscarPorEmail(userInfo.email());
        boolean primeiroAcesso = existente.isEmpty();

        Jogador jogador = primeiroAcesso
                ? registrarPrimeiroAcesso(userInfo)
                : carregarProgresso(existente.get());

        SessaoAutenticada sessao = emitirJwt(jogador);
        return new AuthResult(jogador, sessao, primeiroAcesso);
    }

    public Jogador registrarPrimeiroAcesso(GoogleUserInfo userInfo) {
        Objects.requireNonNull(userInfo);
        return transactionRunner.runInTransaction(() -> {
            Jogador novo = new Jogador();
            novo.setEmail(userInfo.email());
            novo.setNome(userInfo.nome());
            novo.setFotoPerfil(userInfo.fotoPerfil());
            novo.setAvatar(new Avatar(AVATAR_PADRAO_MODELO_3D));
            novo.definirApelido(novo.sugerirApelido());

            ProgressoJogador progresso = new ProgressoJogador();
            progresso.setAndarAtual(1);
            progresso.setCheckpointAtual(1);
            progresso.setVidasRestantes(ProgressoJogador.MAX_VIDAS);
            progresso.setDicasRestantes(ProgressoJogador.MAX_DICAS);
            progresso.setAndarEmAndamento(false);
            novo.setProgresso(progresso);

            return jogadorRepository.salvar(novo);
        });
    }

    public Jogador carregarProgresso(Jogador jogador) {
        Objects.requireNonNull(jogador);
        return jogadorRepository.buscarPorEmail(jogador.getEmail()).orElse(jogador);
    }

    public SessaoAutenticada emitirJwt(Jogador jogador) {
        Objects.requireNonNull(jogador);
        Instant agora = Instant.now();
        Instant expiracaoInstant = agora.plus(jwtTokenProvider.getExpirationDuration());
        Date expiracao = Date.from(expiracaoInstant);
        String token = jwtTokenProvider.generateToken(jogador.getEmail(), agora, expiracaoInstant);

        SessaoAutenticada sessao = new SessaoAutenticada(token, expiracao, true);
        return sessaoRepository.salvar(token, sessao);
    }

    public void invalidarSessao(String tokenJwt) {
        if (tokenJwt == null || tokenJwt.isBlank()) {
            return;
        }
        transactionRunner.runInTransaction(() -> {
            sessaoRepository.buscarPorToken(tokenJwt).ifPresent(sessao -> {
                sessao.invalidar();
                sessaoRepository.salvar(tokenJwt, sessao);
            });
            return null;
        });
    }

    public record GoogleUserInfo(String email, String nome, String fotoPerfil) {
    }

    public record AuthResult(Jogador jogador, SessaoAutenticada sessao, boolean primeiroAcesso) {
    }

    public interface JogadorRepository {
        Optional<Jogador> buscarPorEmail(String email);
        Jogador salvar(Jogador jogador);
    }

    public interface SessaoRepository {
        Optional<SessaoAutenticada> buscarPorToken(String tokenJwt);
        SessaoAutenticada salvar(String tokenJwt, SessaoAutenticada sessao);
    }

    public interface GoogleOAuthClient {
        GoogleUserInfo validarCredencial(String credencialGoogle);
    }

    public interface JwtTokenProvider {
        Duration getExpirationDuration();
        String generateToken(String subject, Instant issuedAt, Instant expiresAt);
    }

    @FunctionalInterface
    public interface TransactionRunner {
        <T> T runInTransaction(TransactionalOperation<T> operation);
    }

    @FunctionalInterface
    public interface TransactionalOperation<T> {
        T execute();
    }
}