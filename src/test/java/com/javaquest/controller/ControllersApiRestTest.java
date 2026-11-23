package com.javaquest.controller;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.javaquest.excecao.ExcecaoLimiteTaxaExcedido;
import com.javaquest.excecao.TratadorGlobalExcecoesApi;
import com.javaquest.seguranca.ControladorLimiteTaxaRequisicoes;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

// testa os controllers REST, protecao 401 sem JWT, validacao 400, OpenAPI, Rate Limiting 429 e mapeamento de erros
@SpringBootTest
class ControllersApiRestTest {

    @Autowired
    private WebApplicationContext contextoWeb;

    private MockMvc clienteMockMvc;

    @BeforeEach
    void prepararMockMvcComSeguranca() {
        this.clienteMockMvc = MockMvcBuilders
                .webAppContextSetup(contextoWeb)
                .apply(springSecurity())
                .build();
    }

    @Test
    void deveLiberarHealthCheckEDocumentacaoOpenApiSemAutenticacao() throws Exception {
        clienteMockMvc.perform(get("/api/v1/saude"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ONLINE"))
                .andExpect(jsonPath("$.aplicacao").value("JavaQuest"));

        // confirma q o Swagger/OpenAPI (RNF-26) esta de pe e expondo os endpoints pro front
        clienteMockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Java Quest API")))
                .andExpect(content().string(containsString("/api/v1/autenticacao/sessao")))
                .andExpect(content().string(containsString("/api/v1/tentativas-andar/{identificadorTentativaAndar}/submissoes")));
    }

    @Test
    void deveRetornar401QuandoChamarRotasProtegidasSemJwt() throws Exception {
        clienteMockMvc.perform(get("/api/v1/jogadores/eu"))
                .andExpect(status().isUnauthorized());

        clienteMockMvc.perform(post("/api/v1/autenticacao/sessao"))
                .andExpect(status().isUnauthorized());

        clienteMockMvc.perform(get("/api/v1/metricas/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deveValidarCorpoDtoERetornar400PadronizadoComJwtAutenticado() throws Exception {
        UUID jogadorSimulado = UUID.fromString("dddddddd-4444-4444-8444-444444444444");

        // onboarding sem apelido e sem enums obrigatorios -> 400 DADOS_INVALIDOS
        clienteMockMvc.perform(post("/api/v1/jogadores/eu/onboarding")
                        .with(jwt().jwt(construtor -> construtor
                                .subject(jogadorSimulado.toString())
                                .audience(List.of("authenticated"))
                                .claim("role", "authenticated")
                                .claim("app_metadata", Map.of("provider", "google"))))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "apelidoHeroi": "",
                                  "tipoArmamentoInicial": ""
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigoStatusHttp").value(400))
                .andExpect(jsonPath("$.codigoErro").value("DADOS_INVALIDOS"));

        // submissao com mapa de blocos vazio -> 400 DADOS_INVALIDOS
        clienteMockMvc.perform(post("/api/v1/tentativas-andar/" + UUID.randomUUID() + "/submissoes")
                        .with(jwt().jwt(construtor -> construtor
                                .subject(jogadorSimulado.toString())
                                .audience(List.of("authenticated"))
                                .claim("role", "authenticated")
                                .claim("app_metadata", Map.of("provider", "google"))))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"blocosEscolhidosPorLacuna\": {}}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigoErro").value("DADOS_INVALIDOS"));
    }

    @Test
    void deveBloquearExcessoDeRequisicoesNoRateLimiterEMapearErrosDoBancoSemVazarSql() {
        // testa rate limiter configurado pra 2 submissoes por minuto -> 3a chamada barra com 429
        ControladorLimiteTaxaRequisicoes limitador = new ControladorLimiteTaxaRequisicoes(2, 1);
        UUID jogadorId = UUID.randomUUID();

        limitador.validarLimiteSubmissaoCodigo(jogadorId);
        limitador.validarLimiteSubmissaoCodigo(jogadorId);
        assertThrows(ExcecaoLimiteTaxaExcedido.class, () -> limitador.validarLimiteSubmissaoCodigo(jogadorId));

        limitador.validarLimiteSolicitacaoDica(jogadorId);
        assertThrows(ExcecaoLimiteTaxaExcedido.class, () -> limitador.validarLimiteSolicitacaoDica(jogadorId));

        // testa mapeamento seguro de erros PL/pgSQL no TratadorGlobalExcecoesApi
        TratadorGlobalExcecoesApi tratador = new TratadorGlobalExcecoesApi();
        MockHttpServletRequest requisicao = new MockHttpServletRequest("POST", "/api/v1/tentativas-ciclo");

        var respIdempotencia = tratador.tratarErroBancoDados(
                new DataIntegrityViolationException("ERROR: Idempotency key reused with different payload"),
                requisicao);
        assertEquals(409, respIdempotencia.getStatusCode().value());
        assertEquals("CONFLITO_IDEMPOTENCIA", respIdempotencia.getBody().codigoErro());

        var respArmaTravada = tratador.tratarErroBancoDados(
                new DataIntegrityViolationException("ERROR: Weapon locked for this run"),
                requisicao);
        assertEquals(409, respArmaTravada.getStatusCode().value());
        assertEquals("ARMAMENTO_TRAVADO_NA_RUN", respArmaTravada.getBody().codigoErro());
    }
}
