# JavaQuest — Plataforma Completa Frontend (Next.js App Router)

Aplicação web completa do **JavaQuest** em **Next.js 15 + TypeScript + Tailwind CSS**, estruturada sob o padrão **`@controllers` e `@services` (`RNF-02`)** e com a interface de gameplay **100% isolada (`RNF-04`)** em `src/modules/gameplay/`.

---

## Como executar localmente (Frontend Next.js + Backend Java real)

1. **Subir o Backend Java** (conectado diretamente às classes reais de `JavaQuest/src/com/javaquest/`):
```bash
npm run dev:java
```
*(Inicia `JavaQuestApiServer` em `http://localhost:8080`, usando `AutenticacaoService`, `JogadorService`, `CombateService`, `ValidacaoJavaService`, `VidasDicasService`, `CheckpointService` e `MetricasService`.)*

2. **Subir o Frontend Next.js** (em outro terminal na raiz do workspace):
```bash
npm run dev
```

Acesse `http://localhost:3000` — o fluxo começa do início (**Login Google → Onboarding → Andar 1 com 0 XP + Tutorial Interativo**). Caso o backend Java não esteja rodando, a camada `@services` alterna automaticamente para o modo Sandbox local sem travar a interface.
- `/` e `/trilha` — **Trilha Guiada** (unidades, nós octogonais, Baú de Runas, Chefe do Andar 10, Checkpoint 11 e widgets laterais)
- `/jogar` — **Arena de Combate 2.5D Pixel-Art** (tela cheia com painel lateral retrátil de montagem de blocos Java)
- `/dicas` — **Dicas de Java • Grimório** (`CERTO` vs `ERRO` por categoria + prática direta)
- `/praticar` — **Treino Livre** (vidas infinitas, Revisão de Erros, Modo Zen, Sprint e Tópico Específico)
- `/ranking` — **Pontuação & Divisões** (Divisão Bronze dinâmica + Regras de Pontuação)
- `/perfil` — **Perfil do Aventureiro** (Ficha do Herói, troca controlada de Espada/Cajado, Logout, KPIs, Domínio e Insígnias)
- `/login` — **Conta do Herói** (OAuth Google 2.0 sem senhas locais, primeiro acesso vs recorrente)
- `/onboarding` — **Fluxo de Onboarding** (Apelido, Origem, Nível Java, Espada/Cajado e Ponto de Partida)

---

## Separação Modular (`RNF-02` e `RNF-04`)

```text
src/
├── app/                     # Rotas App Router (/trilha, /jogar, /dicas, /praticar, /ranking, /perfil, /login, /onboarding)
├── modules/
│   ├── platform/            # Interface do Usuário (UI System completa)
│   │   ├── types/
│   │   ├── services/        # @services da conta, grimório e ranking
│   │   ├── controllers/     # PlayerAccountContext sincronizado com o gameplay
│   │   └── components/      # Shell, Trilha, Grimório, Praticar, Ranking, Perfil, Login, Onboarding
│   └── gameplay/            # Interface do Jogo 100% ISOLADA (RNF-04)
│       ├── index.ts
│       ├── types/gameplay.ts
│       ├── data/challengesCatalog.ts
│       ├── services/        # @services REST + Sandbox Engine
│       ├── controllers/     # @controllers (combate, cronômetro 5 min, Web Audio)
│       └── components/      # Arena 2.5D Canvas 2D, Drawer Retrátil, HUD e Modais
```

---

## Integração com Backend Java (Spring Boot)

Defina `NEXT_PUBLIC_API_URL=https://sua-api-java` no `.env.local` para alternar automaticamente a camada `@services` do **Modo Sandbox** para requisições REST JSON com `Authorization: Bearer <JWT>`:

| Método | Endpoint | Serviço Java correspondente |
| :--- | :--- | :--- |
| `GET` | `/api/gameplay/sessao/{email}` | `JogadorService` |
| `POST` | `/api/combate/andares/{numeroAndar}/iniciar` | `CombateService` (sorteio anti-memorização RF-20/RF-21) |
| `POST` | `/api/combate/turno` | `CombateService` + `ValidacaoJavaService` |
| `POST` | `/api/vidas-dicas/dica` | `VidasDicasService` (máx. 3 dicas por ciclo RF-14) |
| `POST` | `/api/checkpoints/retomar` | `CheckpointService` (retorno ao checkpoint RF-11) |
| `PATCH` | `/api/jogador/armamento` | `JogadorService` (trava RF-08 fora de combate) |
| `POST` | `/api/metricas/tempo` | `MetricasService` (RF-24) |
| `POST` | `/api/metricas/ciclo` | `MetricasService` (RF-23 / histórico de ciclos) |
