# B-53 — Content Engine

**Backlog ID:** B-53  
**Owner:** CMO (operationeel), CTO (implementatie)  
**Effort:** M  
**Depends on:** B-61 (OpportunityStatements in DynamoDB), B-43 `/admin/linkedin` (live)  
**Produces:** ContentDrafts → `/admin/linkedin` approval queue

---

## Purpose

Lambda genereert LinkedIn company posts en X threads vanuit Opportunity Statements. Posts gaan naar de approval queue — Bill keurt goed, Zapier publiceert.

**Kernregel:** Nooit automatisch publiceren. Bill beslist altijd.

---

## Data Model

```typescript
// src/types/contentDraft.ts

export type ContentChannel = 'linkedin_company' | 'x'
export type ContentFormat = 'post' | 'thread'
export type ContentStatus = 'draft' | 'approved' | 'published' | 'archived'

export interface ContentDraft {
  id: string
  opportunityId: string
  channel: ContentChannel
  format: ContentFormat
  content: string           // LinkedIn post of X-thread tekst
  hashtags?: string         // komma-gescheiden
  status: ContentStatus
  scheduledFor?: string     // ISO 8601 — reminder only
  publishedAt?: string      // handmatig ingevuld na publicatie
  engagementNotes?: string
  createdAt: string
  updatedAt: string
}
```

LinkedIn company posts worden opgeslagen als `CONTENT#<id>` / `DRAFT` in `aintern-admin`.  
Bestaande A-19 `/admin/linkedin` infra geldt voor Bill's persoonlijk profiel — company posts krijgen eigen tab of label in dezelfde view.

**DynamoDB (`aintern-admin`):**

| pk | sk | GSI1pk | GSI1sk |
|---|---|---|---|
| `CONTENT#<id>` | `DRAFT` | `CHANNEL#linkedin_company` | `<scheduledFor>` |

---

## Lambda: `lambda/src/content-engine.ts`

**Trigger:** EventBridge cron `0 7 ? * WED *` (woensdag 09:00 Amsterdam / 07:00 UTC)  
Alternatief: handmatig triggeren vanuit `/admin/groei-systeem`

### Logic

1. Query DynamoDB: OpportunityStatements met `status = 'draft'`, gesorteerd op priority (high eerst)
2. Selecteer top 3 (cadans = 3 publicaties/week)
3. Per opportunity: genereer 2 content pieces via Claude Haiku
   - LinkedIn company post (200–400 woorden)
   - X thread (3–5 tweets, max 280 chars per tweet)
4. Sla beide ContentDrafts op in DynamoDB met `status: 'draft'`
5. Update OpportunityStatement `status → 'in-content'`

### Content templates (systeem-prompt context)

```
Schrijf een LinkedIn post voor het AIntern company account.
Toon: expert, geen sales pitch, concreet en herkenbaar.
Kies één van deze openingsformats:
- "Ik zag deze week [X] bedrijven worstelen met..."
- "Zo automatiseer je [proces] in 3 stappen"
- "Van handmatig → AI workflow: [specifiek voorbeeld]"

Geen CTA in de post zelf. Geen directe reclame voor AIntern.
Max 400 woorden. Sluit af met 3 relevante hashtags.

Opportunity:
Pain: {pain}
Persona: {persona}
Opportunity: {opportunity}

Retourneer ONLY valid JSON: { "content": "...", "hashtags": "..." }
```

---

## Approval Flow

```
ContentDraft (status: draft)
  → /admin/linkedin (Bill bekijkt)
  → Bill klikt "Goedkeuren" → status: approved
  → Bill triggert Zapier: linkedin_create_company_update
  → Bill vult publishedAt in → status: published
```

X drafts staan klaar in DynamoDB; publicatie wacht op X API configuratie (apart B-item).

---

## `/admin/linkedin` uitbreiding

Bestaande A-19 view toont Bill's persoonlijke posts. Voeg **"Company Page" tab** toe:
- Filtert op `CONTENT#` prefix (of `channel = 'linkedin_company'`)
- Zelfde approve/archive knoppen als persoonlijke posts
- Label "Company" zichtbaar in lijst

---

## Acceptance Criteria

- [ ] Lambda genereert 3 LinkedIn company post drafts per week
- [ ] Posts verschijnen in `/admin/linkedin` onder "Company Page" tab
- [ ] X thread draft aangemaakt naast elke LinkedIn post
- [ ] Geen pitch-tone in gegenereerde posts (prompt guard actief)
- [ ] OpportunityStatement `status` bijgewerkt naar `'in-content'`
- [ ] Bill kan post goedkeuren + publiceren via Zapier
- [ ] `publishedAt` handmatig in te vullen

## Out of Scope

- Automatisch publiceren (nooit)
- X API integratie (vereist apart B-item)
- Buffer scheduling integratie
- Engagement data automatisch ophalen
