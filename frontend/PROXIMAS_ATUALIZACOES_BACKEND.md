# Próximas atualizações no backend

Funções que hoje existem **só no front** (estado salvo no `localStorage` do navegador,
em `accountService` / `PlayerAccountContext`). Enquanto o backend não tiver estas
regras, elas não são oficiais: somem ao trocar de navegador e não valem entre jogadores.
No código, cada ponto está marcado com `PRÓXIMA ATUALIZAÇÃO NO BACK`.

| # | Função | Onde está no front | O que o backend precisa ter |
| :--- | :--- | :--- | :--- |
| 1 | **XP** (ganho por andar, `xpTotal`, `xpSemana`, `xpHoje`) | `syncFloorVictory`, `sessaoCombateBackend.aplicarSubmissao` (usa `xpRecompensa` do `challengesCatalog`) | XP por andar no catálogo, somar no `submit` e devolver em `ResultadoSubmissaoArenaSupabase` e no dashboard |
| 2 | **Ranking semanal e divisões** (Bronze etc.) | `RankingView`, `metricasDashboardService.listarRanking()` (hoje devolve `[]`: aparece só o jogador atual) | `GET /api/v1/ranking` → `[{ id, apelido, arma, xpSemana }]` com reset semanal |
| 3 | **Missões diárias** (50 XP, 2 combates sem erro, 1 tópico) | `DEFAULT_ACCOUNT_STATE.missoes`, `syncFloorVictory`, `markTopicStudied` | Tabela de missões/progresso diário + rota de leitura |
| 4 | **Baús da trilha** (XP bônus + 1 dica extra) | `claimTrailChest` | Rota para resgatar baú (e somar dica na run, respeitando o limite de 3) |
| 5 | **Treino Livre** (`/praticar`, `/jogar?modo=treino`, vidas infinitas, Revisão de Erros, Zen, Sprint) | roda no `sandboxMockEngine` | Rotas de prática que não consomem vida/dica e não mexem no progresso da run |
| 6 | **Grimório – tópicos estudados** | `markTopicStudied` / `topicosEstudados` | Registrar tópico estudado por jogador |
| 7 | **Tutorial concluído** | `closeTutorial` / `tutorialConcluido` | Flag no perfil |
| 8 | **Nivelamento no onboarding** (começar no Andar 6) | `OnboardingView` → `pontoPartida: "NIVELAMENTO"` (ignorado com backend: começa no Andar 1) | Campo no onboarding e regra de desbloqueio inicial |
| 9 | **Precisão** (`totalTentativas`) | Perfil; hoje usa `max(local, totalVitoriasAndares)` | Total de submissões (corretas + incorretas) no dashboard |
| 10 | **Domínio por conceito e insígnias** | `conceptMastery` (derivado dos andares concluídos) | Agregação por tema/objetivo pedagógico |
| 11 | **Lista de andares concluídos** | `andaresAntesDe(andarAtual)` | Devolver os andares vencidos no dashboard ou em `GET /ciclos` |
| 12 | **Melhor tempo por bloco** (`melhorTempoBloco`) | Perfil (fixo `--:--`) | Calcular a partir de `floor_attempts`/eventos de tempo |
| 13 | **Título e exemplos certo/erro da dica** | `vidasDicasService` usa o `challengesCatalog` | Devolver `tituloRegra`, `exemploCerto`, `exemploErro` em `ResultadoEntregaDicaPedagogica` |
| 14 | **Visual do inimigo** (arquétipo, cor da aura, fala) | `sessaoCombateBackend.aplicarAbertura` usa o `challengesCatalog` | Usar `metadadosAnimacaoJson`/`urlSpritesheet2D` de `inimigosDoAndar` |
| 15 | **Arma preferida fora de uma run** | sem run aberta, a troca fica só no front até preparar a próxima run | `PATCH /api/v1/jogadores/eu/armamento-preferido` |
| 16 | **Jogar um andar específico já vencido** (clicar em qualquer nó da trilha) | `/jogar?andar=N` — com backend, vale o andar da run | Replay de andar/ciclo antigo sem afetar checkpoint |
| 17 | **Encerrar sessão de estudo ao fechar a aba** | não implementado | Usar `POST /sessoes-estudo/{id}/encerrar` com `navigator.sendBeacon` (o beacon não envia `Authorization`; o backend precisa de outra forma de autenticar) |

## Observações sobre o backend atual (branch `dev`)

- `POST /tentativas-andar/{id}/submissoes` responde **500** se faltar o header
  `Idempotency-Key` (`Objects.requireNonNull` vira `NullPointerException`, que cai no
  tratador genérico). O front sempre envia; vale devolver 400 no backend.
- `GET /api/v1/ciclos` (trilha com status de desbloqueio) já existe, mas a
  `TrailView` ainda desenha a trilha pelo catálogo do front + dados do dashboard.
