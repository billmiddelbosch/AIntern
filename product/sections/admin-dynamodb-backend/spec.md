# A-14 — DynamoDB Backend: KPI Actuals + Meeting Action Items

**Backlog ID:** A-14
**Owner:** CTO (Morgan)
**Effort:** L
**Depends on:** A-02 (auth Lambda + API Gateway — already live)
**Required by:** A-13, A-15
**Agent:** `lambda-feature-builder` (DynamoDB provisioning + CRUD endpoints)

---

## Overview

Provision a DynamoDB table inside the existing `AInternAdminStack` (eu-west-2) and expose
Lambda CRUD endpoints behind the existing API Gateway. Two entity types share one table
(single-table design). The frontend KPI store and the meeting action items view both read/write
through these endpoints — never directly to DynamoDB.

---

## DynamoDB Table Design

**Table name:** `aintern-admin` (one table, single-table design)
**Region:** `eu-west-2`
**Billing:** On-demand (PAY_PER_REQUEST)

### Key schema

| Attribute | Type | Role |
|-----------|------|------|
| `pk` | String | Partition key |
| `sk` | String | Sort key |

### Entity patterns

#### KPI Actuals

Stores per-metric actuals keyed by ISO week. Allows historical week-over-week tracking.

| pk | sk | Attributes |
|----|----|----|
| `METRIC#2026-W15` | `cmo.2` | `value: 3`, `source: "automated"`, `updatedAt: "..."` |
| `METRIC#2026-W15` | `kr2.2` | `value: 42`, `source: "automated"`, `updatedAt: "..."` |
| `METRIC#2026-W15` | `kr1.1` | `value: 0`, `source: "manual"`, `updatedAt: "..."` |

- `source`: `"automated"` (written by integration Lambda) or `"manual"` (written by user via dashboard)
- Manual values are never overwritten by the integration Lambda — integration only writes `source: "automated"` rows
- If no row exists for a metric, the frontend falls back to `0`

#### Meeting Action Items

| pk | sk | Attributes |
|----|----|----|
| `MEETING#2026-04-11` | `ITEM#b-01` | `assignee`, `description`, `dueDate`, `status`, `obsidianFile` |
| `MEETING#2026-04-11` | `ITEM#b-02` | ... |

- `status`: `"open"` \| `"done"`
- `obsidianFile`: filename relative to `AIntern Meeting Minutes/` folder (e.g. `2026-04-11 AIntern Boardvergadering.md`)
- `assignee`: role string (e.g. `"CMO"`, `"CTO"`)

### GSI

| GSI name | pk | sk | Purpose |
|----------|----|-----|---------|
| `AssigneeIndex` | `assignee` | `sk` | Query all open action items by owner (for A-15 filter) |

---

## Lambda Functions

Both functions live in `lambda/src/` and follow the existing pattern in `admin-auth.ts`:
- Region: `eu-west-2`
- Auth: JWT Bearer token validated against SSM-stored secret (same as auth Lambda)
- CORS: `https://aintern.nl` (prod) / `http://localhost:5173` (dev)
- Built with esbuild (same build pipeline)

### 1. `kpi-actuals.ts`

**Routes (behind existing API Gateway):**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/kpi/actuals?week={isoWeek}` | Fetch all actuals for a given week |
| PUT | `/admin/kpi/actuals` | Upsert a single manual actual |

**GET response:**
```json
{
  "week": "2026-W15",
  "actuals": {
    "cmo.1": { "value": 1, "source": "manual" },
    "cmo.2": { "value": 3, "source": "automated" },
    "kr2.2": { "value": 42, "source": "automated" }
  }
}
```

**PUT body:**
```json
{ "week": "2026-W15", "metricId": "kr1.1", "value": 1 }
```
PUT always sets `source: "manual"`. Returns `204 No Content`.

### 2. `meeting-actions.ts`

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/meetings?date={YYYY-MM-DD}` | List action items for a meeting date |
| GET | `/admin/meetings` | List all meetings (distinct dates, most recent first) |
| POST | `/admin/meetings/{date}/items` | Create action item |
| PATCH | `/admin/meetings/{date}/items/{id}` | Update status or fields |

**Action item shape:**
```json
{
  "id": "b-01",
  "meetingDate": "2026-04-11",
  "assignee": "CTO",
  "description": "Wekelijkse security check uitvoeren",
  "dueDate": "2026-04-11",
  "status": "done",
  "obsidianFile": "2026-04-11 AIntern Boardvergadering.md"
}
```

---

## Infrastructure Changes to `AInternAdminStack`

The existing CDK/CloudFormation stack (from A-02) needs the following additions:

1. **DynamoDB table** — `aintern-admin` with PK/SK and `AssigneeIndex` GSI
2. **Lambda permissions** — `kpi-actuals` and `meeting-actions` Lambdas get `dynamodb:GetItem`, `PutItem`, `Query`, `UpdateItem` on the table
3. **API Gateway routes** — add `/admin/kpi/*` and `/admin/meetings/*` routes, each with the existing JWT authorizer

Store the table name in SSM (`/aintern/{env}/dynamodb/table-name`) so Lambdas resolve it at runtime without hardcoding.

---

## Acceptance Criteria

- [ ] `aintern-admin` DynamoDB table deployed in eu-west-2 with correct key schema and GSI
- [ ] `GET /admin/kpi/actuals?week=2026-W15` returns all actuals for that week (empty object if none)
- [ ] `PUT /admin/kpi/actuals` with valid JWT upserts a manual actual; returns 204
- [ ] `PUT /admin/kpi/actuals` without JWT returns 401
- [ ] Integration Lambda (A-13) can write `source: "automated"` rows without overwriting manual rows
- [ ] `GET /admin/meetings` returns list of meeting dates
- [ ] `POST /admin/meetings/{date}/items` creates an action item; `PATCH` updates its status
- [ ] All endpoints return correct CORS headers for prod and dev origins
- [ ] Table name resolved from SSM — no hardcoded values in Lambda source

---

## Out of Scope

- Deleting KPI actuals (soft-delete not needed; just update to 0)
- Multi-user concurrency control (single-admin use case)
- Historical week queries beyond current quarter (not needed yet)
