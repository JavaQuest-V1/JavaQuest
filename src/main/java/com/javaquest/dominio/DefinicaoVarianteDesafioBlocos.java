package com.javaquest.dominio;

import java.util.List;

// receita completa de uma variante de desafio em blocos (fica soh no backend)
public record DefinicaoVarianteDesafioBlocos(
        Long identificadorDesafioNoBanco,
        int numeroAndarNaTorre,
        String chaveVarianteNoAndar,
        int numeroRevisaoVariante,
        String tituloTemaPedagogico,
        String enunciadoComMarcadores,
        String templateCodigoComLacunas,
        List<DefinicaoLacunaCodigo> lacunasObrigatorias,
        List<DefinicaoBlocoVariante> blocosDisponiveisNaVariante,
        List<DefinicaoParametroAleatorio> parametrosAleatoriosDaVariante,
        List<TipoAcaoHeroi> acoesHeroiComEspada,
        List<TipoAcaoHeroi> acoesHeroiComCajado,
        boolean varianteAtivaNoCatalogo) {

    // pega as acoes certas de acordo com a arma travada na run (espada aproxima e bate, cajado ataca de longe)
    public List<AcaoHeroi> resolverAcoesHeroiParaArmamento(String codigoArmamentoDaRun) {
        List<TipoAcaoHeroi> listaTiposAcoes = "STAFF".equalsIgnoreCase(codigoArmamentoDaRun)
                || "CAJADO".equalsIgnoreCase(codigoArmamentoDaRun)
                ? acoesHeroiComCajado
                : acoesHeroiComEspada;

        return listaTiposAcoes.stream()
                .map(AcaoHeroi::new)
                .toList();
    }
}
