# Tormenta 20 OS

Ferramenta privada para rodar mesas Tormenta 20 com Next.js (App Router) + TypeScript, Tailwind + shadcn/ui e Prisma com PostgreSQL.

## Como rodar (Docker Only)

Este projeto foi configurado para rodar completamente em Docker, tanto o banco de dados quanto a aplicação, simulando um ambiente de servidor local.

### Quick Start
1. **Suba tudo (App + Banco)**:
   ```bash
   docker-compose up -d
   ```
   > O app estará disponível em `http://localhost:3000`.
   > O banco de dados estará acessível internamente pelo app.

2. **Parar tudo**:
   ```bash
   docker-compose down
   ```

### Desenvolvimento
- **Hot Reload**: O código local é espelhado para dentro do container. **Você NÃO precisa dar build a cada mudança.** Basta salvar o arquivo e o navegador atualizará.
- **Instalar Dependências**: Se você adicionar uma nova lib no `package.json`, precisará rebuildar:
  ```bash
  docker-compose up -d --build
  ```
- **Banco de Dados**: O Prisma conecta automaticamente. Se mudar o schema, rode:
  ```bash
  npx prisma db push
  ```


## Rotas principais

- `/` Landing premium temática Tormenta 20.
- `/app` Dashboard de campanhas com criação/listagem.
- `/app/campaign/[id]` Cockpit da campanha com tabs (Personagens CRUD + placeholders).
- `/app/campaign/[id]` aba Combate (V0) com iniciativa/turno/ataque simples e ações pela ficha.
- APIs:
  - `GET/POST /api/campaigns`
  - `GET/POST /api/campaigns/[id]/characters`
  - Fichas: `GET/PUT /api/characters/[id]/sheet`
  - Combate: `GET/POST/DELETE /api/campaigns/[id]/combat`, iniciativa/turno/ação/aplicar, `POST /api/combat/attack-from-sheet`

## Próximos passos

- Compêndio vivo com filtros e IA de resumo.
- Mesa ao vivo com rolagens, timers e log de eventos.
- Sessões com gravação, replay textual e compartilhamento.
- Autenticação e RBAC simples para grupos e convidados.
