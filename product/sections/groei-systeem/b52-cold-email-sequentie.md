# B-52 — Geautomatiseerde Cold Email Sequentie

**Backlog ID:** B-52  
**Owner:** CMO (operationeel), CTO (implementatie)  
**Effort:** M  
**Depends on:** B-51 (winnende variant bepaald + reply-rate ≥ 10%), B-61 (OpportunityStatements)  
**Start:** Na goedkeuring CEO op basis van B-55 rapport

---

## Purpose

4-staps geautomatiseerde email sequentie gebaseerd op de winnende B-51 variant. Context/gedrag-based — elke email bouwt voort op de vorige. Maximaal 50 actieve contacten in fase 1 (Apollo gratis limiet).

---

## Sequentie Design

| Email | Timing | Inhoud | CTA |
|---|---|---|---|
| 1 | Dag 0 | Winnende B-51 template + link `/wat-kost-handmatig-werk` | "Herken je dit?" |
| 2 | Dag 5 | Relevante case study of observatie uit Pain Database | "Zag je de kans?" |
| 3 | Dag 12 | Soft pitch op gesignaleerd pijnpunt (AIntern aanpak) | "Wil je dit oplossen?" |
| 4 | Dag 19 | Call invite + no-cure-no-pay urgency | "15 minuten?" |

**Stop-condities:**
- Reply ontvangen → sequentie gestopt, lead handmatig verwerkt
- Email bounced → verwijderd uit sequentie, niet herhaald
- 4 emails verstuurd zonder reply → status: `completed`

---

## Data Model

```typescript
// src/types/sequenceEntry.ts

export type SequenceStatus = 'active' | 'replied' | 'bounced' | 'completed'
export type EmailVariant = 'A' | 'B' | 'C'

export interface SequenceEntry {
  id: string
  email: string
  company?: string
  contactName?: string
  opportunityId: string
  variant: EmailVariant     // winnende B-51 variant
  currentStep: 1 | 2 | 3 | 4
  nextSendAt: string        // ISO 8601
  status: SequenceStatus
  repliedAt?: string
  bouncedAt?: string
  notes?: string
  createdAt: string
}
```

**DynamoDB (`aintern-admin`):**

| pk | sk | GSI1pk | GSI1sk |
|---|---|---|---|
| `SEQUENCE#<id>` | `ENTRY` | `STATUS#active` | `<nextSendAt>` |

---

## Lambda Architecture

### `lambda/src/sequence-scheduler.ts`

**Trigger:** EventBridge cron `0 6 * * ? *` (dagelijks 08:00 Amsterdam / 06:00 UTC)

**Logic:**
1. Query DynamoDB: SequenceEntries met `GSI1pk = STATUS#active` en `nextSendAt <= now`
2. Per entry: laad email template voor `currentStep` + vul placeholders in vanuit OpportunityStatement
3. Verstuur via Zapier `gmail_send_email` (Bill's Gmail account)
4. Update entry: `currentStep + 1`, `nextSendAt = now + interval`
5. Als `currentStep` was 4: `status → 'completed'`

**Email templates:** Markdown bestanden in `product/marketing/cold-email/templates/`
- `step1.md`, `step2.md`, `step3.md`, `step4.md`
- Placeholders: `{{firstName}}`, `{{company}}`, `{{pain}}`, `{{opportunity}}`

### `lambda/src/sequence-reply-handler.ts`

**Trigger:** Handmatig (Bill markeert reply in admin) of toekomstige Gmail webhook  
**Logic:** PUT `/sequence/:id/reply` → `status → 'replied'`, `repliedAt = now`

---

## Stack

| Component | Tool | Motivatie |
|---|---|---|
| Email sending | Zapier `gmail_send_email` | Bestaande Zapier MCP; AVG-compliant voor NL |
| Sequentie logica | Lambda + EventBridge | Geen externe tool; 5–7 dag delays via nextSendAt polling |
| Email discovery | Apollo.io gratis | 50 credits/maand — voldoende fase 1 |
| Tracking | DynamoDB SequenceEntry | Eigen logging, geen pixel tracking |

**Uitgesloten:** SES/SNS (ontbreekt sequentie-logica, AVG-risico), Mailchimp/Klaviyo (bulk-tools, overkill voor fase 1).

---

## Fase 1 Limieten

| Parameter | Limiet | Reden |
|---|---|---|
| Actieve contacten | ≤ 50 | Apollo gratis tier |
| Emails per dag | ≤ 10 | Gmail spam-risico |
| Start | Na B-51 ≥ 10% reply-rate | Validatie eerst |

---

## Acceptance Criteria

- [ ] Start pas na CEO-goedkeuring op basis van B-55 rapport
- [ ] Email 1 verstuurd op dag 0, emails 2/3/4 op correcte intervallen
- [ ] Stop-conditie bij reply: `status → 'replied'`, geen verdere emails
- [ ] Bounced emails worden niet herhaald
- [ ] DynamoDB SequenceEntry bijgehouden per contact per stap
- [ ] Maximaal 50 actieve contacten tegelijk
- [ ] Geen email tracking pixels

## Out of Scope

- Bulk sending > 50 contacten in fase 1
- Gmail open/click tracking
- Automatisch reply detecteren (handmatig in fase 1)
- Integratie met extern CRM
