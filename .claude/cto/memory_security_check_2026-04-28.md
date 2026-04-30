---
name: Security Check — Week 18 (2026-04-28)
description: Weekly security review scoped to changes since 2026-04-25. New WorkflowScan public route, Onboarding admin CRUD, Groei Systeem Lambda handlers, signaaldetectie bugfix.
type: project
---

# Security Check — Week 18 (2026-04-28)

## Status: PASS

---

## Scope

Changes since last check (2026-04-25):

- `lambda/src/onboarding.ts` — new admin Lambda: onboarding checklist CRUD (B-80)
- `lambda/src/workflow-scan.ts` — new public Lambda: workflow scan lead magnet (B-54)
- `lambda/src/signaaldetectie.ts` — EventBridge Lambda: signaaldetectie bugfix (bugfixing2704)
- `src/views/WorkflowScanView.vue` + 6 WorkflowScan components — public lead magnet flow
- `src/views/admin/OnboardingListView.vue` + `OnboardingDetailView.vue` — admin onboarding UI
- `src/composables/useOnboarding.ts` + `useWorkflowScan.ts` — composables
- `src/router/index.ts` — new routes: `/workflow-scan` (public) + `/admin/onboarding` (admin)

---

## Per-File Findings

### `lambda/src/onboarding.ts`

**No issues found.**

- **CORS:** Imports `respond` from `./utils/cors` — uses centralised `corsOrigin()` pattern per CLAUDE.md convention ✅
- **Auth:** This Lambda sits behind API Gateway with Cognito/JWT auth guard on admin routes. No sensitive data exposed without auth.
- **Input validation:** Parses JSON body with try/catch; validates required fields before DynamoDB writes.
- **DynamoDB:** Uses `DynamoDBDocumentClient` with typed put/update operations. No raw string injection vectors.

### `lambda/src/workflow-scan.ts`

**No issues found. One LOW observation.**

- **CORS:** Implements its own `corsOrigin()` + `respond()` functions — pattern is correct and matches CLAUDE.md spec. ⚠️ **LOW (code quality, not security):** duplicates `utils/cors.ts` logic. Maintenance risk if CORS policy changes — two files to update. Recommend importing from `utils/cors.ts` in a future refactor.
- **Email validation (server-side):** `EMAIL_RE.test(email)` regex + `email.length > 254` max-length check before processing. Returns 400 on invalid input ✅
- **AI prompt injection via user answers:** User's `answers` array is embedded in a Claude prompt. Answers come from a fixed multiple-choice UI (not free text) — injection surface is minimal. The Lambda response is parsed as structured JSON (`JSON.parse(raw)`) with a try/catch fallback ✅
- **Rate limiting:** B-77 implemented throttling (10 rps, burst 20) on `/workflow-scan` at API Gateway level ✅
- **Route classification:** `/workflow-scan` is `layout: 'public'` with no `requiresAuth` — correct for a public lead magnet ✅

### `lambda/src/signaaldetectie.ts`

**No issues found.**

- **Handler type:** EventBridge-triggered (`Context` import only, no `APIGatewayProxyEvent`) — no HTTP surface, no CORS needed ✅
- **API key handling:** Anthropic API key fetched from SSM Parameter Store with caching. Not hardcoded, not logged ✅
- **Reddit token:** OAuth2 client credentials flow with expiry caching. Token not persisted to DynamoDB ✅
- **DynamoDB writes:** Uses `PK`/`SK` composite key with `randomUUID()` — no user-controlled key injection ✅

### WorkflowScan Vue Components (6 files)

**No issues found.**

- **No `v-html`:** All user-facing values rendered via Vue text interpolation or typed `ref` state ✅
- **No free-text inputs that reach the backend directly** — questions are multiple-choice; email is the only string input (validated server-side)
- **No API calls from components directly:** All calls go through `useWorkflowScan.ts` composable ✅

### Onboarding Vue Views + Composable

**No issues found.**

- **Auth gate:** Both `/admin/onboarding` routes have `requiresAuth: true` + `layout: 'admin'` ✅
- **No `v-html`:** Onboarding data rendered via template interpolation ✅

---

## npm audit

```
found 0 vulnerabilities
```

✅ No new vulnerabilities. Consistent with result after B-22 fix.

---

## OWASP Top 10 — New Code Coverage

| # | Category | Result |
|---|---|---|
| A01 | Broken Access Control | PASS — `/workflow-scan` correctly public; `/admin/onboarding` requires auth ✅ |
| A02 | Cryptographic Failures | PASS — no credentials hardcoded; Anthropic key in SSM; Reddit token not persisted |
| A03 | Injection (XSS/SQLi/Prompt) | PASS — no `v-html`; email validated server-side; AI prompt uses constrained MC answers |
| A04 | Insecure Design | PASS — scan flow is read-only until email gate; onboarding writes behind auth |
| A05 | Security Misconfiguration | PASS — no debug flags; env vars via SSM; no default credentials |
| A06 | Vulnerable Components | PASS — `npm audit` 0 vulnerabilities |
| A07 | Auth / Identity Failures | PASS — admin routes protected; public routes intentionally open |
| A08 | Software / Data Integrity | PASS — no unsafe deserialization; AI output parsed with try/catch fallback |
| A09 | Logging / Monitoring | PASS — no sensitive data in CloudWatch logs (key masked by SSM) |
| A10 | SSRF | LOW RISK — signaaldetectie fetches Reddit API (external URL). URL is hardcoded (`oauth.reddit.com`) — not user-supplied. Acceptable. |

---

## Carry-Over Items

All HIGH/MODERATE carry-over items from week 16 are confirmed fixed:

| Severity | Item | Status |
|---|---|---|
| HIGH | vite path traversal (dev-only) | ✅ Fixed — B-22 (npm audit 0) |
| HIGH | calendly-webhook.ts hardcoded CORS | ✅ Fixed — B-21 (commit 7b47c1b) |
| HIGH | intake.ts hardcoded CORS | ✅ Fixed — B-21 (commit 7b47c1b) |
| MODERATE | axios/follow-redirects/unhead vulns | ✅ Fixed — B-22 |
| LOW | KennisbankArtikelView.vue v-html | ✅ Fixed — B-23 (DOMPurify) |

---

## New Open Items

| Severity | Item |
|---|---|
| LOW | `workflow-scan.ts` duplicates `corsOrigin()` from `utils/cors.ts` — maintenance risk, not security. Refactor in future sprint. |

---

## Overall Verdict

**PASS** — No new vulnerabilities in week 18. The WorkflowScan public flow has appropriate server-side validation and rate limiting. The onboarding admin CRUD is correctly auth-gated. The signaaldetectie EventBridge Lambda handles external API credentials securely via SSM. All week-16 carry-overs confirmed resolved.
