---
name: Security Check 2026-05-19
description: Weekly security review — W21 commits since 2026-05-16 (Q&A sectie + Home update + B-106 GEO fix)
type: project
---

# Security Check — 2026-05-19

**Scope:** 4 commits reviewed:
- `186e723` — Q&A sectie (lambda/src/kennisbank-admin.ts, src/composables/useQnA.ts, src/components/admin/ArticleFaqPanel.vue, src/views/VeelgesteldeVragenView.vue, src/types/kennisbank.ts, infra/lib/admin-stack.ts, + 12 more)
- `8fac3c5` — Home update (HomeView.vue, WorkflowScanCtaSection.vue, public/llms-full.txt, public/sitemap.xml)
- `cb6ba14` — Update LinkedIn post (product/marketing/leads/outreach-log.csv)
- `4d51e63` — fix(geo): B-106 replace S3 SDK with HTTP fetch (scripts/generate-sitemap.ts, scripts/generate-llms-full.ts, public/llms-full.txt, public/sitemap.xml)

**Result: PASS (with carried LOW-1/LOW-2/LOW-3 from W20 + new LOW-4)**

---

## Findings

### LOW-4 — LD+JSON FAQ data sourced from S3 (no output encoding validation)
**File:** `src/views/VeelgesteldeVragenView.vue`
**Issue:** `filteredItems` (from `qa.json` via S3) is serialized via `JSON.stringify()` into a `<script type="application/ld+json">` block via `useHead`. If a Q&A entry contains a malicious string (e.g. `</script><script>...`), `JSON.stringify` does NOT escape `</script>` sequences — this could break out of the JSON block in some parsers.
**Exploitability:** Requires prior authenticated write access to insert FAQ content (JWT-protected POST via kennisbank-admin). Content is admin-authored, not user-submitted. Risk surface is extremely low.
**Fix/Status:** Accepted LOW. Mitigation: ensure `</script>` sequences in FAQ fields are escaped before serialization, or use a library like `serialize-javascript`. Track as future hardening.

### LOW-1 (carried) — XML injection risk in sitemap generation
**Status:** Still accepted LOW. B-106 fix did not change slug validation. Slugs now sourced from `index.json` (previously S3 ListObjects) — same slugs, no new surface.

### LOW-2 (carried) — No rate limiting on Lambda auth endpoint
**Status:** Still accepted LOW.

### LOW-3 (carried) — No Content-Security-Policy header
**Status:** Still accepted LOW (pre-existing). Note: `infra/amplify-custom-headers.yml` exists but is not connected to Amplify app (`customHeaders: ""`). Security headers are not being served. Track as B-111 candidate.

---

## Positive findings (security-correct patterns observed)

- **QnA write gate** (`kennisbank-admin.ts` — `handlePublish`/`handleDelete`): `writeQnaIndex()` is only called within `handlePublish` and `handleDelete`, both of which are already behind `requireAuth()` at line 605. No unauthenticated write path exists.
- **IAM policy scoped to qa.json** (`infra/lib/admin-stack.ts`): Lambda IAM policy explicitly adds `arn:aws:s3:::aintern-kennisbank/qa.json` to both GetObject and PutObject grants — least-privilege correctly maintained.
- **useQnA composable** (`src/composables/useQnA.ts`): Reads from public S3 URL via `s3Client` (Axios instance). 403/404 gracefully returns empty — no secret leakage, no crash.
- **ArticleFaqPanel.vue**: No `v-html`, no `innerHTML` — FAQ Q&A inputs are plain text fields. XSS surface does not exist in admin editor.
- **VeelgesteldeVragenView.vue**: No `v-html` for user-visible content. All Q&A text rendered via Vue template interpolation (`{{ item.question }}`). Only `innerHTML` usage is in LD+JSON `<script>` block (see LOW-4).
- **HomeView.vue / WorkflowScanCtaSection.vue**: No `v-html`, no user input — purely static template content. PASS.
- **B-106 (generate-sitemap.ts / generate-llms-full.ts)**: S3 SDK removed; replaced with unauthenticated HTTP `fetch()`. No credentials in build environment. Slug data sourced from public `index.json` — no injection surface change (slug sanitization unchanged from W20).
- **`/veelgestelde-vragen` route** (`src/router/index.ts`): New route has `layout: 'public'` only — no erroneous `requiresAuth`.

---

## Per-file verdicts

| File | Verdict |
|------|---------|
| `lambda/src/kennisbank-admin.ts` | LOW (XML injection in sitemap — carried; LD+JSON QnA encoding — LOW-4) |
| `infra/lib/admin-stack.ts` | PASS |
| `src/composables/useQnA.ts` | PASS |
| `src/components/admin/ArticleFaqPanel.vue` | PASS |
| `src/views/VeelgesteldeVragenView.vue` | LOW (LD+JSON serialization — LOW-4) |
| `src/views/HomeView.vue` | PASS |
| `src/components/workflow-scan-cta/WorkflowScanCtaSection.vue` | PASS |
| `src/types/kennisbank.ts` | PASS |
| `src/locales/en.json` | PASS |
| `src/locales/nl.json` | PASS |
| `src/router/index.ts` | PASS |
| `scripts/generate-sitemap.ts` | LOW (XML injection — carried; B-106 HTTP fetch correct) |
| `scripts/generate-llms-full.ts` | LOW (XML injection — carried; B-106 HTTP fetch correct) |
| `public/llms-full.txt` | PASS (build artifact) |
| `public/sitemap.xml` | PASS (build artifact) |
| `product/marketing/leads/outreach-log.csv` | PASS |
