package com.javaquest.configuracao;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// trava a API como Resource Server stateless validando JWT do Supabase Auth (RNF-10 e RNF-13)
@Configuration
public class ConfiguracaoSegurancaApi {

    @Value("${javaquest.seguranca.origens-cors-permitidas:http://localhost:3000}")
    private String origensCorsPermitidasTexto;

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
