# B-62 — Soft Outreach Layer

**Backlog ID:** B-62  
**Owner:** CMO  
**Effort:** S  
**Depends on:** B-36 (PainSignals in DynamoDB), B-61 (OpportunityStatements)  
**Triggered by:** Dagelijks monitoring Lambda

---

## Purpose

Detecteer intent-signalen op Reddit van gebruikers die actief een pijnpunt uiten dat matcht met een Opportunity Statement. Alert Bill met een AI-gedraft reactievoorstel. Bill beslist altijd zelf of hij reageert.

**Kernregel:** Geen automatische berichten. Bill handelt. Tool ondersteunt.

---

## Intent vs. Signaal

B-36 detecteert pains (laagdrempelig, hotScore ≥ 10).  
B-62 detecteert **intent** — hogere drempel:

| Criterium | B-36 | B-62 |
|---|---|---|
| Doel | Pain verzamelen | Outreach-kandidaat vinden |
| hotScore drempel | ≥ 10 | ≥ 15 |
| Type post | Klacht, observatie, vraag | Actief op zoek naar oplossing |
| Match vereist | nee | ja — OpportunityStatement met `priority = 'high'` |
| Actie | DynamoDB opslaan | Alert + reactievoorstel voor Bill |

**Intent-signalen:**
- Post bevat vraag ("hoe kan ik...", "wat raad je aan...", "iemand ervaring met...")
- Auteur reageert actief op comments
- Zoekt specifiek een tool of oplossing

---

## Data Model

```typescript
// src/types/outreachAlert.ts

export type OutreachAlertStatus = 'pending' | 'responded' | 'dm_sent' | 'ignored'
export type OutreachIntent = 'question' | 'complaint' | 'solution_seeking'

export interface OutreachAlert {
  id: string
  painSignalId?: string      // gekoppeld B-36 signaal (indien gevonden)
  opportunityId: string      // gematchte OpportunityStatement
  source: 'reddit'
  sourceUrl: string
  authorName: string
  intent: OutreachIntent
  suggestedResponse: string  // Claude Haiku voorstel — behulpzaam, geen pitch
  status: OutreachAlertStatus
  respondedAt?: string
  dmSentAt?: string
  notes?: string
  createdAt: string
}
```

**DynamoDB (`aintern-admin`):**

| pk | sk | GSI1pk | GSI1sk |
|---|---|---|---|
| `OUTREACH#<id>` | `ALERT` | `STATUS#pending` | `<createdAt>` |

---

## Lambda: `lambda/src/soft-outreach-monitor.ts`

**Trigger:** EventBridge cron `0 7 * * ? *` (dagelijks 09:00 Amsterdam / 07:00 UTC)

### Logic

1. Fetch Reddit posts (zelfde subreddits als B-36 allowlist)
2. Filter op intent-signalen (hotScore ≥ 15 + bevat vraagmarkering of oplossingzoekende termen)
3. Controleer of `sourceUrl` al bestaat in `OUTREACH#` items — skip als ja (idempotent)
4. Query DynamoDB: OpportunityStatements met `priority = 'high'` en `status != 'archived'`
5. Match post.painCategory → OpportunityStatement.pain (keyword overlap via Claude Haiku)
6. Bij match: genereer `suggestedResponse` via Claude Haiku
7. Sla OutreachAlert op in DynamoDB met `status: 'pending'`

### Suggested response prompt

```
Schrijf een behulpzame reactie op deze Reddit post.
Toon: expert collega, geen verkoper.
Max 150 woorden. Geef concrete tip. Noem AIntern NIET.
Pas de tip aan op de sector/context van de post.

Post: {title} — {text}
Relevante opportunity context: {opportunity}

Retourneer ONLY valid JSON: { "response": "...", "intent": "question|complaint|solution_seeking" }
```

---

## Approval Flow

```
OutreachAlert (status: pending)
  → [Fase 2] Admin notificatie / /admin/outreach
  → Bill bekijkt sourceUrl + suggestedResponse
  → Bill reageert handmatig op Reddit
  → Bill updatet status → 'responded'
  → Bij hoge verdere intent: Bill stuurt LinkedIn DM
  → Status → 'dm_sent'
```

**Fase 1:** Bill controleert dagelijks handmatig DynamoDB via admin panel of email notificatie.  
**Fase 2:** `/admin/outreach` view (zie B-63 of apart B-item).

---

## Acceptance Criteria

- [ ] Lambda draait dagelijks zonder fouten
- [ ] Alleen posts met hotScore ≥ 15 en intent-signalen worden verwerkt
- [ ] Geen dubbele alerts per `sourceUrl`
- [ ] `opportunityId` aanwezig en verwijst naar bestaand `OPPORTUNITY#` item
- [ ] `suggestedResponse` is behulpzaam en bevat geen AIntern-pitch
- [ ] Status-update door Bill mogelijk (PUT endpoint)

## Out of Scope

- Automatisch reageren op Reddit (nooit)
- X / Twitter monitoring (toekomstig)
- Admin UI `/admin/outreach` (fase 2 — apart B-item)
- Email notificatie naar Bill (fase 2)
