# Blog Admin

Painel de administração para um blog — backend em NestJS com Prisma, Redis e autenticação JWT.

**Status:** Em desenvolvimento

**Tecnologias principais:** NestJS, TypeScript, Prisma (Postgres), Redis, Jest

**Visão geral**
- **Descrição**: Este repositório contém a API de administração do blog (cadastro/login de administradores, CRUD de artigos, auditoria, convites, etc.).
- **Arquitetura**: API modularizada em `src/modules` com integração ao banco via Prisma e persistência de sessão em Redis.

**Pré-requisitos**
- Node.js 18+ e npm/yarn
- Postgres (ou outro PostgreSQL compatível com `POSTGRES_URL`)
- Redis para sessões e tokens de refresh

**Instalação**
```bash
npm install
# (opcional) gerar client Prisma
# npx prisma generate
```

**Variáveis de ambiente (exemplo)**
- `POSTGRES_URL` — string de conexão PostgreSQL
- `REDIS_URL` — URL do Redis (padrão: `redis://127.0.0.1:6379`)
- `SESSION_SECRET` — segredo das sessões express
- `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — segredos JWT
- `SMTP_USER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` — para envio de e-mails (OAuth2)
- `NODE_ENV` — `development` | `production`

Coloque essas chaves em um arquivo `.env` na raiz para desenvolvimento.

**Scripts úteis** (do `package.json`)
- `npm run start:dev`: inicia o servidor em modo desenvolvimento (watch)
- `npm run build`: compila para `dist/`
- `npm run start:prod`: inicia a build em produção
- `npm test`: executa os testes unitários
- `npm run test:e2e`: executa testes end-to-end

Exemplo rápido de execução em desenvolvimento:
```bash
cp .env.example .env   # crie e ajuste as variáveis
npm install
npm run start:dev
```

**Estrutura principal**
- `src/modules` — módulos da aplicação (admin, articles, auth, audit, etc.)
- `src/config` — configuração de Prisma, Redis, sessão, mail e hashing
- `prisma/` — esquema Prisma
- `generated/prisma` — cliente Prisma gerado (usado em runtime)
- `test/` — configuração e testes e2e

**Testes**
- Unitários: `npm test`
- E2E: `npm run test:e2e`

**Contribuição**
- Abra uma issue ou envie um PR com mudanças pequenas e testáveis.

**Próximos passos sugeridos**
- Adicionar `prisma generate` e migrations ao fluxo de desenvolvimento
- Incluir um arquivo `.env.example` com as chaves obrigatórias
- Documentar endpoints principais em `Mds/API-DOCS.md`

---
Criado automaticamente a partir da análise do repositório em: 2026-06-04