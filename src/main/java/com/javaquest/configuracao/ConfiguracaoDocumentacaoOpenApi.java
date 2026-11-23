package com.javaquest.configuracao;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// configura o Swagger/OpenAPI (RNF-26) com botao de Authorize Bearer JWT pro front testar facil
@Configuration
public class ConfiguracaoDocumentacaoOpenApi {

    public static final String NOME_ESQUEMA_SEGURANCA_JWT = "bearer-jwt";

    @Bean
    public OpenAPI especificacaoOpenApiJavaQuest() {
        SecurityScheme esquemaBearerJwt = new SecurityScheme()
                .name(NOME_ESQUEMA_SEGURANCA_JWT)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Cole aki o access_token JWT retornado pelo login Google no Supabase Auth.");

        return new OpenAPI()
                .info(new Info()
                        .title("Java Quest API")
                        .version("1.0.0")
                        .description("API REST do backend Java Quest (blocos rogue-lite, 10 andares, Supabase RLS)."))
                .addSecurityItem(new SecurityRequirement().addList(NOME_ESQUEMA_SEGURANCA_JWT))
                .components(new Components().addSecuritySchemes(NOME_ESQUEMA_SEGURANCA_JWT, esquemaBearerJwt));
    }
}
