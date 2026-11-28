import {
  CategoriaErro,
  DicaPedagogica,
  ProgressoJogadorDTO,
} from "../types/gameplay";
import { API_ROUTES } from "@api/endpoints";
import { novaChaveIdempotencia } from "@api/httpClient";
import { ResultadoEntregaDicaPedagogica } from "@api/backendTypes";
import { getFloorBlueprint } from "../data/challengesCatalog";
import { gameplayApiClient } from "./apiClient";
import { sandboxMockEngine } from "./sandboxMockEngine";
import { sessaoCombateBackend } from "./sessaoCombateBackend";

export interface SolicitarDicaResponse {
  dica: DicaPedagogica;
  progresso: ProgressoJogadorDTO;
}

/**
 * Camada @services (RNF-02) conectada ao `CombateController`
 * (`POST /api/v1/submissoes/{id}/dica`). A dica é sempre da última submissão
 * incorreta (1 por submissão, até 3 por ciclo — RF-14).
 */
export const vidasDicasService = {
  async solicitarDica(
    email: string,
    numeroAndar: number,
    categoriaErro: CategoriaErro
  ): Promise<SolicitarDicaResponse> {
    if (sessaoCombateBackend.usarSandbox()) {
      return sandboxMockEngine.solicitarDica(email, categoriaErro);
    }

    const estado = sessaoCombateBackend.estado;
    if (!estado.ultimaSubmissaoId) {
      throw new Error("A dica é liberada depois de uma tentativa incorreta.");
    }

    const res = await gameplayApiClient.requestJson<ResultadoEntregaDicaPedagogica>(
      API_ROUTES.combate.solicitarDica(estado.ultimaSubmissaoId),
      { method: "POST", headers: { "Idempotency-Key": novaChaveIdempotencia() } }
    );

    const categoria = estado.ultimaCategoriaErro ?? categoriaErro;
    if (res.quantidadeDicasRestantesNaRun < estado.dicas) estado.dicasUsadasNoCiclo += 1;
    estado.dicas = res.quantidadeDicasRestantesNaRun;

    // PRÓXIMA ATUALIZAÇÃO NO BACK: título da regra e exemplos certo/erro na resposta da dica.
    // Por enquanto vêm do catálogo do front para a categoria/andar.
    const modelo = getFloorBlueprint(numeroAndar).variacoes[0]?.dicas[categoria];

    return {
      dica: {
        texto: res.textoDicaPedagogica,
        categoriaErro: categoria,
        tituloRegra: modelo?.tituloRegra ?? "DICA DO MESTRE",
        exemploCerto: modelo?.exemploCerto ?? "",
        exemploErro: modelo?.exemploErro ?? "",
        dicasRestantes: res.quantidadeDicasRestantesNaRun,
      },
      progresso: sessaoCombateBackend.progresso(),
    };
  },
};
