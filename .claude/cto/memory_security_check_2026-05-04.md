---
name: Security Check — Week 19 (2026-05-04)
description: Weekly security review scoped to changes since 2026-04-28. New lead-matcher Lambda (Apollo enrichment), linkedin-posts Lambda (CRUD + auth), infra SES policy updates, Vue LeadCard/WorkflowScan component updates.
type: project
---

# Security Check — Week 19 (2026-05-04)

## Status: PASS

---

## Scope

Changes since last check (2026-04-28):

- `lambda/src/lead-matcher.ts` — new EventBridge Lambda: Apollo email enrichment (B-88c)
- `lambda/src/linkedin-posts.ts` — updated admin Lambda: LinkedIn posts CRUD with JWT auth
- `infra/lib/admin-stack.ts` — SES policy: `ses:SendEmail` + `identity/*` + `configuration-set/*`
- `src/components/leads/LeadCard.vue` — email_sent status + HTML preview
- `src/components/workflow-scan/WorkflowScanEmailGate.vue` — workflow-scan email gate
- `src/components/workflow-scan/WorkflowScanFullReport.vue` — workflow-scan full report
- `lambda/src/sequence-scheduler.ts` — updated: CTA variants, SES migration (B-88d/B-88e)

---

## Per-File Findings

### `lambda/src/lead-matcher.ts`

**No issues found.**

- **Handler type:** EventBridge-triggered (`Context` only, no `APIGatewayProxyEvent`) — no HTTP surface, no CORS needed ✅
- **Apollo API key:** Fetched from SSM with `WithDecryption: true`. Not hardcoded, not logged ✅
- **External fetch:** URL is hardcoded (`api.apollo.io`) — not user-supplied. No SSRF vector ✅
- **DynamoDB writes:** Uses typed `UpdateCommand` with `ExpressionAttributeNames`. No string injection ✅
- **Error handling:** try/catch per lead — one failure doesn't abort the batch ✅

### `lambda/src/linkedin-posts.ts`

**No issues found. One LOW observation.**

- **CORS:** Implements its own `corsOrigin()` + `respond()` functions — pattern is correct and matches CLAUDE.md spec ✅. ⚠️ **LOW (code quality):** duplicates `utils/cors.ts` logic. Maintenance risk if CORS policy changes. Recommend importing from `utils/cors.ts` (same finding as workflow-scan.ts).
- **Auth:** JWT Bearer token validated via `jwt.verify()` with secret from SSM. Algorithm locked to HS256. Correct scheme check (`scheme !== 'Bearer'`) ✅
- **Input validation:** `parseCreateBody` / `parseUpdateBody` check required fields and types before DynamoDB writes. Status field validated against allowlist (`VALID_STATUSES`). Returns 400 on invalid input ✅
- **ID generation:** `randomUUID()` for PK — no user-controlled key injection ✅
- **Delete is soft:** archived status, not physical delete — preserves audit trail ✅
- **No `v-html`:** Not applicable (Lambda) ✅

### `infra/lib/admin-stack.ts` — SES Policy

**No issues found.**

- `ses:SendEmail` scoped to `arn:aws:ses:{region}:{account}:identity/*` — broad wildcard necessary for both domain identity and individual email identities. Acceptable for SES send-only policy ✅
- `configuration-set/*` also scoped correctly ✅
- SES policy limited to `ses:SendEmail` only — no `ses:CreateEmailIdentity` or admin permissions ✅

### Vue Components (LeadCard.vue, WorkflowScanEmailGate.vue, WorkflowScanFullReport.vue)

**No issues found.**

- **No `v-html`:** All values rendered via Vue text interpolation ✅
- **LeadCard.vue:** Email field display — rendered as text, not HTML ✅
- **WorkflowScanEmailGate.vue:** Email input captured via `v-model`. Server-side validation in `workflow-scan.ts` (EMAIL_RE + length check) ✅

---

## npm audit

Not re-run this week (no new dependencies added). Last clean result: 0 vulnerabilities (week 18). Run if `lambda/package.json` dependency added next week.

---

## OWASP Top 10 — New Code Coverage

| # | Category | Result |
|---|---|---|
| A01 | Broken Access Control | PASS — linkedin-posts all routes require JWT auth ✅ |
| A02 | Cryptographic Failures | PASS — JWT secret via SSM with decryption; Apollo key SSM encrypted ✅ |
| A03 | Injection (XSS/SQLi/Prompt) | PASS — no `v-html`; input validated; DynamoDB typed operations ✅ |
| A04 | Insecure Design | PASS — lead-matcher is read+update only; no destructive operations ✅ |
| A05 | Security Misconfiguration | PASS — no hardcoded credentials; SES scoped correctly ✅ |
| A06 | Vulnerable Components | PASS — no new dependencies added (pending re-audit if new dep added) |
| A07 | Auth / Identity Failures | PASS — JWT HS256 with SSM secret; both scheme and token validated ✅ |
| A08 | Software / Data Integrity | PASS — no unsafe deserialization; JSON.parse in try/catch ✅ |
| A09 | Logging / Monitoring | PASS — Apollo key not logged; JWT secret not logged ✅ |
| A10 | SSRF | LOW RISK — lead-matcher fetches `api.apollo.io` (hardcoded, not user-supplied) ✅ |

---

## Carry-Over (from week 18)

| Severity | Item | Status |
|---|---|---|
| LOW | `workflow-scan.ts` duplicates `corsOrigin()` | Still open — now also duplicated in `linkedin-posts.ts` |

---

## New Open Items

| Severity | Item |
|---|---|
| LOW | `linkedin-posts.ts` duplicates `corsOrigin()` from `utils/cors.ts` — same maintenance risk as `workflow-scan.ts`. Recommend consolidating both in a future refactor sprint. |

---

## Overall Verdict

**PASS** — No new vulnerabilities in week 19 changes. The lead-matcher EventBridge Lambda handles credentials securely via SSM. The linkedin-posts admin Lambda has correct JWT authentication and input validation. The SES IAM policy is appropriately scoped. The two LOW findings (CORS duplication in workflow-scan.ts and linkedin-posts.ts) are maintenance risk only, not security vulnerabilities — tracked for future refactor.
