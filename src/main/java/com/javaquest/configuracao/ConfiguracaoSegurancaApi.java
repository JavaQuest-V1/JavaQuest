package com.javaquest.configuracao;

import com.javaquest.seguranca.ValidadorClaimsTokenSupabase;
import com.javaquest.repository.RepositorioSessoesAutenticadas;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// trava a API como Resource Server stateless validando JWT ES256/RS256 do Supabase Auth (RNF-10 e RNF-13)
@Configuration
public class ConfiguracaoSegurancaApi {

    @Value("${javaquest.seguranca.origens-cors-permitidas:http://localhost:3000}")
    private String origensCorsPermitidasTexto;

    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String emissorJwtSupabase;

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String urlJwksSupabase;

    @Value("${javaquest.seguranca.exigir-provedor-google:true}")
    private boolean exigirProvedorGoogle;

    @Bean
    public SecurityFilterChain cadeiaFiltrosSegurancaApi(HttpSecurity configuradorHttp) throws Exception {
        configuradorHttp
                // api rest stateless com JWT nn usa sessao de cookie nem csrf tradicional
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sessao -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(autorizacao -> autorizacao
                        // libera soh health check e swagger; o resto td exige JWT valido do Supabase
                        .requestMatchers("/api/v1/saude", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(servidorRecursos -> servidorRecursos.jwt(Customizer.withDefaults()));

        return configuradorHttp.build();
    }

    // o projeto Supabase atual assina JWT com ES256 (EC P-256), ent precisa liberar ES256 alem de RS256 no Nimbus
    @Bean
    public JwtDecoder decodificadorJwtSupabase(RepositorioSessoesAutenticadas sessoesAutenticadas) {
        NimbusJwtDecoder decodificadorNimbus = NimbusJwtDecoder.withJwkSetUri(urlJwksSupabase)
                .jwsAlgorithms(algoritmosPermitidos -> {
                    algoritmosPermitidos.add(SignatureAlgorithm.ES256);
                    algoritmosPermitidos.add(SignatureAlgorithm.RS256);
                })
                .build();

        OAuth2TokenValidator<Jwt> validadorPadraoComEmissor =
                JwtValidators.createDefaultWithIssuer(emissorJwtSupabase);
        OAuth2TokenValidator<Jwt> validadorClaimsSupabase =
                new ValidadorClaimsTokenSupabase(exigirProvedorGoogle, sessoesAutenticadas);

        decodificadorNimbus.setJwtValidator(
                new DelegatingOAuth2TokenValidator<>(validadorPadraoComEmissor, validadorClaimsSupabase));
        return decodificadorNimbus;
    }

    @Bean
    public CorsConfigurationSource fonteConfiguracaoCors() {
        List<String> listaOrigensPermitidas = Arrays.stream(origensCorsPermitidasTexto.split(","))
                .map(String::trim)
                .filter(origem -> !origem.isEmpty())
                .toList();

        CorsConfiguration configuracaoCors = new CorsConfiguration();
        configuracaoCors.setAllowedOrigins(listaOrigensPermitidas);
        configuracaoCors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuracaoCors.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
        configuracaoCors.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource fonteRotas = new UrlBasedCorsConfigurationSource();
        fonteRotas.registerCorsConfiguration("/**", configuracaoCors);
        return fonteRotas;
    }
}
