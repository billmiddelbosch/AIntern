---
name: Security Check 2026-05-05
description: Weekly security review for PR #149 (editorial-crud, lead-matcher, sequence-scheduler, signaaldetectie, admin-stack updates)
type: project
---

# Security Check — 2026-05-05 (PR #149)

**Scope:** PR #149 — editorial Lambda CRUD, lead-matcher Apollo enrichment, sequence-scheduler SES migration, signaaldetectie update, admin-stack IAM additions, Vue composable + view changes.

**Result: PASS (na fix)**

## Findings

### FIXED — MEDIUM: adminAuthFn SSM wildcard
- **File:** `infra/lib/admin-stack.ts` (lines 49–54)
- **Issue:** `ssm:PutParameter` on `resources: ['*']` — compromised Lambda could overwrite any SSM param including prod JWT secrets and API keys
- **Fix:** Scoped to `arn:aws:ssm:${region}:${account}:parameter/aintern/admin/*` — applied inline 2026-05-05 on feature/board-2026-05-05
- **Status:** ✅ Fixed

### LOW: lead-matcher Apollo contactEmail
- **File:** `lambda/src/lead-matcher.ts` (~lines 185–218)
- **Issue:** `contactEmail` returned from Apollo API written to DynamoDB without email format validation (comes from DynamoDB, not direct user input — low blast radius)
- **Status:** Accepted LOW — no action required

### LOW: useEditorialOutreach client-side length
- **File:** `src/composables/useEditorialOutreach.ts`
- **Issue:** No client-side length guard on emailSubject/emailBody before PATCH (server truncates at 200/2000 — not exploitable)
- **Status:** Accepted LOW — UX improvement only, not a security risk

### LOW: apiGwInvokeRole scope
- **File:** `infra/lib/admin-stack.ts`
- **Issue:** `lambda:InvokeFunction` on `aintern-*:*` (all aintern Lambdas) — standard API Gateway stage-variable routing pattern
- **Status:** Accepted LOW — no action required

## Per-file verdicts

| File | Verdict |
|------|---------|
| `lambda/src/editorial-crud.ts` | PASS |
| `lambda/src/lead-matcher.ts` | LOW (accepted) |
| `lambda/src/sequence-scheduler.ts` | PASS |
| `lambda/src/signaaldetectie.ts` | PASS |
| `src/composables/useEditorialOutreach.ts` | LOW (accepted) |
| `src/views/admin/AdminLeadBoardView.vue` | PASS |
| `infra/lib/admin-stack.ts` | MEDIUM → ✅ Fixed |
