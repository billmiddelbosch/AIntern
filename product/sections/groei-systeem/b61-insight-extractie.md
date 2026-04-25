# B-61 — Insight Extractie

**Backlog ID:** B-61  
**Owner:** CMO (operationeel), CTO (implementatie)  
**Effort:** S  
**Depends on:** B-36 (PainSignals in DynamoDB)  
**Triggers:** B-53 (Content Engine), B-51/B-52 (Cold Email)

---

## Purpose

Wekelijkse Lambda clustert nieuwe PainSignals tot Opportunity Statements — gestructureerde inzichten die als input dienen voor content, outreach en cold email. Volledig geautomatiseerd, geen review-stap.

---

## Opportunity Statement Format

```typescript
// src/types/opportunityStatement.ts

export type OpportunityPriority = 'high' | 'medium' | 'low'
export type OpportunityStatus = 'draft' | 'in-content' | 'in-outreach' | 'converted' | 'archived'

export interface OpportunityStatement {
  id: string
  painSignalIds: string[]   // bron-PainSignals (1–5)
  pain: string              // "MKB-bedrijven worstelen met [proces]"
  persona: string           // doelgroep
  rootCause: string         // waarom het probleem ontstaat
  opportunity: string       // "AIntern kan [aanpak] leveren om [resultaat]"
  priority: OpportunityPriority
  status: OpportunityStatus
  createdAt: string
  updatedAt: string
}
```

### Voorbeeld output

```json
{
  "pain": "Webshop-eigenaren verliezen dagelijks 2+ uur aan handmatige voorraadsynchronisatie",
  "persona": "DGA webshop, 5–25 FTE, geen IT-afdeling",
  "rootCause": "ERP, webshop en inkoop draaien los — geen koppeling zonder custom dev",
  "opportunity": "AIntern bouwt een geautomatiseerde sync-flow die 3 systemen koppelt in 2 weken, geen dev kennis vereist",
  "priority": "high"
}
```

**DynamoDB (`aintern-admin`):**

| pk | sk | GSI1pk | GSI1sk |
|---|---|---|---|
| `OPPORTUNITY#<id>` | `STATEMENT` | `PRIORITY#<priority>` | `<createdAt>` |

---

## Lambda: `lambda/src/insight-extractie.ts`

**Trigger:** EventBridge cron `0 7 ? * MON *` (maandag 09:00 Amsterdam / 07:00 UTC)

### Logic

1. Query DynamoDB: alle PainSignals met `GSI1pk = STATUS#new`
2. Als < 3 pains: log + stop (te weinig signaal voor clustering)
3. Claude Haiku clustert pains op thema (max 5 clusters per run)
4. Per cluster: genereer 1 OpportunityStatement met de 4 velden + priority
   - Priority bepaald door gemiddelde urgency van cluster-pains:
     - Alle `high` → `high`
     - Mix of alle `medium` → `medium`
     - Overige → `low`
5. Sla OpportunityStatements op in DynamoDB met `status: 'draft'`
6. Update elke verwerkte PainSignal: `status → 'processed'`, `opportunityId` ingevuld

### Claude Haiku clustering prompt

```
Je ontvangt een lijst Reddit-pains over MKB-processen.
Cluster ze in maximaal 5 thema-groepen en genereer per groep een Opportunity Statement.
Retourneer ONLY valid JSON zonder markdown:

[
  {
    "painSignalIds": ["id1", "id2"],
    "pain": "...",
    "persona": "...",
    "rootCause": "...",
    "opportunity": "...",
    "priority": "high|medium|low"
  }
]
```

---

## Acceptance Criteria

- [ ] Lambda draait wekelijks op maandag zonder fouten
- [ ] Alle `STATUS#new` PainSignals worden verwerkt
- [ ] Minimaal 1 OpportunityStatement gegenereerd als er ≥ 3 nieuwe pains zijn
- [ ] Alle 4 velden (pain/persona/rootCause/opportunity) aanwezig en niet leeg
- [ ] `painSignalIds` verwijst naar bestaande DynamoDB keys
- [ ] PainSignal status bijgewerkt naar `'processed'` na verwerking
- [ ] `opportunityId` gekoppeld op PainSignal

## Out of Scope

- Notion sync (DynamoDB is primary store, Notion eventueel als toekomstige extensie)
- Human review gate voor OpportunityStatements
- Admin UI voor Opportunity Statements (toekomstig — B-63 dashboard)
