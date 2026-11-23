"use client";

import { useCallback, useState } from "react";
import { NivelExperiencia, TipoArmamento } from "@gameplay/types/gameplay";
import { CanalAquisicao } from "../types/platform";
import { usePlayerAccount } from "./PlayerAccountContext";

export const APELIDO_MIN = 2;
export const APELIDO_MAX = 20;
const APELIDO_REGEX = /^[\p{L}\p{N} _.-]+$/u;

export interface DadosOnboarding {
  apelido: string;
  nivelExperiencia: NivelExperiencia;
  canalAquisicao: CanalAquisicao;
  armamentoAtual: TipoArmamento;
  pontoPartida?: "ZERO" | "NIVELAMENTO";
}

/**
 * @controller — Jogador (espelha `JogadorController` do Spring Boot).
 * RF-02 (apelido), RF-03 (nível), RF-04 (canal), RF-07 (arma inicial),
 * RF-08 (troca controlada de arma).
 *
 * Valida os dados antes de enviar ao `jogadorService`. Quem decide se a troca
 * de arma é permitida é o backend (RNF-11): se ele recusar, a mensagem aparece
 * em `erro` e a arma atual não muda.
 */
export function useJogadorController() {
  const { account, completeOnboarding, switchWeapon } = usePlayerAccount();

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /** RF-02: sugere o primeiro nome da Conta Google (`Jogador.sugerirApelido()`). */
  const sugerirApelido = useCallback((): string => {
    const primeiroNome = account.nomeGoogle.trim().split(/\s+/)[0] ?? "";
    return (account.apelido || primeiroNome || account.email.split("@")[0] || "").toUpperCase();
  }, [account.apelido, account.email, account.nomeGoogle]);

  const validarApelido = useCallback((apelido: string): string | null => {
    const limpo = apelido.trim();
    if (limpo.length < APELIDO_MIN) {
      return `O apelido precisa ter pelo menos ${APELIDO_MIN} caracteres.`;
    }
    if (limpo.length > APELIDO_MAX) {
      return `O apelido pode ter no máximo ${APELIDO_MAX} caracteres.`;
    }
    if (!APELIDO_REGEX.test(limpo)) {
      return "Use apenas letras, números, espaço, ponto, hífen ou _.";
    }
    return null;
  }, []);

  /** Envia o onboarding completo. Retorna `true` quando pode seguir para a trilha. */
  const registrarOnboarding = useCallback(
    async (dados: DadosOnboarding): Promise<boolean> => {
      const falha = validarApelido(dados.apelido);
      if (falha) {
        setErro(falha);
        return false;
      }

      setErro(null);
      setSalvando(true);
      const res = await completeOnboarding({
        apelido: dados.apelido.trim(),
        nivelExperiencia: dados.nivelExperiencia,
        canalAquisicao: dados.canalAquisicao,
        armamentoAtual: dados.armamentoAtual,
        pontoPartida: dados.pontoPartida ?? "ZERO",
      });
      setSalvando(false);

      if (!res.ok) {
        setErro(res.erro ?? "Não foi possível salvar seu perfil. Tente novamente.");
        return false;
      }
      return true;
    },
    [completeOnboarding, validarApelido]
  );

  /** RF-08: troca de Espada/Cajado fora de combate. Retorna `true` se trocou. */
  const trocarArmamento = useCallback(
    async (arma: TipoArmamento): Promise<boolean> => {
      setErro(null);
      setSalvando(true);
      const res = await switchWeapon(arma);
      setSalvando(false);

      if (!res.ok) {
        setErro(res.erro ?? "A troca de armamento não é permitida agora.");
        return false;
      }
      return true;
    },
    [switchWeapon]
  );

  return {
    salvando,
    erro,
    setErro,
    armamentoAtual: account.armamentoAtual,
    sugerirApelido,
    validarApelido,
    registrarOnboarding,
    trocarArmamento,
  };
}
