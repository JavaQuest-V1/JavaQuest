# JavaQuest — Contrato REST (Front Next.js ⇄ Backend Spring Boot)

O **backend é a fonte da verdade**. Este arquivo descreve como o front consome os
`@RestController` da branch `dev` (`src/main/java/com/javaquest/controller`).
Todas as rotas ficam em um único arquivo no front: `src/modules/api/endpoints.ts`.
Os tipos JSON (espelho dos records Java) estão em `src/modules/api/backendTypes.ts`.

Funções que ainda existem só no front estão em
[`PROXIMAS_ATUALIZACOES_BACKEND.md`](./PROXIMAS_ATUALIZACOES_BACKEND.md).

## Regras gerais

- URL base: `NEXT_PUBLIC_API_URL` (ex.: `http://localhost:8080`). Sem ela o front
  roda em **modo Sandbox** (motor local, sem backend).
- Todas as rotas ficam em `/api/v1` e exigem `Authorization: Bearer <JWT do Supabase Auth>`,
  exceto `GET /api/v1/saude` e o Swagger (`/swagger-ui.html`).
- **Login**: o front faz o OAuth Google pelo Supabase Auth (`@supabase/supabase-js`,
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). O backend
  valida o JWT (ES256/RS256, provedor `google`, sessão ativa). O token é lido da
  sessão Supabase a cada chamada (renovação automática).
- `Idempotency-Key` (UUID): enviado em todas as rotas que alteram estado. É
  **obrigatório** em `POST /tentativas-andar/{id}/submissoes`.
- Erros: `RespostaErroPadraoApi { codigoStatusHttp, codigoErro, mensagemErro, detalhesValidacao }`.
  - **4xx** = regra de negócio recusada (ex.: 409 `ARMAMENTO_TRAVADO_NA_RUN`). O front
    mostra `mensagemErro` e não aplica a ação.
  - **401** = JWT inválido/expirado: o front volta para `/login`.
  - **5xx / sem resposta**: no gameplay o erro aparece no console da arena (sem
    fallback silencioso para o Sandbox, pois o backend é a fonte da verdade).

## Mapa de controllers

| Controller Spring Boot | @controller no front | @service no front |
| :--- | :--- | :--- |
| `AutenticacaoController` | `useAutenticacaoController` | `autenticacaoService` |
| `JogadorController` | `useJogadorController` | `jogadorService` |
| `TrilhaCiclosController` | `useJogadorController` (arma) / `useCombateController` | `@api/trilhaCiclosApi`, `checkpointService` |
| `CombateController` | `useCombateController` (módulo gameplay) | `combateService`, `vidasDicasService` |
| `MetricasController` | `useMetricasController` / `useSessionTimerController` | `metricasDashboardService`, `metricasService` |

## Rotas consumidas

| Método | Rota | Onde o front usa |
| :--- | :--- | :--- |
| `POST` | `/api/v1/autenticacao/sessao` | Ao voltar do Google em `/login`: cria perfil, abre sessão de estudo, decide onboarding × trilha |
| `POST` | `/api/v1/autenticacao/logout` | Logout no Perfil (`{ identificadorSessaoEstudo }`) + `supabase.auth.signOut()` |
| `POST` | `/api/v1/jogadores/eu/onboarding` | Onboarding: `{ apelidoHeroi, nivelExperiencia, canalAquisicao, tipoArmamentoInicial }` |
| `GET` | `/api/v1/jogadores/eu` | `jogadorService.obterPerfil()` |
| `PATCH` | `/api/v1/jogadores/eu/apelido` | `jogadorService.atualizarApelido()` (ainda sem tela) |
| `GET` | `/api/v1/tentativas-ciclo/atual` | Ao entrar na arena e antes de trocar arma (204 = sem run) |
| `POST` | `/api/v1/tentativas-ciclo` | Abre run `{ numeroCiclo, tipoArmamento }` no 1º andar e após derrota (checkpoint) |
| `PATCH` | `/api/v1/tentativas-ciclo/{runId}/armamento` | Troca de arma com run em `PREPARING` (RF-08) |
| `POST` | `/api/v1/tentativas-ciclo/{runId}/andares/iniciar` | Abrir andar (o backend decide o andar e sorteia a variante) |
| `POST` | `/api/v1/tentativas-andar/{attemptId}/submissoes` | Atacar: `{ blocosEscolhidosPorLacuna: { LACUNA_1: "BLOCO_x", ... } }` |
| `POST` | `/api/v1/submissoes/{submissionId}/dica` | Dica da última submissão incorreta |
| `GET` | `/api/v1/metricas/dashboard` | Trilha, Perfil e Ranking (andar, checkpoint, streak, tempo, vitórias) |
| `POST` | `/api/v1/sessoes-estudo/abrir` | Cronômetro, quando não há sessão de estudo guardada |
| `POST` | `/api/v1/sessoes-estudo/{id}/eventos-tempo` | Cronômetro a cada 30 s de tempo ativo |

## Adaptações feitas no front (sem mudar as telas)

- **Blocos × lacunas**: a tela continua montando blocos em ordem. O `i`-ésimo bloco
  escolhido vai para `identificadoresLacunasOrdenados[i]`. O enunciado mostra o
  template com as lacunas como `___`.
- **Gabarito**: fica só no servidor. `blocosCorretos` tem o tamanho do número de
  lacunas (para o "tudo posicionado") e o código correto do modal de vitória é o
  `codigoJavaMontadoFinal` devolvido após o acerto.
- **Andar**: quem decide é a run do backend. O andar da URL `/jogar?andar=N` só serve
  para escolher o ciclo quando não há run aberta (nova run começa no checkpoint 1, 11, 21...).
- **Vitória no chefe** (`statusRunAtualizado = WON`): a run fecha; o próximo andar
  prepara automaticamente a run do ciclo seguinte.
- **Derrota** (`DEFEATED`): "voltar ao checkpoint" prepara uma nova run do mesmo ciclo.
- **Arma**: com run `PREPARING` troca no backend; com `ACTIVE` o front mostra a recusa;
  sem run, a arma escolhida é usada quando a próxima run for preparada.
- **Visual do inimigo** (arquétipo, cor, fala) continua do catálogo do front; o nome vem
  de `inimigosDoAndar`.
