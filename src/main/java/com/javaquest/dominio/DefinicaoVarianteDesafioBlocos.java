package com.javaquest.dominio;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
        boolean varianteAtivaNoCatalogo,
        String parametroQuantidadeAtaques,
        List<String> parametrosAtaquesCondicionais,
        Integer valorMinimoAtaque) {

    public List<AcaoHeroi> resolverAcoesHeroiParaArmamento(
            String codigoArmamentoDaRun, Map<String, String> valoresSorteados) {
        List<TipoAcaoHeroi> tiposDeAcao = switch (codigoArmamentoDaRun) {
            case "STAFF", "CAJADO" -> acoesHeroiComCajado;
            case "SWORD", "ESPADA" -> acoesHeroiComEspada;
            default -> throw new IllegalArgumentException("Armamento desconhecido: " + codigoArmamentoDaRun);
        };
        int quantidadeAtaques = calcularQuantidadeAtaques(valoresSorteados);
        List<AcaoHeroi> acoes = new ArrayList<>();
        for (TipoAcaoHeroi tipo : tiposDeAcao) {
            int repeticoes = tipo == TipoAcaoHeroi.ATACAR ? quantidadeAtaques : 1;
            for (int indice = 0; indice < repeticoes; indice++) {
                acoes.add(new AcaoHeroi(tipo));
            }
        }
        return List.copyOf(acoes);
    }

    private int calcularQuantidadeAtaques(Map<String, String> valoresSorteados) {
        if (parametroQuantidadeAtaques != null) {
            return Integer.parseInt(valoresSorteados.get(parametroQuantidadeAtaques));
        }
        if (parametrosAtaquesCondicionais == null) {
            return 1;
        }
        return Math.toIntExact(parametrosAtaquesCondicionais.stream()
                .map(valoresSorteados::get)
                .mapToInt(Integer::parseInt)
                .filter(valor -> valor >= valorMinimoAtaque)
                .count());
    }
}
