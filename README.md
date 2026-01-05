# Tormenta 20 OS

Ferramenta privada para rodar mesas Tormenta 20 com Next.js (App Router) + TypeScript, Tailwind + shadcn/ui e Prisma com PostgreSQL.

## Como rodar

1. Configure o `.env` com `DATABASE_URL` (já existe um exemplo).
2. Suba o banco:
   ```bash
   docker compose up -d
   ```
3. Instale dependências:
   ```bash
   npm install
   ```
4. Rode as migrações Prisma:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Suba o app:
   ```bash
   npm run dev
   ```
6. Acesse `http://localhost:3000`.

## Rotas principais

- `/` Landing premium temática Tormenta 20.
- `/app` Dashboard de campanhas com criação/listagem.
- `/app/campaign/[id]` Cockpit da campanha com tabs (Personagens CRUD + placeholders).
- APIs:
  - `GET/POST /api/campaigns`
  - `GET/POST /api/campaigns/[id]/characters`

## Próximos passos

- Compêndio vivo com filtros e IA de resumo.
- Mesa ao vivo com rolagens, timers e log de eventos.
- Sessões com gravação, replay textual e compartilhamento.
- Autenticação e RBAC simples para grupos e convidados.
