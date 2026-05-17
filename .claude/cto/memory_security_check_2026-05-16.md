---
name: Security Check 2026-05-16
description: Weekly security review — GEO commits + W19/W20 changes since 2026-05-05
type: project
---

# Security Check — 2026-05-16

**Scope:** 6 commits reviewed:
- `f46f481` — Update GEO (index.html, public/llms-full.txt, public/llms.txt, public/robots.txt, public/sitemap.xml, scripts/generate-sitemap.js/.ts, src/views/KennisbankArtikelView.vue)
- `a454848` — GEO improvement v2 (index.html, src/locales/en.json, src/locales/nl.json, src/views/AiAgentMkbView.vue, src/views/KennisbankArtikelView.vue, src/views/WatKostHandmatigWerkView.vue, src/views/WorkflowScanView.vue)
- `8dc0b96` — Improve GEO (lambda/src/kennisbank-admin.ts, package.json, public/llms-full.txt, scripts/generate-llms-full.d.ts/.js/.ts, tsconfig.node.json, vite.config.js/.ts)
- `cadf08e` — Afronding 7-5 (.claude/ceo/memory_daily_context.md, product/backlog.md)
- `531aa06` — feat(leads): enrich slijterij-jeppe and oasegroen (product/marketing/leads/outreach-log.csv)
- `1469c4a` — feat: add SEO landing page /ai-agent-mkb (public/sitemap.xml, src/locales/en.json, src/locales/nl.json, src/router/index.ts, src/views/AiAgentMkbView.vue)

**Result: PASS (with accepted lows)**

---

## Findings

### LOW-1 — XML injection risk in sitemap generation
**File:** `lambda/src/kennisbank-admin.ts` (writeSitemap) + `scripts/generate-sitemap.ts`
**Issue:** Slugs retrieved from S3 are interpolated into XML without escaping. A slug containing `&`, `<`, or `>` would produce malformed sitemap XML.
**Exploitability:** Requires prior authenticated write access (JWT-protected PUT endpoint) — extremely low risk surface.
**Fix/Status:** Accepted LOW. Mitigation: enforce slug pattern validation (alphanumeric + hyphens only) in `handlePut`. No immediate action required.

### LOW-2 — No rate limiting on Lambda auth endpoint
**File:** `lambda/src/kennisbank-admin.ts` (requireAuth)
**Issue:** No request rate limiting at the Lambda layer. Repeated failed auth attempts are possible.
**Exploitability:** JWT with HS256 + strong SSM secret is practically unbrute-forceable. No risk of secret exposure.
**Fix/Status:** Accepted LOW. Recommend enabling AWS WAF rate-based rules on API Gateway as a future hardening task.

### LOW-3 — No Content-Security-Policy header (pre-existing)
**File:** `index.html`
**Issue:** No CSP meta tag. Inline scripts (gtag, LD+JSON) would be blocked by a strict CSP. This is a pre-existing gap, not introduced by these commits.
**Fix/Status:** Accepted LOW — pre-existing. Track as separate hardening item.

---

## Positive findings (security-correct patterns observed)

- **DOMPurify on v-html** (`KennisbankArtikelView.vue` line 174-176): Article HTML sanitized via `DOMPurify.sanitize()` before `v-html`. XSS mitigated correctly.
- **JWT algorithm pinning** (`kennisbank-admin.ts` line 89): `jwt.verify()` with `{ algorithms: ['HS256'] }` — prevents algorithm confusion/none attack.
- **CORS origin allowlist** (`kennisbank-admin.ts` lines 37-49): `corsOrigin()` validates against `PROD_ORIGINS` Set; no wildcard or unauthenticated origin reflection.
- **Category allowlist** (`kennisbank-admin.ts` lines 19-24, 483, 522): `VALID_CATEGORIES` Set blocks invalid categories on PUT and publish.
- **Auth gate on all write operations** (`kennisbank-admin.ts` line 605): `requireAuth()` called before any routing — no auth bypass path exists.
- **SSM for JWT secret** (`kennisbank-admin.ts` lines 72-78): Secret fetched from SSM with `WithDecryption: true`; not hardcoded or in env vars.
- **Slug path traversal prevented** (regex `[^/]+` on lines 614, 626): Prevents `/` in slug; `posts/../index.json` is not constructable.
- **Admin routes excluded from SSG** (`vite.config.ts` line 42): `!p.startsWith('/admin')` prevents admin views from being statically generated.
- **New public route correctly unauthenticated** (`src/router/index.ts` lines 103-107): `/ai-agent-mkb` has `layout: 'public'` only — no erroneous `requiresAuth`.
- **WatKostHandmatigWerkView calculator**: Inputs typed as `number` with HTML min/max; computed values are pure arithmetic — no injection surface.
- **AiAgentMkbView**: No `v-html`, no user input; all text via `{{ t() }}` (HTML-escaped by Vue).

---

## Per-file verdicts

| File | Verdict |
|------|---------|
| `lambda/src/kennisbank-admin.ts` | LOW (XML injection in sitemap; no rate limiting) |
| `src/views/KennisbankArtikelView.vue` | PASS |
| `src/views/AiAgentMkbView.vue` | PASS |
| `src/views/WatKostHandmatigWerkView.vue` | PASS |
| `src/views/WorkflowScanView.vue` | PASS |
| `src/router/index.ts` | PASS |
| `scripts/generate-llms-full.ts` | PASS |
| `scripts/generate-sitemap.ts` | LOW (XML injection — same as kennisbank-admin) |
| `vite.config.ts` | PASS |
| `index.html` | LOW (no CSP — pre-existing) |
| `public/llms-full.txt` | PASS (static build artifact) |
| `public/llms.txt` | PASS (static build artifact) |
| `public/robots.txt` | PASS (static build artifact) |
| `public/sitemap.xml` | PASS (static build artifact) |
| `src/locales/en.json` | PASS |
| `src/locales/nl.json` | PASS |
| `product/marketing/leads/outreach-log.csv` | PASS |
| `.claude/ceo/memory_daily_context.md` | PASS |
| `product/backlog.md` | PASS |
