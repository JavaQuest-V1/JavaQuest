package com.javaquest.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

// payload de tempo ativo consolidado pelo cronometro do cliente (pausa apos 300s sem interacao)
public record RequisicaoEventoTempoEstudo(
        @Min(value = 0, message = "Numero de sequencia do evento nao pode ser negativo.")
        long numeroSequenciaEvento,

        UUID identificadorTentativaAndar,

        @NotNull(message = "Inicio do intervalo eh obrigatorio.")
        OffsetDateTime inicioIntervalo,

        @NotNull(message = "Fim do intervalo eh obrigatorio.")
        OffsetDateTime fimIntervalo,

        @Min(value = 0, message = "Segundos ativos nao podem ser negativos.")
        int segundosAtivosNoIntervalo) {
}
