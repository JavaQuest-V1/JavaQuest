package com.javaquest.dominio;

import java.util.List;
import java.util.UUID;

// payload seguro q o back devolve qnd inicia o andar (sem gabarito e sem marcar distrator)
public record InstanciaDesafioBlocosPublica(
        UUID identificadorTentativaAndar,
        Long identificadorDesafioNoBanco,
        int numeroAndarNaTorre,
        String chaveVarianteNoAndar,
        String tituloTemaPedagogico,
        String enunciadoDesafioResolvido,
        String templateCodigoComLacunasResolvido,
        List<String> identificadoresLacunasOrdenados,
        List<BlocoCodigoDisponivel> blocosDisponiveisEmbaralhados) {
}
