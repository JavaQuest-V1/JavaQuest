# JavaQuest — Plataforma Completa Frontend (Next.js App Router)

Aplicação web completa do **JavaQuest** em **Next.js 15 + TypeScript + Tailwind CSS**, estruturada sob o padrão **`@controllers` e `@services` (`RNF-02`)** e com a interface de gameplay **100% isolada (`RNF-04`)** em `src/modules/gameplay/`.

---

## Como executar localmente (Frontend Next.js + Backend Spring Boot)

1. **Backend** (raiz do repositório, JDK 21+; precisa do `.env` com a senha do banco — ver `.env.example`):
```bash
./mvnw spring-boot:run
```
*(API em `http://localhost:8080/api/v1`, Swagger em `http://localhost:8080/swagger-ui.html`.)*

2. **Frontend** (pasta `frontend/`): copie `.env.example` para `.env.local`, preencha a
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e rode:
```bash
npm install
npm run dev
```

3. **Supabase Auth**: em *Authentication > URL Configuration*, adicione
   `http://localhost:3000/login` em *Redirect URLs*, e o provedor Google precisa estar ativo.

Acesse `http://localhost:3000` — o fluxo é **Login Google (Supabase) → Onboarding → Trilha → Arena**.
Sem `NEXT_PUBLIC_API_URL`, o front roda em modo Sandbox (motor local). O contrato das
rotas está em `API_CONTRATO.md` e o que ainda é só do front em `PROXIMAS_ATUALIZACOES_BACKEND.md`.

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

Ver [`API_CONTRATO.md`](./API_CONTRATO.md).
