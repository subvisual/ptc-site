# Deploy ptc-site to DigitalOcean App Platform — Design

**Date:** 2026-07-07
**Status:** Approved, pending implementation plan

## Goal

Make `ptc-site` deployable to DigitalOcean (DO) App Platform as a single
git-connected web service, on DO's default `*.ondigitalocean.app` subdomain,
with a committed app spec and reproducible builds. A custom domain will be
added later as a one-value change.

## Context

The app is one repository containing:

- A Vite + React 19 SPA (frontend), built to `dist/`.
- An Express 5 API server (`server/index.ts`) run directly via `tsx` — no
  TypeScript compile step. Backends are Notion (`@notionhq/client`) and Resend.

In production the Express process serves **both** `/api/*` and the built SPA
(`dist/`) from a single port, with a SPA fallback for non-API GET requests.
This single-process design is what makes App Platform a clean fit: one web
service component, one port.

Security posture already assumes a reverse proxy: `app.set("trust proxy", 1)`
when `NODE_ENV=production`, a Helmet CSP, rate limiting keyed on `req.ip`, and
fail-fast env validation (`validateEnv()`) that refuses to boot in production
with missing/default `SESSION_SECRET`, `ADMIN_PASSWORD`, or `NOTION_TOKEN`.

## Deployment target

- **Product:** DO App Platform (PaaS).
- **Build method:** Buildpack (auto-detected Node) — no Dockerfile.
- **Components:** one web service.
- **Domain:** DO default `*.ondigitalocean.app` subdomain for now.

App Platform builds by running the `build` script and runs the `start` script.
DO injects `PORT` (default 8080), terminates TLS, and provides the subdomain
and platform health checks.

## Required changes

The app is **not** deployable as-is. Four code/config changes plus an app spec.

### 1. Listen on `PORT`

`server/index.ts` currently binds `Number(process.env.API_PORT ?? 3001)`. App
Platform injects `PORT`. Change the port resolution to:

```
Number(process.env.PORT ?? process.env.API_PORT ?? 3001)
```

`PORT` takes precedence in production; `API_PORT`/`3001` preserve existing local
dev behavior (Vite proxies `/api` → `3001`).

### 2. Move `tsx` to `dependencies`

Production runs `tsx server/index.ts` (`pnpm start`). The Node buildpack prunes
`devDependencies` after the build step, so `tsx` must be a **runtime**
dependency to survive. `vite`, `tailwindcss`, and the other build-only tools
stay in `devDependencies` — they are needed only during `pnpm build`, which runs
**before** the prune.

### 3. Pin the package manager + lockfile

- Add `"packageManager": "pnpm@<version>"` to `package.json`. This is the signal
  that makes the buildpack activate pnpm (via corepack).
- Generate and commit **`pnpm-lock.yaml`** (`pnpm install --lockfile-only`) for
  reproducible installs. There is currently no lockfile in the repo.

### 4. Pin Node

Add `"engines": { "node": ">=22 <23" }` to `package.json` so build environments
don't drift across Node majors.

## App spec — `.do/app.yaml`

Committed to the repo so the deployment is reproducible and reviewable. Shape:

- **Service:** git-connected (branch → auto-deploy), `build_command: pnpm build`,
  `run_command: pnpm start`, `http_port` left to the platform default (8080),
  instance size TBD at deploy time (smallest that fits).
- **Health check:** `http_path: /health` (existing endpoint returns `{ ok: true }`).
- **`NODE_ENV=production`** scoped **`RUN_TIME`** only. Rationale: if it were set
  at build time, `pnpm install` would skip `devDependencies` and the Vite build
  would fail (Vite/Tailwind are devDeps). Runtime scope gives prod behavior
  (secure cookies, trust proxy, fail-fast validation) without breaking the build.
- **Env vars:**

  | Var | Type | Scope | Notes |
  |-----|------|-------|-------|
  | `NODE_ENV` | general | RUN_TIME | `production` |
  | `NOTION_TOKEN` | SECRET | RUN_TIME | set in DO dashboard |
  | `ADMIN_PASSWORD` | SECRET | RUN_TIME | set in DO dashboard |
  | `SESSION_SECRET` | SECRET | RUN_TIME | ≥32 chars, unique |
  | `RESEND_API_KEY` | SECRET | RUN_TIME | set in DO dashboard |
  | `NOTION_EVENTS_DB` | general | RUN_TIME | optional; default in code |
  | `NOTION_COMMUNITIES_DB` | general | RUN_TIME | optional; default in code |
  | `RESEND_FROM` | general | RUN_TIME | sender address |
  | `SITE_URL` | general | RUN_TIME | `${APP_URL}` bindable → auto-resolves to deployed URL |

  Secret **values** are never committed — the app spec declares them as `SECRET`
  type and they are filled in the DO dashboard. `SITE_URL=${APP_URL}` uses DO's
  bindable variable so it resolves to the live URL automatically; swapping in a
  custom domain later is a one-value change.

`load-env.ts` calls `dotenv.config({ path: ".env.local" })`, which silently
no-ops in production (no such file) — env comes from App Platform's injected
`process.env`. No change needed.

## Not changing (already correct for App Platform)

- `trust proxy` — App Platform runs behind a proxy; already gated on prod.
- Helmet CSP — API is same-origin with the SPA; `connectSrc: 'self'` is correct.
- Rate limiting on `req.ip` — correct once `trust proxy` is set (it is).
- Same-origin API — no CORS needed.

## Documentation

Add a **Deployment (DigitalOcean App Platform)** section to `README.md`:

- One-time setup: create the App from the repo, point it at the branch, set the
  four secrets in the dashboard, deploy.
- Env-var checklist (the table above).
- Known limitation: the portal magic-link token travels in the URL **path**
  (`GET /api/portal/auth/:token`). DO's platform-level request logs may capture
  request paths, which we cannot scrub. Flag it; mitigation (shorter TTL / one-time
  use — already one-time, 24h) is noted but not changed here.

## Out of scope

- Custom domain / DNS (deliberately deferred; `${APP_URL}` makes it a one-liner).
- Dockerfile / container registry (buildpack chosen).
- CI/CD beyond App Platform's built-in git auto-deploy.
- Google OAuth for admin (tracked separately as pre-existing TODO).
- Compiling the server to plain JS (running via `tsx` in prod is retained).

## Success criteria

1. A push to the connected branch triggers an App Platform build that installs
   with pnpm from the lockfile, runs `pnpm build`, and starts `pnpm start`.
2. The service passes the `/health` check and serves the SPA + `/api/*` on the
   `*.ondigitalocean.app` URL over HTTPS.
3. The server boots in production only when the four secrets are set (validated
   by existing `validateEnv()`); missing secrets fail the deploy loudly.
4. `.do/app.yaml` and the deployment docs are committed; no secret values are in
   the repo.
