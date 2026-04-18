# O-02 — Lead Pipeline Board + CRM Sync

**Backlog ID:** B-26  
**OKR:** 4.1 — Lead pipeline CRM active and updated weekly  
**Owner:** CTO (Morgan) — implementation; COO (Sam) — primary user  
**Effort:** L  
**Deadline:** 2026-04-30  
**Depends on:** A-14 (DynamoDB `aintern-admin` table — live), A-02 (admin auth — live)  
**Agent:** `vuejs-feature-builder` (board UI + composable) → `lambda-feature-builder` (lead CRUD endpoints + CSV importer)

---

## Overview

The outreach team currently manages leads via a raw CSV file (`product/marketing/leads/outreach-log.csv`). There is no UI to view pipeline stage, update status, or track progress toward the weekly outreach KPI. This feature adds a Kanban-style Lead Pipeline Board at `/admin/leads` in the existing admin dashboard so the COO and CEO can view and update leads without touching any files.

**Goal:** Replace the CSV as the operational source of truth with a DynamoDB-backed CRM board, accessible from the admin dashboard, that reflects the full outreach lifecycle from first discovery to won/lost.

---

## User Stories

1. **Als COO wil ik alle leads in één overzicht zien gegroepeerd per pipeline-fase**, zodat ik in één oogopslag zie hoeveel leads in elke fase zitten en waar actie nodig is.
2. **Als COO wil ik de status van een lead bijwerken door een kaart naar een andere kolom te slepen of via een dropdown**, zodat ik de pipeline up-to-date houd zonder een CSV te openen.
3. **Als CEO wil ik de details van een lead kunnen inzien** (LinkedIn-profiel, verzonden berichten, ontvangen reacties, geboekt gesprek), zodat ik context heb voor rapportage en bijsturing.
4. **Als COO wil ik bestaande CSV-leads eenmalig kunnen importeren via een knop in de dashboard UI**, zodat historische outreach zichtbaar blijft in het nieuwe systeem zonder handmatig kopiëren.

---

## Lead Data Model

```typescript
// src/types/lead.ts

export type LeadStatus =
  | 'new'               // Lead identified, not yet actioned
  | 'enriched'          // LinkedIn profile confirmed, ready to connect
  | 'connection_sent'   // Connection request sent on LinkedIn
  | 'connected'         // Connection accepted, no DM yet
  | 'dm_sent'           // First DM sent
  | 'dm_responded'      // Lead replied to DM
  | 'discovery_booked'  // Discovery call scheduled (Calendly or manual)
  | 'won'               // Client signed / project started
  | 'lost'              // Declined or no response after follow-ups
  | 'not_found'         // No valid LinkedIn profile found

export interface Lead {
  // Identity
  id: string                    // UUID v4, generated on import or creation
  website: string               // e.g. "tschuurtje.nl"
  companyName?: string          // Human-readable company name

  // LinkedIn
  linkedinUrl?: string          // Full profile URL
  linkedinName?: string         // Full name from profile

  // Pipeline state
  status: LeadStatus
  assignee?: string             // Role string: "COO", "CMO", etc.

  // Connection outreach
  connectionSentAt?: string     // ISO 8601 date
  connectionMessage?: string    // Text sent with request
  connectionVariant?: string    // A/B variant label (e.g. "ROI")

  // DM outreach
  dmSentAt?: string             // ISO 8601 date
  dmMessage?: string
  dmVariant?: string
  dmResponse?: string           // Free-text response from lead

  // Discovery call
  discoveryBookedAt?: string    // ISO 8601 date of scheduled call
  discoveryCallUrl?: string     // Calendly link or manual note

  // Meta
  source?: string               // "csv_import" | "manual" | "apify"
  notes?: string                // Free-text COO/CEO notes
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
}
```

---

## Pipeline Status Definitions

| Status | Label (NL) | Trigger |
|---|---|---|
| `new` | Nieuw | Lead is added to the system, no action taken |
| `enriched` | Verrijkt | LinkedIn URL and name confirmed |
| `connection_sent` | Verzoek verstuurd | Connection request sent on LinkedIn |
| `connected` | Verbonden | Connection accepted |
| `dm_sent` | DM verstuurd | First direct message sent |
| `dm_responded` | Reactie ontvangen | Lead replied to DM |
| `discovery_booked` | Gesprek gepland | Discovery call booked |
| `won` | Gewonnen | Deal closed / client active |
| `lost` | Verloren | No longer pursuing |
| `not_found` | Niet gevonden | No valid LinkedIn match found |

**Board columns (visible):** `new`, `enriched`, `connection_sent`, `connected`, `dm_sent`, `dm_responded`, `discovery_booked`, `won`, `lost` / `not_found` (grouped as "Gesloten").

**Drag-and-drop (CEO decision 2026-04-17):** Leads zijn sleepbaar tussen kolommen. Implementatie via native HTML5 drag-and-drop API met Vue event handlers (`@dragstart`, `@dragover`, `@drop`, `@dragleave`) — géén externe libraries of plugins.

---

## Component Architecture

### Route
```
/admin/leads   →   AdminLeadBoardView.vue
```
Add to the existing admin sidebar under "Pipeline".

### Components to create

| Component | Path | Responsibility |
|---|---|---|
| `AdminLeadBoardView.vue` | `src/views/admin/` | Page-level view; loads store, renders board + "Nieuwe lead" button |
| `LeadPipelineBoard.vue` | `src/components/leads/` | Kanban layout; renders one `LeadColumn` per status; owns drag state |
| `LeadColumn.vue` | `src/components/leads/` | Single pipeline column; `@dragover.prevent` + `@drop` handler; shows count badge + list of cards |
| `LeadCard.vue` | `src/components/leads/` | Compact card; `draggable="true"` + `@dragstart` sets `dataTransfer` with lead id; company name, LinkedIn name, status badge, last-action date |
| `LeadDetailModal.vue` | `src/components/leads/` | Full-screen modal; all lead fields, inline status dropdown, notes textarea |
| `LeadCreateModal.vue` | `src/components/leads/` | Modal with form to create a new lead manually: website (required), linkedinUrl, linkedinName, companyName, initial status; calls `POST /leads` |
| `LeadStatusBadge.vue` | `src/components/leads/` | Colour-coded pill for `LeadStatus` |
| `LeadImportButton.vue` | `src/components/leads/` | "CSV importeren" button; calls import endpoint; shows progress toast |

### Composable
```
src/composables/useLeads.ts
```
Wraps all CRUD calls to the Lambda endpoints. Exposes:
- `leads: Ref<Lead[]>`
- `fetchLeads(): Promise<void>`
- `createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead>`
- `updateLeadStatus(id: string, status: LeadStatus): Promise<void>`
- `updateLead(id: string, patch: Partial<Lead>): Promise<void>`
- `importFromCsv(): Promise<{ imported: number; skipped: number }>`

### Drag-and-drop implementation pattern (Vue native, no plugins)

`LeadPipelineBoard.vue` owns the drag state:
```typescript
const draggingLeadId = ref<string | null>(null)
```

`LeadCard.vue` sets the dragging id on `@dragstart`:
```typescript
function onDragStart(event: DragEvent, leadId: string) {
  draggingLeadId.value = leadId
  event.dataTransfer!.effectAllowed = 'move'
}
```

`LeadColumn.vue` handles the drop and calls `updateLeadStatus`:
```typescript
async function onDrop(targetStatus: LeadStatus) {
  if (!draggingLeadId.value) return
  await updateLeadStatus(draggingLeadId.value, targetStatus)
  draggingLeadId.value = null
}
```

Visual feedback: `LeadColumn` applies a Tailwind `ring-2 ring-blue-400` class while `dragover` is active (toggled via `@dragover.prevent` / `@dragleave`).

### Pinia store
```
src/stores/useLeadStore.ts
```
Holds `leads[]`, current filter (status, assignee), and loading/error state.

### i18n keys (add to `en.json` + `nl.json`)
Namespace: `leads.*` — status labels, column headers, modal field labels, toast messages.

---

## Backend: DynamoDB (recommended)

**Decision: DynamoDB as primary store, CSV retired after import.**

Rationale: The CSV has no concurrent-write safety, no history, and no query support. DynamoDB follows the A-14 pattern already live in `aintern-admin`. The CSV is used only for the one-time import.

### Table: `aintern-admin` (existing single-table)

| pk | sk | Attributes |
|---|---|---|
| `LEAD#<id>` | `LEAD` | all `Lead` fields as flat DynamoDB attributes |

No GSI needed for the initial version — all leads are fetched with a `begins_with(pk, "LEAD#")` scan (< 1000 items expected). Add `StatusIndex` GSI when volume justifies it.

### Lambda functions (`lambda/src/`)

#### `lead-crud.ts`

Routes (behind existing API Gateway, JWT-protected):

| Method | Path | Action |
|---|---|---|
| `GET` | `/leads` | List all leads (full objects) |
| `GET` | `/leads/:id` | Get single lead |
| `PUT` | `/leads/:id` | Full replace (used for status update + field edits) |
| `POST` | `/leads` | Create new lead (manual add via dashboard — CEO decision 2026-04-17) |

#### `lead-import.ts`

| Method | Path | Action |
|---|---|---|
| `POST` | `/leads/import` | Read CSV from S3 (`aintern-kennisbank` bucket, key `leads/outreach-log.csv`), parse rows, upsert into DynamoDB by `website` key. Returns `{ imported, skipped, errors }`. |

All handlers follow the CORS `corsOrigin` + `respond` pattern mandated in CLAUDE.md.

---

## CSV Import: Migration Strategy

1. **Upload:** The existing `outreach-log.csv` is uploaded once to S3 (`aintern-kennisbank/leads/outreach-log.csv`) by the COO or via a one-line npm script: `npm run leads:upload-csv`.
2. **Trigger:** COO clicks "CSV importeren" in the dashboard UI → calls `POST /leads/import`.
3. **Upsert logic:** Match on `website` field. If a lead with that website already exists in DynamoDB, skip (do not overwrite). If not, insert with `source: "csv_import"` and `status` mapped from the CSV value (see mapping below).
4. **Status mapping from CSV:**

| CSV `status` | DynamoDB `LeadStatus` |
|---|---|
| `dm_sent` | `dm_sent` |
| `connection_sent` | `connection_sent` |
| `not_found` | `not_found` |
| *(empty / unknown)* | `new` |

5. **Post-import:** The CSV file is **not deleted** — it remains as a read-only historical archive.

---

## Acceptance Criteria

- [ ] `/admin/leads` route is accessible to authenticated admin users and renders the Kanban board
- [ ] Board shows all 10 status columns (or 9 + 1 "Gesloten" group) with card count per column
- [ ] Each `LeadCard` shows: company name (from website if `companyName` absent), `linkedinName`, status badge, and `updatedAt` date
- [ ] Clicking a card opens `LeadDetailModal` with all stored fields visible
- [ ] LeadCard is draggable; dropping it on a different column calls `updateLeadStatus` and the card moves visually; drag target column shows a blue ring highlight during dragover
- [ ] COO can change lead status via a dropdown in `LeadDetailModal` as well (alternative to drag-and-drop); change persists to DynamoDB on save
- [ ] COO can add/edit free-text `notes` on a lead; saves on blur or explicit save button
- [ ] "CSV importeren" button is visible on the board; triggers import, shows result toast (`X leads geïmporteerd, Y overgeslagen`)
- [ ] Import is idempotent: running it twice does not duplicate leads
- [ ] All status labels and field labels are translated in both `en.json` and `nl.json`
- [ ] `npm run type-check` passes with zero errors
- [ ] Lambda endpoints return `400` for malformed input, `401` for missing/invalid JWT
- [ ] CORS headers follow the `corsOrigin` pattern for both `prod` and `dev` aliases

---

## Decisions Log (CEO — 2026-04-17)

1. **Drag-and-drop** → In scope. Native HTML5 drag API with Vue event handlers only — no external drag-and-drop libraries.
2. **Manual lead creation** → In scope. "Nieuwe lead" button opens `LeadCreateModal`; calls `POST /leads`.

---

## Out of Scope

- Real-time multi-user sync (optimistic updates only; no WebSocket/polling)
- Bulk status updates across multiple leads
- Email or calendar integration (discovery call booking remains via Calendly link)
- Lead scoring or AI enrichment
- Exporting leads back to CSV or any other format
- Public-facing pipeline status page
- Role-based access differences between COO and CEO (both see all leads for v1)
- Automated status transitions triggered by LinkedIn events
