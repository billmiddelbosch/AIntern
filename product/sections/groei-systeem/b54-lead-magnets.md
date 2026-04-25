# B-54 — Lead Magnets: AI Workflow Scanner

**Backlog ID:** B-54  
**Owner:** CMO + CTO  
**Effort:** M  
**Route:** `/workflow-scan` — publieke route, geen auth vereist  
**Depends on:** DynamoDB `aintern-admin` (live), bestaande Lambda API Gateway

---

## Purpose

Interactieve Vue SPA-tool die een MKB-bedrijf scant op workflow-inefficiënties. Efficiency score en top-3 knelpunten direct zichtbaar; volledig rapport (inclusief aanbevelingen) alleen na email capture.

---

## Routing & Auth

`/workflow-scan` valt **buiten** de Vue Router auth guard die `/admin` beschermt.

```typescript
// router/index.ts — bestaande auth guard raakt /workflow-scan niet aan
{
  path: '/workflow-scan',
  name: 'workflow-scan',
  component: () => import('@/views/WorkflowScanView.vue'),
  // geen meta.requiresAuth
}
```

Layout: zelfde publieke layout als homepage (`App.vue` met standaard nav + footer).  
**Geen login vereist.** Bezoekers bereiken de tool direct via URL, marketing link, of CTA op homepage.

### Homepage CTA (koppeling)

Voeg op de homepage een zichtbare CTA toe naar `/workflow-scan`:
- Sectie of knop: "Scan je workflow gratis →"
- Locatie: na de hero of in de NoCureNoPay-sectie

---

## User Flow

```
Welkomstscherm
  → Vragenflow (7 vragen, 1 per scherm, progress bar)
  → Score berekening (client-side)
  → Deelresultaat: score-gauge + top-3 knelpunten [ZICHTBAAR ZONDER EMAIL]
  → Email capture gate: "Ontvang je volledige analyse + aanbevelingen"
  → Volledig rapport: uitgebreide analyse + aanbevelingen + AIntern CTA
```

---

## Vragenstructuur

| # | Vraag | Type | Scorepunten |
|---|---|---|---|
| 1 | Hoeveel uur/week besteedt je team aan repetitieve taken? | Slider 0–20u | 0–20 pts |
| 2 | Werken jullie systemen automatisch samen (bijv. ERP ↔ webshop)? | 3-choice: Ja / Deels / Nee | 0 / 10 / 20 pts |
| 3 | Worden klantgegevens op meerdere plekken handmatig ingevoerd? | Ja / Nee | 15 / 0 pts |
| 4 | Hoe vaak ontstaan fouten door menselijke invoer? | 3-choice: Zelden / Soms / Regelmatig | 0 / 10 / 20 pts |
| 5 | Beschikt je team over AI-tools in de dagelijkse workflow? | 3-choice: Ja / Paar / Nee | 0 / 10 / 20 pts |
| 6 | Hoe lang duurt een standaard offerte of rapport? | 3-choice: < 30 min / 30–90 min / 90+ min | 0 / 10 / 20 pts |
| 7 | In welke sector werkt je bedrijf? | Dropdown (geen punten) | — |

**Max rawScore:** 115 punten  
**Efficiency score:** `Math.round((1 - rawScore / 115) * 100)` → 0–100  
(hogere rawScore = meer inefficiëntie = lagere efficiency score)

**Interpretatie:**
| Score | Label | Kleur |
|---|---|---|
| 70–100 | Relatief geoptimaliseerd | groen |
| 40–69 | Geïdentificeerde gaps | oranje |
| 0–39 | Hoog automatiserings-potentieel | rood |

---

## Top-3 Knelpunten Generatie (client-side)

```typescript
const ISSUE_MAP: Record<string, { threshold: (v: unknown) => boolean; label: string }[]> = {
  q1: [{ threshold: (v) => (v as number) >= 10, label: 'Hoge tijdsbesteding aan repetitief werk' }],
  q2: [{ threshold: (v) => v === 'Nee', label: 'Systemen werken niet samen — handmatige overdracht' }],
  q3: [{ threshold: (v) => v === 'Ja', label: 'Dubbele data-invoer verhoogt foutkans' }],
  q4: [{ threshold: (v) => v === 'Regelmatig', label: 'Structurele invoerfouten door menselijke factor' }],
  q5: [{ threshold: (v) => v === 'Nee', label: 'Geen AI-ondersteuning in huidige werkprocessen' }],
  q6: [{ threshold: (v) => v === '90+ min', label: 'Traag offerteproces — verlies van verkoopkansen' }],
}
```

---

## Data Model

```typescript
// src/types/workflowScan.ts

export interface WorkflowScanSubmission {
  id: string
  email: string
  score: number          // efficiency score 0–100
  rawScore: number       // 0–115
  answers: Record<string, string | number>
  topIssues: string[]    // top-3 labels uit ISSUE_MAP
  sector?: string
  createdAt: string
}
```

**DynamoDB (`aintern-admin`):**

| pk | sk | GSI1pk | GSI1sk |
|---|---|---|---|
| `SCAN#<id>` | `SUBMISSION` | `STATUS#new` | `<createdAt>` |

---

## Component Architecture

### Route

```
/workflow-scan   →   WorkflowScanView.vue   (publiek, geen auth guard)
```

### Components

| Component | Verantwoordelijkheid |
|---|---|
| `WorkflowScanView.vue` | Orchestrator — stap-tracking, state, navigatie |
| `WorkflowScanWelcome.vue` | Introscherm + start-knop + verwachting (7 vragen, 3 min) |
| `WorkflowScanQuestion.vue` | Single question renderer: slider / 3-choice / dropdown |
| `WorkflowScanProgress.vue` | Voortgangsbalk (stap X van 7) |
| `WorkflowScanPartialResult.vue` | Score-gauge (0–100) + top-3 knelpunten als bullets |
| `WorkflowScanEmailGate.vue` | Email input + privacytekst ("We sturen je het rapport — geen spam") + submit |
| `WorkflowScanFullReport.vue` | Volledige analyse + aanbevelingen per knelpunt + AIntern CTA |

### Composable

```
src/composables/useWorkflowScan.ts
```

Verantwoordelijk voor: score berekening, topIssues generatie, Lambda POST submit, state management.

---

## Lambda: `lambda/src/workflow-scan.ts`

**Methode / pad:** `POST /workflow-scan`  
JWT-auth **niet** vereist — publiek endpoint, geen Authorization header nodig.

**Request body:**
```json
{
  "email": "...",
  "answers": { "q1": 12, "q2": "Nee", "q3": "Ja", "q4": "Soms", "q5": "Paar", "q6": "30-90 min", "q7": "Webshop" },
  "score": 34,
  "rawScore": 75,
  "topIssues": ["Hoge tijdsbesteding aan repetitief werk", "..."]
}
```

**Response:**
```json
{
  "id": "uuid",
  "recommendations": [
    { "issue": "...", "recommendation": "...", "ainternApproach": "..." }
  ]
}
```

Aanbevelingen gegenereerd via Claude Haiku op basis van topIssues + sector.

**CORS:** `corsOrigin()` patroon verplicht — endpoint bereikbaar vanuit publieke frontend.

---

## Volledig Rapport Layout

### Deelresultaat (pre-email gate)
- Score gauge (cirkel, kleurgecodeerd)
- Top-3 knelpunten als bullet-lijst
- "Zie je jezelf hierin? Ontvang je volledige analyse →" CTA

### Volledig rapport (post-email)
1. Score + interpretatie-label
2. Per knelpunt: uitleg + concrete aanbeveling
3. "Wat AIntern hiermee doet" — specifiek per aanbeveling
4. CTA: "Plan een gratis gesprek" → Calendly deeplink

---

## Acceptance Criteria

- [ ] `/workflow-scan` is publiek toegankelijk zonder login
- [ ] Route staat **buiten** de auth guard in `router/index.ts`
- [ ] Vragenflow van 7 stappen werkt op mobile + desktop
- [ ] Score berekening correct (rawScore → 0–100)
- [ ] Top-3 knelpunten gegenereerd o.b.v. antwoorden (client-side, geen extra API call)
- [ ] Deelresultaat volledig zichtbaar zonder email
- [ ] Email capture gate blokkeert volledig rapport
- [ ] Lambda POST slaat submission op in DynamoDB
- [ ] Lambda `POST /workflow-scan` vereist geen JWT
- [ ] `corsOrigin()` patroon aanwezig in Lambda handler
- [ ] Aanbevelingen gegenereerd en zichtbaar in volledig rapport
- [ ] Homepage CTA "Scan je workflow gratis →" linkt naar `/workflow-scan`
- [ ] `npm run type-check` pass

## Out of Scope

- Bevestiging e-mail na submit (toekomstige extensie)
- PDF download van rapport
- LinkedIn Ads koppeling (apart B-item)
- Admin dashboard voor scan resultaten (B-63 `/admin/groei-systeem`)
