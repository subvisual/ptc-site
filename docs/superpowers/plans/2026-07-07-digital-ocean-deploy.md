# DigitalOcean App Platform Deployment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ptc-site` deployable to DigitalOcean App Platform as a single buildpack-built Node web service on the default `*.ondigitalocean.app` subdomain, with a committed app spec and reproducible pnpm builds.

**Architecture:** One App Platform web service. Buildpack runs `pnpm build` (Vite → `dist/`), then `pnpm start` runs the Express server via `tsx`, which serves both `/api/*` and the built SPA from the platform-injected `PORT`. App spec lives at `.do/app.yaml`; secret values are set in the DO dashboard, never committed.

**Tech Stack:** Node 22 (pinned), pnpm (via corepack), Vite 7, Express 5, `tsx`, DigitalOcean App Platform buildpack.

## Global Constraints

- Package manager: **pnpm**, activated via corepack. A committed `pnpm-lock.yaml` and a `packageManager` field are required for the buildpack to use pnpm.
- Node version pinned to `>=22 <23` via `package.json` `engines` (App Platform build env; local dev is Node 26 and unaffected).
- `NODE_ENV=production` must be **RUN_TIME scoped only** in the app spec — build time must keep `devDependencies` (Vite/Tailwind) available.
- `tsx` must be a **runtime** `dependency` (prod runs `tsx server/index.ts`; the buildpack prunes devDeps after build).
- **No secret values in git.** `NOTION_TOKEN`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `RESEND_API_KEY` are set in the DO dashboard only.
- Tailwind/style rule (repo-wide): no hex/px literals in UI code — not relevant to these config-only changes, but do not introduce any.
- Do **not** start long-running servers as part of verification (project constraint). Verify with typecheck, static checks, and `doctl` spec validation only.
- Local port behavior for dev must be preserved: `API_PORT`/`3001` fallback stays.

**Note on TDD:** These are configuration/infrastructure changes with no runtime unit-test surface (the server is not exported for supertest, and we must not boot it here). Each task therefore ends with a concrete **static verification** step instead of a red-green test cycle. Where a real test is possible (typecheck), it is used.

---

### Task 1: Pin pnpm, move `tsx` to runtime deps, pin Node, generate lockfile

Establishes pnpm via corepack and makes `package.json` buildpack-ready. This must come first because later tasks run `pnpm typecheck`.

**Files:**
- Modify: `package.json` (add `engines`, add `packageManager`, move `tsx` from `devDependencies` to `dependencies`)
- Create: `pnpm-lock.yaml` (generated)

**Interfaces:**
- Produces: a working `pnpm` on PATH (via corepack) and a committed lockfile that tasks 2–4 rely on for `pnpm typecheck`.

- [ ] **Step 1: Activate pnpm via corepack and pin it in `package.json`**

Run from the repo root:

```bash
corepack enable
corepack use pnpm@latest
```

`corepack use` adds a `"packageManager": "pnpm@<version>+sha512..."` field to `package.json`, installs dependencies, and generates `pnpm-lock.yaml`. If it prompts to modify `package.json`, accept.

Expected: `package.json` gains a `packageManager` field; `pnpm-lock.yaml` is created; `node_modules/` is populated.

- [ ] **Step 2: Move `tsx` to `dependencies` and add `engines`**

Edit `package.json`:
- Remove `"tsx": "^4.22.3"` from `devDependencies`.
- Add it to `dependencies`: `"tsx": "^4.22.3"`.
- Add a top-level `engines` block:

```json
"engines": {
  "node": ">=22 <23"
}
```

Place `engines` near the top (after `"private": true`). Keep `dependencies` alphabetically ordered to match the existing style (`tsx` sorts after `tailwind-merge`).

- [ ] **Step 3: Re-sync the lockfile after the dependency move**

Run:

```bash
pnpm install --lockfile-only
```

Expected: exits 0; `pnpm-lock.yaml` updated so `tsx` is recorded under the production dependency graph. No error about the lockfile being out of date.

- [ ] **Step 4: Verify the config is coherent**

Run:

```bash
node -e "const p=require('./package.json'); if(p.devDependencies.tsx) throw new Error('tsx still in devDependencies'); if(!p.dependencies.tsx) throw new Error('tsx not in dependencies'); if(!p.packageManager?.startsWith('pnpm@')) throw new Error('packageManager not pinned to pnpm'); if(!p.engines?.node) throw new Error('engines.node missing'); console.log('OK', p.packageManager, p.engines.node)"
pnpm typecheck
```

Expected: the node check prints `OK pnpm@<version> >=22 <23`; `pnpm typecheck` passes with no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "Pin pnpm and Node, make tsx a runtime dependency for prod"
```

---

### Task 2: Listen on the platform-injected `PORT`

**Files:**
- Modify: `server/index.ts:17`

**Interfaces:**
- Consumes: nothing new.
- Produces: the server binds `process.env.PORT` first, so App Platform's injected port is honored. Local dev unchanged.

- [ ] **Step 1: Change the port resolution**

In `server/index.ts`, replace line 17:

```ts
const PORT = Number(process.env.API_PORT ?? 3001);
```

with:

```ts
// App Platform (and most PaaS) inject PORT; fall back to API_PORT/3001 for local dev.
const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
```

- [ ] **Step 2: Verify statically (do not start the server)**

Run:

```bash
grep -n "process.env.PORT ?? process.env.API_PORT ?? 3001" server/index.ts
pnpm typecheck
```

Expected: grep prints the changed line (line 17); `pnpm typecheck` passes.

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "Listen on platform-injected PORT with API_PORT dev fallback"
```

---

### Task 3: Add the App Platform app spec

**Files:**
- Create: `.do/app.yaml`

**Interfaces:**
- Consumes: `pnpm build` / `pnpm start` scripts (unchanged), `/health` endpoint (`server/index.ts:46`), the `PORT` change from Task 2.
- Produces: a committed, reproducible deployment definition. Secret **values** live only in the DO dashboard.

- [ ] **Step 1: Write `.do/app.yaml`**

Create `.do/app.yaml` with exactly this content:

```yaml
# DigitalOcean App Platform spec for ptc-site.
#
# Deploy/update with:
#   doctl apps create --spec .do/app.yaml       # first time
#   doctl apps update <app-id> --spec .do/app.yaml
#
# SECRETS ARE NOT IN THIS FILE. After the app exists, set these in the
# DO dashboard (App → Settings → <component> → Environment Variables),
# each as an encrypted variable, RUN_TIME scope:
#   - NOTION_TOKEN
#   - ADMIN_PASSWORD      (non-default; server refuses to boot otherwise)
#   - SESSION_SECRET      (>= 32 chars, unique)
#   - RESEND_API_KEY
name: ptc-site
region: fra
services:
  - name: web
    environment_slug: node-js
    source_dir: /
    github:
      repo: subvisual/ptc-site
      branch: main
      deploy_on_push: true
    build_command: pnpm build
    run_command: pnpm start
    http_port: 8080
    instance_count: 1
    instance_size_slug: apps-s-1vcpu-0.5gb
    health_check:
      http_path: /health
    envs:
      - key: NODE_ENV
        value: production
        scope: RUN_TIME
      - key: SITE_URL
        value: ${APP_URL}
        scope: RUN_TIME
      - key: RESEND_FROM
        value: noreply@ptc.pt
        scope: RUN_TIME
      - key: NOTION_EVENTS_DB
        value: 358caae5-8631-8009-a521-000bba763510
        scope: RUN_TIME
      - key: NOTION_COMMUNITIES_DB
        value: 358caae5-8631-8006-8b92-000b7084f601
        scope: RUN_TIME
```

Notes for the implementer:
- `region: fra` (Frankfurt) is the closest DO region to Portugal; change if desired.
- `${APP_URL}` is a DO bindable variable that resolves to the live app URL — this is why `SITE_URL` needs no hardcoded value now and becomes a one-line change for a custom domain later.
- `NODE_ENV` is `RUN_TIME` scope so the build keeps `devDependencies` (Vite/Tailwind).
- Secrets are intentionally absent — they are set in the dashboard so no secret value is committed. This is the safe form of the spec's "secrets set in the dashboard" intent.

- [ ] **Step 2: Validate the spec**

Run:

```bash
if command -v doctl >/dev/null 2>&1; then doctl apps spec validate .do/app.yaml && echo "doctl: spec valid"; else echo "doctl not installed — skipping remote validation"; fi
node -e "const fs=require('fs');const s=fs.readFileSync('.do/app.yaml','utf8');['name:','environment_slug: node-js','build_command: pnpm build','run_command: pnpm start','http_path: /health','value: \${APP_URL}'].forEach(k=>{if(!s.includes(k))throw new Error('missing: '+k)});console.log('app.yaml structural check OK')"
```

Expected: if `doctl` is installed and authenticated, it reports the spec is valid; otherwise the skip message prints. The node check prints `app.yaml structural check OK`.

- [ ] **Step 3: Commit**

```bash
git add .do/app.yaml
git commit -m "Add DigitalOcean App Platform app spec"
```

---

### Task 4: Document deployment in the README

**Files:**
- Modify: `README.md` (append a new section before "Comandos úteis", after "Build para produção")

**Interfaces:**
- Consumes: everything above (app spec path, env-var list, `/health`).
- Produces: operator-facing deploy instructions.

- [ ] **Step 1: Add the deployment section**

In `README.md`, immediately after the "## Build para produção" section and before "## Comandos úteis", insert:

```markdown
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
```

- [ ] **Step 2: Verify the section landed**

Run:

```bash
grep -n "Deploy — DigitalOcean App Platform" README.md
grep -n "doctl apps create --spec .do/app.yaml" README.md
```

Expected: both greps return a line number.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Document DigitalOcean App Platform deployment"
```

---

### Task 5: Open the pull request

**Files:** none (git/GitHub only)

**Interfaces:**
- Consumes: commits from Tasks 1–4 plus the pre-existing deploy-spec commit on `ptc-deploy`.
- Produces: one PR `ptc-deploy` → `main`.

- [ ] **Step 1: Final verification across the branch**

Run:

```bash
pnpm typecheck
pnpm test
git log --oneline main..HEAD
```

Expected: typecheck passes; the test suite passes; the log shows the deploy commits (plus the pre-existing `492af96 Fix review findings` and the spec-doc commit, which ride along on this branch).

- [ ] **Step 2: Push and open the PR**

```bash
git push -u origin ptc-deploy
gh pr create --base main --head ptc-deploy \
  --title "Prepare for DigitalOcean App Platform deployment" \
  --body "$(cat <<'EOF'
## Summary
Prepares ptc-site for deployment to DigitalOcean App Platform (buildpack, single Node web service serving SPA + API).

- Listen on platform-injected `PORT` (keeps `API_PORT`/3001 for local dev)
- Move `tsx` to runtime `dependencies` (survives the buildpack devDep prune)
- Pin pnpm (`packageManager` + committed `pnpm-lock.yaml`) and Node (`engines`)
- Add `.do/app.yaml` app spec — `NODE_ENV` RUN_TIME-scoped, `/health` check, `SITE_URL=${APP_URL}`; secrets set in the DO dashboard, not committed
- Document the deploy flow and env-var checklist in the README
- Includes the design/plan docs under `docs/superpowers/`

## Notes
- Ships on the default `*.ondigitalocean.app` subdomain; custom domain is a later one-value change.
- This branch also carries a pre-existing commit (`Fix review findings`) not yet on `main`.

## Test plan
- `pnpm typecheck` and `pnpm test` pass
- `.do/app.yaml` validates (`doctl apps spec validate`)
EOF
)"
```

Expected: `gh` prints the new PR URL.

- [ ] **Step 3: Report the PR URL to the user.**

---

## Self-Review

**Spec coverage:**
- PORT change → Task 2. ✓
- `tsx` → dependencies → Task 1. ✓
- `packageManager` + lockfile → Task 1. ✓
- `engines.node` pin → Task 1. ✓
- `.do/app.yaml` (build/run cmds, RUN_TIME `NODE_ENV`, `/health`, env table, `SITE_URL=${APP_URL}`, secrets in dashboard) → Task 3. ✓
- README deploy section + env checklist + magic-link log note → Task 4. ✓
- Single PR → Task 5. ✓
- Out-of-scope items (custom domain, Dockerfile, OAuth, server compile) correctly excluded. ✓

**Placeholder scan:** No TBD/TODO left in the deliverables. The spec's `pnpm@<version>` is resolved by `corepack use pnpm@latest` in Task 1 Step 1; instance size is set concretely (`apps-s-1vcpu-0.5gb`).

**Type/name consistency:** `pnpm`, `pnpm build`, `pnpm start`, `/health`, `.do/app.yaml`, `${APP_URL}`, and env-var names are identical across tasks and match `package.json`/`server/index.ts`.

**Reconciliation note:** The design said secrets are "declared as SECRET type in the spec"; the plan keeps secret **keys out of the committed spec** and sets them in the dashboard instead. This is the same intent (values only in DO) but avoids an invalid/committed-plaintext spec — a strict improvement, documented in `.do/app.yaml` comments and the README.
```