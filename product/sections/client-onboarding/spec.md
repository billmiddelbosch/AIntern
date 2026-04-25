# O-03 — Client Onboarding Checklist (MVP)

**Backlog item:** O-03  
**Deadline:** 1 mei 2026  
**Owner:** Morgan (CTO) — implementation  
**Scope approved by:** Board (2026-04-25)

---

## Goal

Ensure every new client goes through a standardised, trackable onboarding process. Prevent steps from being skipped. Give CEO/COO a single place to monitor onboarding progress per client.

## User Story

> As a CEO or COO, when a new client signs, I create an onboarding checklist entry so that every onboarding step is tracked and nothing falls through the cracks.

---

## MVP Scope

### Included
- Manual creation of a checklist entry per client (CEO/COO triggers)
- Fixed checklist of 10 items covering end-to-end AI automation onboarding
- Each item can be toggled done / not done, with timestamp recorded
- DynamoDB as backend store (one item per client)
- Admin-only access via `/admin/onboarding` and `/admin/onboarding/:clientId`
- Minimal checklist UI: list view + toggle per item

### NOT included (future iterations)
- Client-facing portal or shared access
- Email/Slack notifications on item completion
- Custom checklist templates per client type
- File attachments or comments per checklist item
- Automated triggering from CRM or contract signing

---

## Trigger

**Manual.** CEO or COO navigates to `/admin/onboarding`, clicks "New client", fills in `clientName`, and submits. The system creates the DynamoDB entry with all checklist items defaulting to `done: false`.

---

## Checklist Items

| # | id | label |
|---|-----|-------|
| 1 | intro_call | Introductiegesprek gevoerd (doelen, verwachtingen, tijdlijn) |
| 2 | access_setup | Toegang verleend (systemen, tools, accounts) |
| 3 | nda_signed | NDA / verwerkersovereenkomst ondertekend |
| 4 | process_mapping | Proceskaart opgesteld (te automatiseren workflow gedocumenteerd) |
| 5 | data_sample | Voorbeelddata ontvangen en gevalideerd |
| 6 | first_automation | Eerste automatisering opgeleverd (demo of live) |
| 7 | client_feedback | Feedbackronde afgerond (client akkoord of aanpassingen verwerkt) |
| 8 | go_live | Go-live bevestigd door client |
| 9 | training | Gebruikerstraining gegeven |
| 10 | sign_off | Formele sign-off ontvangen (handtekening of schriftelijke bevestiging) |

---

## Data Model — DynamoDB

**Table:** `ClientOnboarding` (created in existing `AIntern` DynamoDB setup)  
**Partition key:** `clientId` (UUID, generated at creation)

### Item schema

```json
{
  "clientId": "uuid-v4",
  "clientName": "Acme BV",
  "createdAt": "2026-04-25T10:00:00Z",
  "createdBy": "ceo | coo",
  "status": "active | completed",
  "items": [
    {
      "id": "intro_call",
      "label": "Introductiegesprek gevoerd",
      "done": false,
      "completedAt": null
    }
  ]
}
```

### Status logic
- `status` defaults to `active` on creation
- `status` becomes `completed` automatically when all 10 items have `done: true`
- No manual status override needed in MVP

---

## Access

- **Role required:** `admin`
- **Auth guard:** existing admin route guard on `/admin` prefix
- No client-facing access in MVP

---

## UI

### Routes
| Path | View | Description |
|------|------|-------------|
| `/admin/onboarding` | `OnboardingListView.vue` | Table of all clients + overall progress (x/10 done) |
| `/admin/onboarding/:clientId` | `OnboardingDetailView.vue` | Full checklist for one client; toggle each item |

### List view (`/admin/onboarding`)
- Table columns: Client name, Created date, Progress (e.g. `7/10`), Status badge (active/completed)
- Button: "Nieuwe client toevoegen" → modal with `clientName` input → POST to Lambda → redirect to detail view

### Detail view (`/admin/onboarding/:clientId`)
- Header: client name + status badge
- Checklist: 10 items, each with a checkbox and `completedAt` timestamp when done
- Toggle is an immediate PATCH call; no save button needed
- Back link to list view

### Lambda endpoints (new)
| Method | Path | Action |
|--------|------|--------|
| POST | `/onboarding` | Create entry (body: `{ clientName, createdBy }`) |
| GET | `/onboarding` | List all entries |
| GET | `/onboarding/:clientId` | Get single entry |
| PATCH | `/onboarding/:clientId/items/:itemId` | Toggle item done/not done |

---

## Open Questions

None — board decided MVP scope on 2026-04-25.
