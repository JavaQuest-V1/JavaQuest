# JavaQuest — Contrato REST (Front Next.js ⇄ Backend Spring Boot)

Este arquivo lista as rotas que o front Next.js já consome. O backend Spring Boot
deve expor estas rotas com estes JSONs. Todas as rotas ficam em um único arquivo no
front: `src/modules/api/endpoints.ts`. Se o backend mudar algum caminho, basta alterar
esse arquivo.

## Regras gerais

- URL base: `NEXT_PUBLIC_API_URL` no `.env.local` (ex.: `http://localhost:8080`).
  Sem essa variável, o front roda em **modo Sandbox** (tudo local, sem backend).
- Formato: JSON (`Content-Type: application/json`).
- Autenticação: depois do login, o front envia `Authorization: Bearer <tokenJwt>` em
  todas as rotas, exceto `POST /api/auth/google`.
- CORS: liberar a origem do front (`http://localhost:3000` em desenvolvimento) e o
  header `Authorization` (RNF-13).
- Respostas de erro:
  - **4xx** = regra de negócio recusada (ex.: 409 troca de arma em combate,
    422 apelido inválido). O front mostra a mensagem e não aplica a ação.
    Mande a mensagem em `{ "message": "..." }` (padrão do Spring) ou `{ "erro": "..." }`.
  - **401** = JWT inválido/expirado. O front apaga o token e volta para `/login`.
  - **5xx / sem resposta** = o front segue no modo Sandbox e mostra o banner de reconexão.
- Rotas que não retornam nada podem responder `204 No Content`.

## Mapa de controllers

| Controller Spring Boot | @controller no front | @service no front |
| :--- | :--- | :--- |
| `AutenticacaoController` | `useAutenticacaoController` | `autenticacaoService` |
| `JogadorController` | `useJogadorController` | `jogadorService` |
| `CombateController` | `useCombateController` (módulo gameplay) | `combateService`, `vidasDicasService`, `checkpointService` |
| `MetricasController` | `useMetricasController` | `metricasDashboardService`, `metricasService` (gameplay) |

## AutenticacaoController (RF-01, RF-05, RNF-10)

### `POST /api/auth/google` (pública)
Request — fluxo oficial (botão Google):
```json
{ "googleIdToken": "<ID token do Google>" }
```
Request — modo local de testes (sem Client ID):
```json
{ "email": "nome@gmail.com", "nome": "Nome Sobrenome", "forceNew": false }
```
Response:
```json
{ "tokenJwt": "<JWT>", "primeiroAcesso": true, "email": "nome@gmail.com", "nome": "Nome", "fotoPerfil": "https://..." }
```
`primeiroAcesso: true` manda o jogador para o onboarding.

### `POST /api/auth/logout`
Request: `{ "tokenJwt": "<JWT>" }` · Response: `204`.

## JogadorController (RF-02, RF-03, RF-04, RF-07, RF-08)

### `POST /api/jogador/onboarding`
```json
{
  "email": "nome@gmail.com",
  "nome": "Nome Sobrenome",
  "apelido": "KELWIN",
  "nivelExperiencia": "INICIANTE | INTERMEDIARIO | AVANCADO",
  "canalAquisicao": "YOUTUBE | TIKTOK | INDICACAO | INSTAGRAM | OUTROS",
  "armamentoAtual": "ESPADA | CAJADO"
}
```
Response: `204` (ou o `ProgressoJogadorDTO`). O front já valida o apelido (2 a 20
caracteres: letras, números, espaço, `.`, `-`, `_`), mas o backend deve validar também.

### `PATCH /api/jogador/armamento`
Request: `{ "email": "nome@gmail.com", "armamento": "ESPADA | CAJADO" }`
Response: `ProgressoJogadorDTO`. Se o jogador estiver com andar em andamento, responder
`409` com a mensagem (RF-08).

### `GET /api/gameplay/sessao/{email}`
Response: `ProgressoJogadorDTO`.

## CombateController (RF-11, RF-13, RF-14, RF-17, RF-18, RF-20, RF-21)

### `POST /api/combate/andares/{numeroAndar}/iniciar`
Request: `{ "email": "nome@gmail.com", "evitarVariacaoAnterior": true }`
Response: `{ "desafio": DesafioAndar, "progresso": ProgressoJogadorDTO }`

### `POST /api/combate/turno`
Request:
```json
{ "email": "nome@gmail.com", "desafioId": "a4-v2", "numeroAndar": 4, "blocosMontados": ["int x = 5;"], "codigoJava": "int x = 5;" }
```
Response: `{ "resultado": ResultadoTurnoDTO, "progresso": ProgressoJogadorDTO }`

### `POST /api/vidas-dicas/dica`
Request: `{ "email": "nome@gmail.com", "numeroAndar": 4, "categoriaErro": "SINTAXE | LOGICA | METODO | TIPO_DE_DADO" }`
Response: `{ "dica": DicaPedagogica, "progresso": ProgressoJogadorDTO }` · sem dicas no ciclo: `409`.

### `POST /api/checkpoints/retomar`
Request: `{ "email": "nome@gmail.com" }` · Response: `ProgressoJogadorDTO`.

## MetricasController (RF-22, RF-23, RF-24)

### `GET /api/metricas/dashboard/{email}` — **rota nova, ainda não existe**
Enquanto não existir (404), o front usa os dados locais.
```json
{
  "apelido": "KELWIN", "armamentoAtual": "CAJADO", "nivelExperiencia": "INICIANTE",
  "andarAtual": 4, "checkpointAtual": 1, "xpTotal": 100, "xpSemana": 100,
  "streakDias": 3, "recordeStreakDias": 5, "tempoEstudoMinutos": 42,
  "totalTentativas": 8, "totalAcertos": 6, "andaresConcluidos": [1, 2, 3]
}
```

### `POST /api/metricas/tempo`
Request: `{ "email": "...", "segundosSessaoDelta": 30, "segundosNoAndarAtual": 95 }` · Response: `204`.

### `POST /api/metricas/ciclo`
Request: `{ "email": "...", "andarInicial": 1, "andarFinal": 10, "vidasGastas": 1, "dicasUsadas": 2 }` · Response: `204`.

### `GET /api/ranking`
Response:
```json
[ { "id": "nome@gmail.com", "apelido": "KELWIN", "arma": "CAJADO", "xpSemana": 100 } ]
```

## DTOs compartilhados

Os tipos completos (`ProgressoJogadorDTO`, `ResultadoTurnoDTO`, `DesafioAndar`,
`DicaPedagogica`) estão em `src/modules/gameplay/types/gameplay.ts`. Os DTOs da
plataforma estão em `src/modules/platform/types/api.ts`.
