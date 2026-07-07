# Portuguese Tech Communities — ptc-site

Diretório de meetups, talks e eventos de tecnologia por todo Portugal. Curado pelos próprios organizadores das comunidades.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite 7 |
| Backend | Express 5, Node.js (tsx) |
| Base de dados | Notion (via `@notionhq/client`) |
| Email | Resend |
| Package manager | pnpm |

---

## Arrancar em desenvolvimento

```bash
# instalar dependências
pnpm install

# copiar variáveis de ambiente
cp .env.example .env.local
# editar .env.local com os valores reais

# iniciar API + frontend em simultâneo
pnpm dev
```

O frontend fica em `http://localhost:5173` e o API em `http://localhost:3001`. O Vite faz proxy de `/api/*` para a porta 3001, por isso não há problemas de CORS em desenvolvimento.

---

## Variáveis de ambiente (`.env.local`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NOTION_TOKEN` | ✅ | Token de integração Notion (`secret_…`) |
| `NOTION_EVENTS_DB` | | ID da base de dados de eventos (default já configurado) |
| `NOTION_COMMUNITIES_DB` | | ID da base de dados de comunidades (default já configurado) |
| `ADMIN_PASSWORD` | ✅ em produção | Password do painel admin (não pode ser o default `ptcadmin`) |
| `SESSION_SECRET` | ✅ em produção | Segredo HMAC para cookies de sessão (mín. 32 caracteres, único) |
| `NODE_ENV` | | `production` em deploy — ativa cookies `secure`, `trust proxy` e validação fail-fast |
| `API_PORT` | | Porta do servidor API (default: `3001`) |
| `RESEND_API_KEY` | | API key Resend (necessária para magic links do portal) |
| `RESEND_FROM` | | Endereço de remetente (default: `noreply@ptc.pt`) |
| `SITE_URL` | | URL público do site (default: `http://localhost:5173`) |

> Em produção (`NODE_ENV=production`) o servidor **recusa arrancar** se `SESSION_SECRET`
> ou `ADMIN_PASSWORD` estiverem em falta ou com os valores default. Gera um segredo com:
> `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Estrutura do projeto

```
ptc-site/
├── server/
│   ├── index.ts              # Entrada Express
│   ├── notion.ts             # Cliente Notion, parsers, queries
│   ├── lib/
│   │   ├── email.ts          # Envio de magic links via Resend
│   │   └── tokens.ts         # Geração/consumo de tokens HMAC one-time
│   └── routes/
│       ├── auth.ts           # Login/logout/session do admin
│       ├── events.ts         # CRUD de eventos
│       ├── communities.ts    # Listagem de comunidades
│       ├── config.ts         # Configurações do site
│       └── portal.ts         # Portal de líderes (magic link auth)
├── src/
│   ├── App.tsx               # Router SPA (hash-based)
│   ├── pages/
│   │   ├── Home.tsx          # Landing page
│   │   ├── Events.tsx        # Lista de eventos
│   │   ├── Communities.tsx   # Diretório de comunidades
│   │   ├── CommunityDetail.tsx
│   │   ├── About.tsx
│   │   ├── Admin.tsx         # Painel de administração
│   │   └── Portal.tsx        # Portal de líderes de comunidade
│   ├── components/           # Componentes reutilizáveis
│   └── lib/
│       ├── api.ts            # Funções fetch para o backend
│       ├── siteConfig.ts     # Config do site (localStorage + API)
│       └── tokens.ts         # Utilitários de token (client-side)
└── vite.config.ts            # Proxy /api → 3001
```

---

## Rotas da API

### Autenticação — `/api/auth`

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/login` | — | Login com password; devolve cookie `ptc_session` |
| `POST` | `/logout` | — | Apaga cookie de sessão |
| `GET` | `/session` | — | Verifica se a sessão está ativa |

### Eventos — `/api/events`

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/` | — | Lista eventos aprovados e futuros (`?all=true` inclui não aprovados, `?past=true` inclui passados) |
| `GET` | `/:id` | — | Evento por ID |
| `POST` | `/` | Admin ou Portal | Criar evento |
| `PUT` | `/:id` | Admin ou Portal | Editar evento (portal só pode editar os seus) |
| `DELETE` | `/:id` | Admin ou Portal | Arquivar evento |

### Comunidades — `/api/communities`

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/` | — | Lista comunidades aprovadas |

### Portal — `/api/portal`

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/magic-link` | Admin | Envia magic link para líder de comunidade |
| `GET` | `/auth/:token` | — | Valida token e redireciona para `/#portal` |
| `GET` | `/session` | — | Info da sessão portal atual |
| `POST` | `/logout` | — | Termina sessão portal |

---

## Autenticação

### Admin
Password simples via `ADMIN_PASSWORD`. A sessão é um cookie `ptc_session` assinado com HMAC-SHA256. Válido 8 horas.

> ⚠️ **TODO:** Implementar Google OAuth antes de expor o painel publicamente — ver [memory/project_google_oauth_pending.md].

### Portal de Líderes
Magic link enviado por email. O admin vai a **Admin → Portal** e insere o email do líder. O sistema:
1. Valida que o email existe na base Notion `CommunityLeaders`
2. Gera token one-time (válido 24h, uso único)
3. Envia email via Resend com link `GET /api/portal/auth/:token`
4. Ao clicar, o servidor valida o token, cria cookie `ptc_portal` assinado, e redireciona para `/#portal`

> ⚠️ O magic link viaja no path do URL (`/api/portal/auth/:token`). Configura o reverse proxy para não registar o path completo desta rota nos access logs (scrub `/api/portal/auth/*`).

---

## Notion — bases de dados

As bases já estão pré-configuradas. Os IDs default estão em `server/notion.ts`:

| Base de dados | Env var | Campos relevantes |
|--------------|---------|-------------------|
| Events | `NOTION_EVENTS_DB` | Name, Description, Venue, Date, Region, Format, Topic, Price, Approved, Community (relation) |
| Communities | `NOTION_COMMUNITIES_DB` | Name, Slug, Region, Topic, Members, Founded, Description, Community Page, Logo URL, Status, Approved |
| Community Leaders | (hardcoded) | mail, Community (relation) |

> **Nota:** `Community Leaders` precisa de uma propriedade `Approved` (checkbox). Submissões de líderes ficam por aprovar até um admin as aprovar em **Admin → Líderes**.

---

## Build para produção

```bash
pnpm build            # compila o frontend para dist/
NODE_ENV=production pnpm start   # arranca o API (tsx) — serve /api/* e, se dist/ existir, o SPA
```

Em produção, um reverse proxy (nginx/Caddy) pode servir `dist/` e encaminhar `/api/*`
para o processo Node, ou o próprio processo serve `dist/`.

---

## Deploy — DigitalOcean App Platform

O deploy usa **App Platform** (buildpack Node, sem Dockerfile). O spec está
versionado em [`.do/app.yaml`](.do/app.yaml): um único serviço web que corre
`pnpm build` e depois `pnpm start` — o processo Express serve `/api/*` e o SPA
(`dist/`) na porta injetada pela plataforma (`PORT`).

### Primeiro deploy

1. Instala e autentica o [`doctl`](https://docs.digitalocean.com/reference/doctl/how-to/install/).
2. Cria a app a partir do spec:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```
3. No dashboard da DO (**App → Settings → web → Environment Variables**), define
   as variáveis **secretas** (tipo *Encrypted*, scope *Run Time*):

   | Variável | Notas |
   |----------|-------|
   | `NOTION_TOKEN` | token de integração Notion |
   | `ADMIN_PASSWORD` | valor forte, não-default (o servidor recusa arrancar caso contrário) |
   | `SESSION_SECRET` | ≥ 32 caracteres, único |
   | `RESEND_API_KEY` | necessário para os magic links do portal |

   As não-secretas (`NODE_ENV`, `SITE_URL`, `RESEND_FROM`, `NOTION_EVENTS_DB`,
   `NOTION_COMMUNITIES_DB`) já vêm no spec. `SITE_URL=${APP_URL}` resolve
   automaticamente para o URL público (`*.ondigitalocean.app`).

### Deploys seguintes

`deploy_on_push: true` está ativo — cada push para `main` no GitHub dispara um
build e deploy automáticos. Para aplicar alterações ao próprio spec:

```bash
doctl apps update <app-id> --spec .do/app.yaml
```

### Domínio próprio (mais tarde)

Adiciona o domínio no dashboard (ou um bloco `domains:` no spec). Como `SITE_URL`
usa `${APP_URL}`, resolve sozinho; se precisares de o fixar, muda esse único valor.

> ⚠️ **Logs:** o magic link do portal viaja no path (`/api/portal/auth/:token`).
> Os logs de plataforma da DO podem registar paths de pedidos e **não é possível
> limpá-los**. Os tokens são de uso único e expiram em 24h, o que limita o risco.

---

## Comandos úteis

```bash
pnpm dev            # API + frontend em desenvolvimento
pnpm dev:vite       # só frontend
pnpm dev:api        # só API
pnpm build          # build produção
pnpm typecheck      # verificar tipos TypeScript
```
