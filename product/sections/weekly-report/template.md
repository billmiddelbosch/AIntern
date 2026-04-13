# AIntern Weekrapport — W{{WEEK_NUMBER}} ({{DATE_RANGE}})

> Gegenereerd op: {{GENERATED_AT}}
> ISO week: {{ISO_WEEK}}
> Volgende standup: {{NEXT_STANDUP_DATE}} 09:00

---

## 1. Lead Pipeline

| Status | Deze week | Totaal |
|---|---|---|
| Verbinding verstuurd | {{CONNECTIONS_SENT_THIS_WEEK}} | {{CONNECTIONS_SENT_TOTAL}} |
| DM verstuurd | {{DMS_SENT_THIS_WEEK}} | {{DMS_SENT_TOTAL}} |
| Reactie ontvangen | {{RESPONSES_THIS_WEEK}} | {{RESPONSES_TOTAL}} |
| Geconverteerd | {{CONVERTED_THIS_WEEK}} | {{CONVERTED_TOTAL}} |
| In afwachting verbinding | — | {{PENDING_CONNECTION_TOTAL}} |

**Conversieratio (DM → reactie):** {{DM_RESPONSE_RATE}}%

{{#if PIPELINE_ALERT}}
> ⚠️ **Alert:** {{PIPELINE_ALERT_MESSAGE}}
{{/if}}

---

## 2. KPI Voortgang — Week {{WEEK_NUMBER}}

### CEO
| KPI | Target | Actueel | Status |
|---|---|---|---|
| Outreach naar prospects | ≥ 1 | {{KPI_CEO_OUTREACH}} | {{KPI_CEO_OUTREACH_STATUS}} |
| Discovery call gevoerd/ingepland | ≥ 0,5 | {{KPI_CEO_DISCOVERY}} | {{KPI_CEO_DISCOVERY_STATUS}} |
| Pipeline review | 1× | {{KPI_CEO_PIPELINE_REVIEW}} | {{KPI_CEO_PIPELINE_REVIEW_STATUS}} |
| OKR-voortgang gereviewd | 1× | {{KPI_CEO_OKR_REVIEW}} | {{KPI_CEO_OKR_REVIEW_STATUS}} |

### CMO
| KPI | Target | Actueel | Status |
|---|---|---|---|
| LinkedIn posts gepubliceerd | 3 | {{KPI_CMO_POSTS}} | {{KPI_CMO_POSTS_STATUS}} |
| Nieuwe connecties verstuurd | 20–25 | {{KPI_CMO_CONNECTIONS}} | {{KPI_CMO_CONNECTIONS_STATUS}} |
| Inbound leads gegenereerd | ≥ 1 | {{KPI_CMO_INBOUND_LEADS}} | {{KPI_CMO_INBOUND_LEADS_STATUS}} |

### CPO
| KPI | Target | Actueel | Status |
|---|---|---|---|
| Kennisbank artikelen gepubliceerd | 2 | {{KPI_CPO_ARTICLES}} | {{KPI_CPO_ARTICLES_STATUS}} |
| Backlog item shipped/in progress | ≥ 1 | {{KPI_CPO_BACKLOG}} | {{KPI_CPO_BACKLOG_STATUS}} |

### CTO
| KPI | Target | Actueel | Status |
|---|---|---|---|
| Security check uitgevoerd | 1× | {{KPI_CTO_SECURITY}} | {{KPI_CTO_SECURITY_STATUS}} |

### COO
| KPI | Target | Actueel | Status |
|---|---|---|---|
| Weekrapport gegenereerd | 1× | ✅ | ✅ |
| Lead pipeline bijgewerkt | 2× | {{KPI_COO_PIPELINE_UPDATES}} | {{KPI_COO_PIPELINE_UPDATES_STATUS}} |

**Legenda:** ✅ On track · ⚠️ Achter · ❌ Gemist

---

## 3. Backlog Status

### Deze week opgeleverd
{{#each BACKLOG_SHIPPED_THIS_WEEK}}
- **{{ID}}** {{TITLE}} *({{OWNER}})*
{{/each}}
{{#if NO_BACKLOG_SHIPPED}}
- *Geen items deze week opgeleverd*
{{/if}}

### In progress
{{#each BACKLOG_IN_PROGRESS}}
- **{{ID}}** {{TITLE}} *({{OWNER}})*
{{/each}}

### Backlog overzicht (alle statussen)
| Status | Aantal |
|---|---|
| Done | {{BACKLOG_COUNT_DONE}} |
| In progress | {{BACKLOG_COUNT_IN_PROGRESS}} |
| Todo | {{BACKLOG_COUNT_TODO}} |
| **Totaal** | **{{BACKLOG_COUNT_TOTAL}}** |

---

## 4. Open Blockers

{{#each OPEN_BLOCKERS}}
### Blocker {{@index+1}} — {{SOURCE_FILE}}
{{SUMMARY}}

*Gevonden in:* `{{SOURCE_FILE}}`

---
{{/each}}
{{#if NO_OPEN_BLOCKERS}}
*Geen open blockers geïdentificeerd in agent memory.*
{{/if}}

---

## 5. Kennisbank

| Metric | Deze week | Q2 totaal | Q2 target |
|---|---|---|---|
| Artikelen gepubliceerd | {{KENNISBANK_ARTICLES_THIS_WEEK}} | {{KENNISBANK_ARTICLES_QTD}} | 20 |

{{#if KENNISBANK_ALERT}}
> ⚠️ **Alert:** Kennisbank loopt achter op Q2-target. Huidig tempo: {{KENNISBANK_PROJECTED_EOQ}} artikelen verwacht einde Q2.
{{/if}}

**Meest recente artikelen:**
{{#each KENNISBANK_RECENT_ARTICLES}}
- {{TITLE}} *(gepubliceerd {{DATE}})*
{{/each}}

---

## 6. LinkedIn Activiteit

| Metric | Deze week | Q2 totaal | Q2 target |
|---|---|---|---|
| Posts gepubliceerd | {{LINKEDIN_POSTS_THIS_WEEK}} | {{LINKEDIN_POSTS_QTD}} | 3×/week (continu) |
| Nieuwe connecties | {{LINKEDIN_CONNECTIONS_THIS_WEEK}} | {{LINKEDIN_CONNECTIONS_QTD}} | 300 |
| Inbound leads | {{LINKEDIN_LEADS_THIS_WEEK}} | {{LINKEDIN_LEADS_QTD}} | 10 |

{{#if LINKEDIN_POST_GAP_ALERT}}
> ⚠️ **Alert:** Gat > 3 dagen gevonden in LinkedIn post-cadans — OKR 2.1 in gevaar.
{{/if}}

---

## 7. OKR Voortgang Q2

| Objective | KR | Target | Actueel | % |
|---|---|---|---|---|
| O1 — Klanten | KR 1.1 Ondertekende contracten | 2 | {{OKR_KR11}} | {{OKR_KR11_PCT}}% |
| O1 — Klanten | KR 1.2 Discovery calls | 6 | {{OKR_KR12}} | {{OKR_KR12_PCT}}% |
| O2 — LinkedIn | KR 2.2 Nieuwe connecties | 300 | {{OKR_KR22}} | {{OKR_KR22_PCT}}% |
| O2 — LinkedIn | KR 2.3 Inbound leads | 10 | {{OKR_KR23}} | {{OKR_KR23_PCT}}% |
| O3 — Website | KR 3.4 Kennisbank artikelen | 20 | {{OKR_KR34}} | {{OKR_KR34_PCT}}% |

---

## 8. Actiepunten voor deze week

> *Dit gedeelte wordt handmatig aangevuld door de CEO tijdens de standup.*

| # | Actie | Eigenaar | Deadline |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

*Rapport gegenereerd door AIntern COO-agent · O-01 Weekly Auto-Report*
*Data bronnen: outreach-log.csv · product/backlog.md · A-14 KPI API · agent memory · S3 Kennisbank*
