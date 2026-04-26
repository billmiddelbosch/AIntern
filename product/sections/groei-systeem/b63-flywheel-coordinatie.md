# B-63 — Distributie Flywheel Coördinatie

**Backlog ID:** B-63  
**Owner:** CMO  
**Effort:** S  
**Depends on:** B-36, B-61, B-53, B-54, B-62 (data in DynamoDB)

---

## Purpose

Zelfversterkende loop bewaken via metrics per funnel-stap, wekelijkse cadans vasthouden, en anti-patterns vroeg signaleren via alerts.

**Flywheel:**
```
Pain Signals → Insights → Content → Inbound
     ↑                                   ↓
nieuwe Signals ← Deals ← Outreach ← Leads ← Lead Magnets
```

---

## Admin View: `/admin/groei-systeem`

**Component:** `AdminGroeisysteemView.vue`  
**Sidebar nav:** één item "Groei Systeem" — alle flywheel-functionaliteit op één plek.

### Tabs

| Tab | Inhoud | Spec |
|---|---|---|
| **Flywheel** | Metrics per funnel-stap + anti-pattern alerts | B-63 |
| **Subreddits** | Reddit kanalen beheren (toevoegen/togglen/verwijderen) | B-36 |
| **Pains** | Recente PainSignals — read-only inzicht | B-36 |
| **Cadans** | Wekelijkse checklist als runbook | B-63 |

### Tab: Flywheel — Layout

```
[Flywheel diagram — statisch SVG met live metric-badges per stap]

[Top Funnel]  [Mid Funnel]  [Bottom Funnel]

[Anti-pattern alerts]
```

---

## Metrics

### Top of Funnel

| Metric | Bron | Target/week |
|---|---|---|
| Pains gesignaleerd | DynamoDB PAIN# count (week) | ≥ 15 |
| Opportunity Statements gegenereerd | DynamoDB OPPORTUNITY# count (week) | ≥ 3 |
| Posts gepubliceerd | DynamoDB CONTENT# published count (week) | 3 |

### Mid Funnel

| Metric | Bron | Target/week |
|---|---|---|
| Engagement (likes + comments) | Handmatig invoer (LinkedIn admin) | Stijgende trend |
| Inbound DMs | Handmatig invoer | ≥ 1 |
| Workflow Scan submissions | DynamoDB SCAN# count (week) | ≥ 5 |
| Email captures | DynamoDB SCAN# met email (week) | ≥ 3 |

### Bottom Funnel

| Metric | Bron | Target/week |
|---|---|---|
| Outreach alerts | DynamoDB OUTREACH# count (week) | ≥ 3 |
| Cold email reply-rate | `experiment-log.csv` (handmatig) | ≥ 10% |
| Discovery calls | Handmatig invoer | ≥ 1 |
| Deals | Handmatig invoer | groeiend |

---

## Lambda: `lambda/src/flywheel-metrics.ts`

**Methode / pad:** `GET /flywheel-metrics?week=<ISO-week>`  
JWT-protected.

**Logic:** Query DynamoDB voor alle metric-bronnen gefilterd op week.  
**Response:**
```json
{
  "week": "2026-W18",
  "topFunnel": { "pains": 18, "opportunities": 4, "posts": 3 },
  "midFunnel": { "scanSubmissions": 7, "emailCaptures": 4 },
  "bottomFunnel": { "outreachAlerts": 5 }
}
```

Handmatige metrics (engagement, calls, deals) worden in DynamoDB opgeslagen als `METRIC#<week>#<key>` via een apart PUT endpoint — zelfde patroon als KPI actuals (A-14).

---

## Anti-Pattern Alerts

| Anti-patroon | Detectie | Actie |
|---|---|---|
| Geen nieuwe pains ≥ 3 dagen | PAIN# count < 1 in laatste 3 dagen | Rode badge in UI + CloudWatch alarm |
| Content week overgeslagen | CONTENT# published = 0 op donderdag | Oranje badge in UI |
| Scan submissions = 0 in week | SCAN# count < 1 in huidige week | Oranje badge in UI |
| Cold email reply-rate < 5% | experiment-log.csv waarde | CMO handmatig escaleren |

---

## Tab: Cadans — Wekelijkse Checklist

Interactieve checklist per week (opgeslagen in DynamoDB als `METRIC#<week>#cadans`):

| Dag | Actie | Owner |
|---|---|---|
| Maandag | Insight Extractie Lambda controleren + week review | CMO |
| Dinsdag | Post 1 van 3 publiceren | CMO + Bill |
| Woensdag | Post 2 van 3 publiceren + cold email batch | CMO |
| Donderdag | Post 3 van 3 publiceren | CMO + Bill |
| Dagelijks | 30 min Reddit reageren (Soft Outreach) | Bill |
| Vrijdag | Metrics reviewen, flywheel-score bijwerken | CMO |

---

## Acceptance Criteria

- [ ] `/admin/groei-systeem` heeft 4 tabs: Flywheel / Subreddits / Pains / Cadans
- [ ] Tab Flywheel: live metrics per funnel-stap geladen via Lambda
- [ ] Tab Flywheel: diagram toont metric-badges per stap
- [ ] Tab Flywheel: anti-pattern alerts zichtbaar als gekleurde badges
- [ ] Tab Flywheel: handmatige metrics invulbaar (engagement, calls, deals)
- [ ] Tab Flywheel: week-selector filtert alle metrics
- [ ] Tab Subreddits: subreddits toevoegen/togglen/verwijderen (zie B-36 AC)
- [ ] Tab Pains: laatste 20 PainSignals zichtbaar (read-only)
- [ ] Tab Cadans: wekelijkse checklist bruikbaar als runbook

## Out of Scope

- Automatische actie bij anti-patroon (alleen alert — mensen beslissen)
- Externe analytics koppeling
- Realtime updates (wekelijkse refresh volstaat)
- Email notificaties bij alerts (fase 2)
