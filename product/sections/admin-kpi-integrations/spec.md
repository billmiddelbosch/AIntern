# A-13 — Data-Driven KPI Integrations: Persist & Surface Actuals

**Backlog ID:** A-13
**Owner:** CTO (Morgan) + CMO (Blake — GA4 credentials)
**Effort:** L
**Depends on:** A-14 (DynamoDB + Lambda endpoints — must be live first), A-09 (KPI dashboard — already live)
**Agent sequence:** `lambda-feature-builder` (integration Lambda) → `vuejs-feature-builder` (store update)

---

## Overview

Replace manual `localStorage` actuals in `useKpiStore.ts` with live reads from the A-14 API.
Add a server-side integration Lambda that auto-populates metrics that have a reliable automated
source. Metrics without an automated source remain manually editable in the dashboard.

---

## Automated vs Manual Metrics

### Automated (integration Lambda writes these)

| Metric ID | Label | Source | Frequency |
|-----------|-------|--------|-----------|
| `cmo.2` | New connections sent | `product/marketing/leads/outreach-log.csv` — count rows where `connection_sent_at` falls in current ISO week | On-demand (called by board meeting skill in Phase 1) |
| `kr2.2` | Connections YTD | Same CSV — count all `connection_sent_at` rows in Q2 | On-demand |
| `cpo.1` | Kennisbank articles this week | S3 `aintern-kennisbank` — count objects with `LastModified` in current ISO week | On-demand |
| `kr3.3` | Kennisbank articles quarterly | S3 `aintern-kennisbank` — count all objects | On-demand |
| `cpo.3` | Website traffic check done | GA4 Data API — weekly active users | On-demand |
| `kr3.4` | Monthly unique visitors | GA4 Data API — `activeUsers` last 30 days | On-demand |
| `cto.1` | Security check done | `.claude/cto/memory_security_check_{YYYY-MM-DD}.md` — check if file exists for current week | On-demand |
| `kr3.6` | Security checks completed (quarterly) | Count `.claude/cto/memory_security_check_*.md` files in Q2 date range | On-demand |
| `cpo.2` | Backlog item shipped or in progress | `product/backlog.md` — count table rows containing a YYYY-MM-DD date in the current ISO week. Upload to S3 first via `npm run sync:backlog`. | On-demand |

### Manual (user edits in dashboard — no integration)

| Metric ID | Label | Why manual |
|-----------|-------|-----------|
| `kr1.1` | Signed contracts | No automated source |
| `kr1.2` | Discovery calls booked | No automated source |
| `kr1.3` | Pilot case studies | No automated source |
| `ceo.1–4` | All CEO weekly KPIs | No automated source |
| `cmo.1` | LinkedIn posts published | No LinkedIn API available |
| `cmo.3` | Inbound leads generated | Future: intake form; manual for now |
| `cmo.4` | Morning briefings completed | No automated source |
| `coo.1–4` | All COO weekly KPIs | No automated source |
| `kr4.1–4.3` | COO OKR milestones | Boolean — user toggles in dashboard |
| `kr5.1–5.4` | Governance milestones | Boolean — user toggles in dashboard |

> **Note:** `cpo.2` was originally listed as manual. It is now automated via Integration 4 (backlog.md → S3).

---

## Integration Lambda: `kpi-integrations.ts`

**Route:** `POST /admin/kpi/refresh`

Triggers all automated integrations for the current ISO week and writes results to DynamoDB
via the A-14 table. Never overwrites rows where `source: "manual"`.

**Request body:**
```json
{ "week": "2026-W15" }
```
Week defaults to current ISO week if omitted.

**Response:**
```json
{
  "week": "2026-W15",
  "updated": ["cmo.2", "kr2.2", "cpo.1", "kr3.3", "cpo.3", "kr3.4", "cto.1", "kr3.6"],
  "errors": []
}
```

### Integration sub-modules

#### 1. Outreach CSV (connections)

```
Read: product/marketing/leads/outreach-log.csv (local file, Lambda has EFS or S3 access — see note)
Parse: count rows where connection_sent_at >= Monday of current ISO week
Write: cmo.2 (week count), kr2.2 (YTD count)
```

> **Note on file access:** The outreach CSV is committed to the repo and deployed via S3 or EFS
> mount. Simplest approach: the board meeting skill uploads the current CSV to S3
> (`aintern-admin-assets/outreach-log.csv`) before calling `/admin/kpi/refresh`. The Lambda
> reads from S3. This avoids EFS complexity.

#### 2. Kennisbank S3 (article count)

```
Client: S3 (eu-west-2), bucket: aintern-kennisbank
List objects: ListObjectsV2
Filter: LastModified >= Monday of current ISO week → cpo.1 (weekly count)
Total count → kr3.3 (quarterly count, all objects)
```

Lambda IAM needs `s3:ListBucket` on `aintern-kennisbank`.

#### 3. GA4 Data API (traffic)

```
Auth: Service Account JSON stored in SSM Parameter Store as SecureString
      Path: /aintern/{env}/ga4/service-account-json
Property ID: stored in SSM at /aintern/{env}/ga4/property-id
SDK: @google-analytics/data (Node.js)
```

**Weekly query (cpo.3 — "traffic check done"):**
- Metric: `activeUsers`, date range: last 7 days
- Write `1` to `cpo.3` if response > 0 (confirms GA is reporting), write actual visitor count to `kr3.4` (30-day range)

**Monthly query (kr3.4):**
- Metric: `activeUsers`, date range: last 30 days
- Write count to `kr3.4`

If GA4 API call fails, write `source: "error"` and include in `errors[]` response — do not fail the whole refresh.

Lambda IAM does not need special permissions for GA4 — auth is via service account JSON from SSM.

Install: `npm install @google-analytics/data` in `lambda/`

#### 4. Security check file (cto.1, kr3.6)

The security check memory files live in `.claude/cto/memory_security_check_{YYYY-MM-DD}.md`.
These are local files, not in S3 or Lambda reach at runtime.

**Approach:** The board meeting skill (Phase 1 context loading) already reads this file. It
should upload a lightweight signal to S3 (`aintern-admin-assets/security-checks/{date}.json`)
each time a security check file is found. The integration Lambda counts these S3 objects.

Alternatively (simpler for now): the board meeting skill calls `PUT /admin/kpi/actuals` directly
with `cto.1` and `kr3.6` values after reading the local files in Phase 1 — no S3 upload needed.
**Use this simpler approach for the initial implementation.**

---

## Frontend: `useKpiStore.ts` Changes

Replace `useLocalStorage` actuals with API reads. Keep localStorage as write-through cache
for instant UI response and offline fallback.

### New behaviour

```
On mount (dashboard opens):
  1. Determine current ISO week
  2. Call GET /admin/kpi/actuals?week={isoWeek}
  3. Merge API actuals over localStorage cache
  4. Display merged result

On manual edit (user changes a value in the dashboard):
  1. Optimistically update localStorage (instant UI)
  2. Call PUT /admin/kpi/actuals with { week, metricId, value }
  3. On success: cache is already correct
  4. On failure: revert localStorage to previous value, show toast

On "Refresh" button click (new button on KPI view):
  1. Call POST /admin/kpi/refresh
  2. Reload actuals from GET /admin/kpi/actuals
  3. Update store + localStorage cache
```

### New composable: `useKpiApi.ts`

Extract API calls from the store to keep concerns separate:

```ts
// src/composables/useKpiApi.ts
export function useKpiApi() {
  function getActuals(week: string): Promise<Record<string, { value: number; source: string }>>
  function putActual(week: string, metricId: string, value: number): Promise<void>
  function refreshActuals(week?: string): Promise<RefreshResult>
}
```

The store calls `useKpiApi()` internally. The KPI view does not call the API directly.

### i18n

Add to `en.json` / `nl.json`:
```json
"admin.kpi.refreshButton": "Refresh actuals",
"admin.kpi.lastRefreshed": "Last refreshed: {time}",
"admin.kpi.sourceAuto": "auto",
"admin.kpi.sourceManual": "manual"
```

---

## GA4 Service Account Setup (Pre-requisite — manual step by Bill)

Before the integration Lambda can be deployed:

1. Google Cloud Console → IAM & Admin → Service Accounts → Create
   - Name: `aintern-board-kpi`
   - Download JSON key
2. GA4 Admin → Property Access Management → add service account email as **Viewer**
3. Store JSON key in SSM:
   ```bash
   aws ssm put-parameter \
     --name "/aintern/prod/ga4/service-account-json" \
     --value "$(cat service-account.json)" \
     --type SecureString \
     --region eu-west-2
   ```
4. Store GA4 property ID in SSM:
   ```bash
   aws ssm put-parameter \
     --name "/aintern/prod/ga4/property-id" \
     --value "YOUR_PROPERTY_ID" \
     --type String \
     --region eu-west-2
   ```

---

## Build Sequence (CTO terminal order)

The following terminals must be dispatched **sequentially** — each depends on the previous.

| Step | Terminal | Agent | Backlog item |
|------|----------|-------|--------------|
| 1 | DynamoDB table + GSI provisioned in `AInternAdminStack` + `kpi-actuals.ts` Lambda + API Gateway routes | `lambda-feature-builder` | A-14 |
| 2 | `meeting-actions.ts` Lambda + API Gateway routes | `lambda-feature-builder` | A-14 |
| 3 | `kpi-integrations.ts` Lambda (CSV + S3 + GA4) + `/admin/kpi/refresh` route | `lambda-feature-builder` | A-13 |
| 4 | `useKpiApi.ts` composable + `useKpiStore.ts` update + Refresh button in `AdminKpiView.vue` | `vuejs-feature-builder` | A-13 |

Step 1 must be complete and deployed before Steps 2–3. Steps 3–4 can only start after Step 1 is deployed (Step 3 needs the DynamoDB table; Step 4 needs Step 3's endpoint).

**Pre-condition for Step 4:** Bill must complete the GA4 service account setup (manual step above) and confirm SSM parameters are stored before the terminal is dispatched.

---

## Acceptance Criteria

### A-14 (Steps 1–3)
- [ ] DynamoDB table `aintern-admin` live in eu-west-2
- [ ] `GET /admin/kpi/actuals?week=2026-W15` returns `{}` for empty week, actuals object for populated week
- [ ] `PUT /admin/kpi/actuals` upserts manual row; does not alter automated rows
- [ ] `POST /admin/meetings/{date}/items` and `PATCH` status update work end-to-end

### A-13 (Steps 4–5)
- [ ] `POST /admin/kpi/refresh` populates `cmo.2`, `kr2.2` from outreach CSV
- [ ] `POST /admin/kpi/refresh` populates `cpo.1`, `kr3.3` from S3 Kennisbank bucket
- [ ] `POST /admin/kpi/refresh` populates `cpo.3`, `kr3.4` from GA4 (or returns error in `errors[]` gracefully)
- [ ] Manual actuals set via `PUT` are never overwritten by `/refresh`
- [ ] KPI dashboard loads actuals from API on mount; falls back to localStorage cache if API unavailable
- [ ] Manual edit in dashboard calls `PUT` and updates DynamoDB
- [ ] "Refresh" button triggers `/refresh` then reloads actuals
- [ ] Source indicator (auto / manual) visible per metric in dashboard
- [ ] All new strings in `en.json` + `nl.json`
- [ ] `npm run type-check` passes
