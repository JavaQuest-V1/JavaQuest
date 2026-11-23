package com.javaquest.service;

import com.javaquest.dominio.BlocoCodigoDisponivel;
import com.javaquest.dominio.CategoriaErro;
import com.javaquest.dominio.DefinicaoBlocoVariante;
import com.javaquest.dominio.DefinicaoLacunaCodigo;
import com.javaquest.dominio.DefinicaoParametroAleatorio;
import com.javaquest.dominio.DefinicaoVarianteDesafioBlocos;
import com.javaquest.dominio.InstanciaDesafioBlocosPublica;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.UUID;
import org.springframework.stereotype.Service;

// gera os valores aleatorios e embaralha os blocos usando o attempt_id como semente
@Service
public class GeradorInstanciaDesafioBlocos {

    // msm attempt_id sempre gera a msm instancia (pro F5 nn quebrar o jogo), outro id gera tudo novo
    public InstanciaInternaDesafioBlocos gerarInstanciaParaTentativa(
            DefinicaoVarianteDesafioBlocos definicaoVariante,
            UUID identificadorTentativaAndar) {
        Objects.requireNonNull(definicaoVariante, "A definicao da variante eh obrigatoria.");
        Objects.requireNonNull(identificadorTentativaAndar, "O id da tentativa do andar eh obrigatorio.");

        long sementeDeterministicaTentativa = calcularSementeDaTentativa(identificadorTentativaAndar, definicaoVariante);
        Random geradorAleatorioDaTentativa = new Random(sementeDeterministicaTentativa);

        // sorteia primeiro os valores dos parametros variaveis (ex: numeros de dano, vida, limite do for)
        Map<String, String> valoresParametrosSorteados = sortearValoresParametros(
                definicaoVariante.parametrosAleatoriosDaVariante(),
                geradorAleatorioDaTentativa);

        String enunciadoResolvido = aplicarParametrosNoTexto(
                definicaoVariante.enunciadoComMarcadores(),
                valoresParametrosSorteados);

        String templateCodigoResolvido = aplicarParametrosNoTexto(
                definicaoVariante.templateCodigoComLacunas(),
                valoresParametrosSorteados);

        // resolve o gabarito de cada lacuna com os msm valores sorteados
        Map<String, LacunaResolvidaInterna> mapaGabaritoPorLacuna = new LinkedHashMap<>();
        List<String> identificadoresLacunasOrdenados = new ArrayList<>();
        for (DefinicaoLacunaCodigo lacunaAtual : definicaoVariante.lacunasObrigatorias()) {
            List<String> respostasResolvidas = lacunaAtual.respostasValidasComMarcadores().stream()
                    .map(resposta -> aplicarParametrosNoTexto(resposta, valoresParametrosSorteados).trim())
                    .toList();
            mapaGabaritoPorLacuna.put(
                    lacunaAtual.identificadorLacuna(),
                    new LacunaResolvidaInterna(
                            lacunaAtual.identificadorLacuna(),
                            lacunaAtual.categoriaErroPadraoDaLacuna(),
                            respostasResolvidas));
            identificadoresLacunasOrdenados.add(lacunaAtual.identificadorLacuna());
        }

        // resolve os textos dos blocos e embaralha td pra ngm decorar a ordem dos botoes
        List<DefinicaoBlocoVariante> blocosParaEmbaralhar = new ArrayList<>(definicaoVariante.blocosDisponiveisNaVariante());
        Collections.shuffle(blocosParaEmbaralhar, geradorAleatorioDaTentativa);

        List<BlocoCodigoDisponivel> blocosPublicosEmbaralhados = new ArrayList<>();
        Map<String, BlocoResolvidoInterno> mapaBlocosInternosPorCodigo = new LinkedHashMap<>();

        for (int indiceBloco = 0; indiceBloco < blocosParaEmbaralhar.size(); indiceBloco++) {
            DefinicaoBlocoVariante blocoOriginal = blocosParaEmbaralhar.get(indiceBloco);
            String codigoEfemeroBloco = "BLOCO_" + (indiceBloco + 1);
            String textoBlocoResolvido = aplicarParametrosNoTexto(
                    blocoOriginal.textoCodigoComMarcadores(),
                    valoresParametrosSorteados).trim();

            blocosPublicosEmbaralhados.add(new BlocoCodigoDisponivel(codigoEfemeroBloco, textoBlocoResolvido));
            mapaBlocosInternosPorCodigo.put(
                    codigoEfemeroBloco,
                    new BlocoResolvidoInterno(
                            codigoEfemeroBloco,
                            textoBlocoResolvido,
                            blocoOriginal.blocoEhRespostaCorreta(),
                            blocoOriginal.categoriaErroSeEscolhidoErrado()));
        }

        InstanciaDesafioBlocosPublica visaoPublicaParaArena = new InstanciaDesafioBlocosPublica(
                identificadorTentativaAndar,
                definicaoVariante.identificadorDesafioNoBanco(),
                definicaoVariante.numeroAndarNaTorre(),
                definicaoVariante.chaveVarianteNoAndar(),
                definicaoVariante.tituloTemaPedagogico(),
                enunciadoResolvido,
                templateCodigoResolvido,
                Collections.unmodifiableList(identificadoresLacunasOrdenados),
                Collections.unmodifiableList(blocosPublicosEmbaralhados));

        return new InstanciaInternaDesafioBlocos(
                visaoPublicaParaArena,
                Collections.unmodifiableMap(mapaBlocosInternosPorCodigo),
                Collections.unmodifiableMap(mapaGabaritoPorLacuna),
                Collections.unmodifiableMap(valoresParametrosSorteados));
    }

    private long calcularSementeDaTentativa(
            UUID identificadorTentativaAndar,
            DefinicaoVarianteDesafioBlocos definicaoVariante) {
        long sementeBaseUuid = identificadorTentativaAndar.getMostSignificantBits()
                ^ identificadorTentativaAndar.getLeastSignificantBits();
        long deslocamentoVariante = Objects.hash(
                definicaoVariante.numeroAndarNaTorre(),
                definicaoVariante.chaveVarianteNoAndar(),
                definicaoVariante.numeroRevisaoVariante());
        return sementeBaseUuid ^ (deslocamentoVariante * 31L);
    }

    private Map<String, String> sortearValoresParametros(
            List<DefinicaoParametroAleatorio> listaParametros,
            Random geradorAleatorio) {
        Map<String, String> mapaValoresSorteados = new LinkedHashMap<>();
        if (listaParametros == null || listaParametros.isEmpty()) {
            return mapaValoresSorteados;
        }
        for (DefinicaoParametroAleatorio parametroAtual : listaParametros) {
            List<String> opcoesDisponiveis = parametroAtual.valoresPossiveisParaSorteio();
            if (opcoesDisponiveis == null || opcoesDisponiveis.isEmpty()) {
                continue;
            }
            int indiceSorteado = geradorAleatorio.nextInt(opcoesDisponiveis.size());
            mapaValoresSorteados.put(
                    parametroAtual.nomeMarcadorParametro(),
                    opcoesDisponiveis.get(indiceSorteado));
        }
        return mapaValoresSorteados;
    }

    private String aplicarParametrosNoTexto(String textoBaseComMarcadores, Map<String, String> valoresParametrosSorteados) {
        if (textoBaseComMarcadores == null) {
            return "";
        }
        String textoFinalResolvido = textoBaseComMarcadores;
        for (Map.Entry<String, String> entradaParametro : valoresParametrosSorteados.entrySet()) {
            textoFinalResolvido = textoFinalResolvido.replace(
                    "{{" + entradaParametro.getKey() + "}}",
                    entradaParametro.getValue());
        }
        return textoFinalResolvido;
    }

    public record BlocoResolvidoInterno(
            String codigoIdentificadorBloco,
            String textoCodigoResolvido,
            boolean blocoEhRespostaCorreta,
            CategoriaErro categoriaErroSeEscolhidoErrado) {
    }

    public record LacunaResolvidaInterna(
            String identificadorLacuna,
            CategoriaErro categoriaErroPadraoDaLacuna,
            List<String> respostasValidasResolvidas) {
    }

    // guarda junto a visao publica e o gabarito privado pra validacao no back
    public record InstanciaInternaDesafioBlocos(
            InstanciaDesafioBlocosPublica visaoPublicaParaArena,
            Map<String, BlocoResolvidoInterno> mapaBlocosInternosPorCodigo,
            Map<String, LacunaResolvidaInterna> mapaGabaritoPorLacuna,
            Map<String, String> valoresParametrosSorteados) {
    }
}
