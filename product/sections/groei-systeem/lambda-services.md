# Groei Systeem — Lambda Services

_Bijgewerkt: 2026-05-01_

Het Groei Systeem is een volledig geautomatiseerde pipeline die MKB-pijnsignalen omzet in gepersonaliseerde outreach. De Lambdas vormen een lineaire keten: signalen → inzichten → content → leads → e-mail.

---

## Pipeline overzicht

```
[Reddit]
    ↓  dagelijks 08:00
signaaldetectie       → PainSignal items (DynamoDB)
    ↓  maandag 09:00
insight-extractie     → OpportunityStatement items (DynamoDB)
    ↓  woensdag 09:00
content-engine        → ContentDraft items (LinkedIn post, DynamoDB)
lead-matcher (B-88c)  → LinkedInConnectionMessage per lead (DynamoDB)
    ↓  dagelijks 08:00
soft-outreach-monitor → OutreachAlert items (DynamoDB)
sequence-scheduler    → E-mail sequentie via AWS SES (sanne@aintern.nl)
```

---

## Geplande Lambdas (EventBridge)

### 1. `aintern-signaaldetectie`
| | |
|---|---|
| **Schema** | Dagelijks — 06:00 UTC (08:00 Amsterdam) |
| **Bron** | B-36 |
| **Handler** | `signaaldetectie.handler` |
| **Timeout** | 60 sec |

**Wat het doet:**
Scrapet geconfigureerde subreddits via de Reddit API. Claude Haiku beoordeelt elk bericht op relevantie voor MKB-pijn (repetitief handmatig werk, automatisering, AI-frustratie). Relevante berichten worden opgeslagen als `PAIN_SIGNAL#` items in DynamoDB.

**Resultaat:** Verse PainSignal items met velden `title`, `body`, `subreddit`, `urgency`, `status: new`.

**Configuratie:** Subreddits worden beheerd via de `aintern-subreddit-config` Lambda (admin CRUD).

---

### 2. `aintern-insight-extractie`
| | |
|---|---|
| **Schema** | Wekelijks — maandag 07:00 UTC (09:00 Amsterdam) |
| **Bron** | B-61 |
| **Handler** | `insight-extractie.handler` |
| **Timeout** | 90 sec |

**Wat het doet:**
Leest nieuwe PainSignals (status: `new`) uit DynamoDB. Vereist minimaal 3 signalen. Claude Haiku clustert de signalen op onderliggend pijnpunt en bepaalt prioriteit (high/medium/low). Per cluster wordt een OpportunityStatement aangemaakt.

**Resultaat:** `OPPORTUNITY#` items met velden `summary`, `priority`, `painIds[]`, `status: draft`. Verwerkte PainSignals krijgen status `clustered`.

---

### 3. `aintern-content-engine`
| | |
|---|---|
| **Schema** | Wekelijks — woensdag 07:00 UTC (09:00 Amsterdam) |
| **Bron** | B-53 |
| **Handler** | `content-engine.handler` |
| **Timeout** | 90 sec |

**Wat het doet:**
Leest OpportunityStatements met status `draft`. Claude Haiku genereert per opportunity een LinkedIn company post (zakelijke toon, MKB-angle, CTA naar aintern.nl). X/Twitter generatie is geïmplementeerd maar **on hold** — Zapier heeft geen X-integratie meer (B-88b).

**Resultaat:** `CONTENT#` items met `channel: linkedin_company`, `body`, `status: draft`. GSI1pk: `CHANNEL#linkedin_company` voor snelle query per kanaal.

---

### 4. `aintern-lead-matcher` _(in ontwikkeling — B-88c)_
| | |
|---|---|
| **Schema** | Dagelijks — 05:00 UTC (07:00 Amsterdam) |
| **Bron** | B-88c |
| **Handler** | `lead-matcher.handler` |

**Wat het doet:**
Scant DynamoDB voor leads met `status: new` die nog geen e-mailadres hebben. Roept Apollo API aan met het domein van de lead (free tier: 50 lookups/maand). Als een e-mailadres gevonden wordt: schrijft het `email` veld terug naar de lead en zet `status: enriched`. Leads zonder vindbaar e-mailadres blijven `status: new` en worden gemarkeerd in de admin UI voor handmatige aanvulling.

Draait 1 uur vóór `sequence-scheduler` (06:00 UTC) zodat vers verrijkte leads diezelfde dag al in de e-mail sequentie terechtkomen.

**Resultaat:** Leads met `status: enriched` + `email` veld gevuld — direct klaar als input voor `sequence-scheduler`. Leads zonder e-mailadres zichtbaar als oranje indicator in `/admin/leads` voor handmatige aanvulling door COO.

---

### 5. `aintern-soft-outreach-monitor`
| | |
|---|---|
| **Schema** | Dagelijks — 07:00 UTC (09:00 Amsterdam) |
| **Bron** | B-62 |
| **Handler** | `soft-outreach-monitor.handler` |
| **Timeout** | 60 sec |

**Wat het doet:**
Monitort nieuwe PainSignals op intentiesignalen (vraag, klacht, oplossing zoeken). Claude Haiku classificeert het intent-type en stelt een reactie voor. Signalen met hoge koopintentie leiden tot een OutreachAlert zodat de COO/CEO tijdig handmatig kan reageren.

**Resultaat:** `OUTREACH#` items met velden `intent`, `suggestedResponse`, `sourceUrl`, `status: alert`.

---

### 6. `aintern-sequence-scheduler`
| | |
|---|---|
| **Schema** | Dagelijks — 06:00 UTC (08:00 Amsterdam) |
| **Bron** | B-52, B-88d, B-88e |
| **Handler** | `sequence-scheduler.handler` |
| **Timeout** | 30 sec |

**Wat het doet (3 stappen per run):**

**Stap 1 — Sequentie aanmaken:** Scant DynamoDB voor leads met `status: enriched` én een e-mailadres. Claude Haiku schrijft namens Sanne (CMO van AIntern) een gepersonaliseerde koude e-mail. Roteert 3 CTA-varianten per 10 leads: A = Workflow Scan, B = Discovery call, C = Kennisbank. Slaat `SEQUENCE#` item op (status: `scheduled`, sendAt: volgende werkdag 09:00 CET).

**Stap 2 — Verzenden:** Verstuurt e-mails waarvan `sendAt ≤ now` via **AWS SES** vanaf `Sanne van AIntern <sanne@aintern.nl>`. Antwoorden van prospects landen via ImprovMX forwarding in Bills Gmail. Slaat gebruikte CTA-variant op per sequentie-item voor A/B-meting.

**Stap 3 — Stap-voortgang:** Zet actieve LinkedIn-sequentiestappen door op basis van geplande intervals (dag 0 / 5 / 12 / 19). Markeert sequenties als `completed` na stap 4.

**Resultaat:** Prospects ontvangen automatisch een gepersonaliseerde e-mail vanuit Sannes naam. Variant-tracking in DynamoDB voor latere A/B-analyse.

---

## On-demand Lambdas (geen schedule)

### 7. `aintern-workflow-scan`
| | |
|---|---|
| **Trigger** | Publiek API: `POST /workflow-scan` |
| **Bron** | B-54 |
| **Handler** | `workflow-scan.handler` |

**Wat het doet:** Ontvangt inzendingen van het workflow-scan formulier op aintern.nl. Claude Haiku genereert directe AI-aanbevelingen op basis van het ingevoerde bedrijfsproces. Slaat de inzending op als WorkflowScan item in DynamoDB.

**Resultaat:** Bezoeker ontvangt direct gepersonaliseerd advies. Lead wordt opgeslagen voor follow-up.

---

### 8. `aintern-flywheel-metrics`
| | |
|---|---|
| **Trigger** | Admin API: `GET/PUT /admin/flywheel-metrics` |
| **Bron** | B-63 |
| **Handler** | `flywheel-metrics.handler` |

**Wat het doet:** Leest en schrijft wekelijkse funnelmetrics (leads, demo's, pilots, klanten). Gebruikt in het `/admin` dashboard voor flywheel-visualisatie en voortgang richting Q2 OKRs.

**Resultaat:** Actuele funnel data per week beschikbaar in admin dashboard.

---

### 9. `aintern-subreddit-config`
| | |
|---|---|
| **Trigger** | Admin API: CRUD `/admin/subreddit-config` |
| **Bron** | B-36 |
| **Handler** | `subreddit-config.handler` |

**Wat het doet:** Beheert de lijst van subreddits die `signaaldetectie` dagelijks scrapet. Maakt toevoegen, wijzigen en verwijderen van SubredditConfig items mogelijk zonder CDK-deployment.

**Resultaat:** Beheerder kan de scrape-scope aanpassen via de admin interface.

---

## Weekschema

| Dag | Tijd (AMS) | Lambda |
|-----|-----------|--------|
| Ma t/m zo | 08:00 | `signaaldetectie` |
| Ma t/m zo | 08:00 | `sequence-scheduler` |
| Ma t/m zo | 09:00 | `soft-outreach-monitor` |
| Maandag | 09:00 | `insight-extractie` |
| Woensdag | 09:00 | `content-engine` |
| Ma t/m zo | 07:00 | `lead-matcher` (B-88c) |

---

## DynamoDB item-types per Lambda

| Lambda | Schrijft | Leest |
|--------|----------|-------|
| signaaldetectie | `PAIN_SIGNAL#` | SubredditConfig items |
| insight-extractie | `OPPORTUNITY#` | `PAIN_SIGNAL#` (status: new) |
| content-engine | `CONTENT#` | `OPPORTUNITY#` (status: draft) |
| lead-matcher | lead.email + status: enriched | Leads (status: new, geen email) via Apollo API |
| soft-outreach-monitor | `OUTREACH#` | `PAIN_SIGNAL#` (nieuwe) |
| sequence-scheduler | `SEQUENCE#` | Leads (status: enriched + email) |
| workflow-scan | WorkflowScan | — |
| flywheel-metrics | FlywheelMetric | FlywheelMetric |
| subreddit-config | SubredditConfig | SubredditConfig |
