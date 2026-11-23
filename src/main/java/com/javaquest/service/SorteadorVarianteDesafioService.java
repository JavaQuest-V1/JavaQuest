package com.javaquest.service;

import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import org.springframework.stereotype.Service;

// implementa o sorteio de codigo pra nn cair o msm desafio dps de derrota
@Service
public class SorteadorVarianteDesafioService {

    private final Random geradorAleatorioPadrao;

    public SorteadorVarianteDesafioService() {
        this.geradorAleatorioPadrao = new SecureRandom();
    }

    public DefinicaoVarianteDesafioBlocos sortearProximaVarianteDoAndar(
            List<DefinicaoVarianteDesafioBlocos> variantesCadastradasDoAndar,
            List<String> historicoChavesVariantesVistasEmOrdemCronologica) {
        return sortearProximaVarianteDoAndar(
                variantesCadastradasDoAndar,
                historicoChavesVariantesVistasEmOrdemCronologica,
                this.geradorAleatorioPadrao);
    }

    public DefinicaoVarianteDesafioBlocos sortearProximaVarianteDoAndar(
            List<DefinicaoVarianteDesafioBlocos> variantesCadastradasDoAndar,
            List<String> historicoChavesVariantesVistasEmOrdemCronologica,
            Random geradorAleatorioPersonalizado) {
        Objects.requireNonNull(variantesCadastradasDoAndar, "A lista de variantes do andar eh obrigatoria.");
        Random geradorEmUso = geradorAleatorioPersonalizado != null ? geradorAleatorioPersonalizado : this.geradorAleatorioPadrao;

        List<DefinicaoVarianteDesafioBlocos> variantesAtivas = variantesCadastradasDoAndar.stream()
                .filter(DefinicaoVarianteDesafioBlocos::varianteAtivaNoCatalogo)
                .toList();

        if (variantesAtivas.isEmpty()) {
            throw new IllegalStateException("Nenhuma variante ativa disponivel para sortear neste andar.");
        }

        if (historicoChavesVariantesVistasEmOrdemCronologica == null
                || historicoChavesVariantesVistasEmOrdemCronologica.isEmpty()
                || variantesAtivas.size() == 1) {
            return variantesAtivas.get(geradorEmUso.nextInt(variantesAtivas.size()));
        }

        // tenta primeiro pegar variantes q o jogador ainda nn viu nesse andar
        Set<String> conjuntoVariantesJaVistas = new HashSet<>(historicoChavesVariantesVistasEmOrdemCronologica);
        List<DefinicaoVarianteDesafioBlocos> variantesIneditas = variantesAtivas.stream()
                .filter(varianteAtual -> !conjuntoVariantesJaVistas.contains(varianteAtual.chaveVarianteNoAndar()))
                .toList();

        if (!variantesIneditas.isEmpty()) {
            return variantesIneditas.get(geradorEmUso.nextInt(variantesIneditas.size()));
        }

        // se ja rodou todas as variantes do andar, garante pelo menos q nn repete a ultima vista
        String ultimaChaveVarianteVista = historicoChavesVariantesVistasEmOrdemCronologica
                .get(historicoChavesVariantesVistasEmOrdemCronologica.size() - 1);

        List<DefinicaoVarianteDesafioBlocos> variantesDiferentesDaUltima = variantesAtivas.stream()
                .filter(varianteAtual -> !Objects.equals(varianteAtual.chaveVarianteNoAndar(), ultimaChaveVarianteVista))
                .toList();

        List<DefinicaoVarianteDesafioBlocos> listaElegivelFinal = variantesDiferentesDaUltima.isEmpty()
                ? variantesAtivas
                : variantesDiferentesDaUltima;

        return listaElegivelFinal.get(geradorEmUso.nextInt(listaElegivelFinal.size()));
    }
}
