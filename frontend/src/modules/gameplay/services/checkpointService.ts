import { ProgressoJogadorDTO, TipoArmamento } from "../types/gameplay";
import { trilhaCiclosApi } from "@api/trilhaCiclosApi";
import { armamentoParaTela } from "@api/mapeadores";
import { sandboxMockEngine } from "./sandboxMockEngine";
import { sessaoCombateBackend } from "./sessaoCombateBackend";

/**
 * Camada @services (RNF-02) conectada ao `TrilhaCiclosController`
 * (`CheckpointService.java`): reinício no checkpoint e troca de arma em PREPARING.
 */
export const checkpointService = {
  /** RF-11: após a derrota, abre nova run no checkpoint do ciclo com 3 vidas e 3 dicas. */
  async retomarUltimoCheckpoint(email: string): Promise<ProgressoJogadorDTO> {
    if (sessaoCombateBackend.usarSandbox()) {
      return sandboxMockEngine.retomarDoUltimoCheckpoint(email);
    }

    const estado = sessaoCombateBackend.estado;
    const aberta = await trilhaCiclosApi.obterTentativaAtual();
    if (aberta) {
      sessaoCombateBackend.aplicarRunAberta(aberta);
    } else {
      const preparada = await trilhaCiclosApi.prepararTentativa(estado.numeroCiclo, estado.armamento);
      sessaoCombateBackend.aplicarRunPreparada(preparada);
    }
    return sessaoCombateBackend.progresso();
  },

  /** RF-08: só com a run em PREPARING (antes do 1º andar). Sem run, vale para a próxima. */
  async trocarArmamentoNoCheckpoint(
    email: string,
    armamento: TipoArmamento
  ): Promise<ProgressoJogadorDTO> {
    if (sessaoCombateBackend.usarSandbox()) {
      return sandboxMockEngine.trocarArmamento(email, armamento);
    }

    const res = await trilhaCiclosApi.trocarArmamentoForaDeCombate(armamento);
    sessaoCombateBackend.estado.armamento = res
      ? armamentoParaTela(res.codigoArmamentoAtualizado, armamento)
      : armamento;
    return sessaoCombateBackend.progresso();
  },
};
