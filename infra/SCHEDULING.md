# Lambda Scheduling — AInternLoop & NewsFlow

Alle EventBridge-triggers richten op de **`prod`-alias** van elke Lambda.
De IssueResolver draait op een rate; alle andere zijn dagelijkse cron-regels in UTC.

## Dagelijks tijdlijn (UTC)

```
00:00  ──────────────────────────────────────────────────────────
04:00  ► LearningAgent        (AInternLoopStack)
06:00  ► NewsAnalyzer          (NewsFlowStack)
08:00  ──────────────────────────────────────────────────────────
12:00  ► ContentBuilder        (NewsFlowStack)
18:00  ► SEOOptimizer          (NewsFlowStack)
──────   IssueResolver          elke 30 min, de hele dag door
```

---

## AInternLoop — `infra/lib/ainternloop-stack.ts`

### aintern-issueresolver

| Eigenschap     | Waarde                                           |
|----------------|--------------------------------------------------|
| Schedule       | `rate(30 minutes)` — de hele dag door            |
| EventBridge    | `aintern-issueresolver-schedule`                 |
| Timeout        | 300 s (5 min)                                    |
| Model          | Claude Haiku                                     |
| DynamoDB lees  | `aintern-loop` (volledig via `grantReadData`)    |
| DynamoDB schrijf | UpdateItem + PutItem op `ISSUE#*` en `ACTION#*` |

**Wat het doet:** Haalt alle open en geëscaleerde issues op uit `aintern-loop`. Roept Claude Haiku aan om per issue te bepalen of het oplosbaar is. Herstelt de geblokkeerde ACTION of escaleert naar human.

**Output:**
| Bestemming | Wat er weggeschreven wordt |
|---|---|
| `aintern-loop` DynamoDB — `ISSUE#<id>` / `META` | UpdateItem: status → `resolving` of `escalated`, `resolutionApproach`, `instructionToAgent`, `updatedAt`; conditional write (idempotent bij parallelle runs) |
| `aintern-loop` DynamoDB — `ACTION#<actionRef>` / `META` | UpdateItem: status → `open` (reactivatie van geblokkeerde action bij solvable=true) |
| `aintern-loop` DynamoDB — `ISSUE#<uuid>` / `META` | PutItem: nieuw meta-issue als de hele run crasht (actionRef=meta, agentName=IssueResolver) |
| CloudWatch Logs | Per run: `issues_processed`, `resolving`, `escalated`, `skipped`; per issue: issueId, result, agentName |

---

### aintern-learningagent

| Eigenschap     | Waarde                                           |
|----------------|--------------------------------------------------|
| Schedule       | Dagelijks `cron(0 4 * * ? *)` — 04:00 UTC       |
| EventBridge    | `aintern-learningagent-schedule`                 |
| Timeout        | 300 s (5 min)                                    |
| Model          | Claude Sonnet                                    |
| DynamoDB lees  | Query op GSI1 + GSI2 (geen GetItem/Scan)        |
| DynamoDB schrijf | PutItem + UpdateItem op `AGENT#*` (managed policy) |

**Wat het doet:** Leest opgeloste issues per agent (GSI2), analyseert patronen via Claude Sonnet, en update de `AGENT# CONFIG`-instructies als confidence hoog of medium is. Draait vóór NewsAnalyzer zodat verbeterde instructies dezelfde dag al gebruikt worden.

**Output:**
| Bestemming | Wat er weggeschreven wordt |
|---|---|
| `aintern-loop` DynamoDB — `AGENT#<name>` / `CONFIG` | UpdateItem (alleen bij high/medium confidence): `instruction`, `instructionVersion + 1`, `lastModifiedAt`, `lastModifiedBy=LearningAgent`, `versionHistory` (list_append). Conditional write op `instructionVersion` voorkomt dubbele schrijfoperaties. |
| CloudWatch Logs | Per agent: `agentName`, `issueCount`, `result` (updated/skipped\_*), `confidence`, `newVersion`; overall: `agents_processed`, `updated`, `skipped` |

---

### aintern-loop-seed-agents _(geen schedule)_

Eenmalige seed-handler, handmatig te invoeren na eerste deploy. Idempotent via conditional writes. Schrijft alleen `AGENT#`-items.

---

## NewsFlow — `infra/lib/newsflow-stack.ts`

### aintern-newsanalyzer

| Eigenschap     | Waarde                                           |
|----------------|--------------------------------------------------|
| Schedule       | Dagelijks `cron(0 6 * * ? *)` — 06:00 UTC       |
| EventBridge    | `aintern-newsanalyzer-schedule`                  |
| Timeout        | 300 s (~40 RSS-items × ~3 s Haiku)              |
| Model          | Claude Haiku                                     |
| DynamoDB lees  | `aintern-loop` (dedup query op GSI1 + `getAgentInstruction`) |
| DynamoDB schrijf | PutItem op `ACTION#*` in `aintern-loop`        |

**Wat het doet:** Leest RSS-feeds, stuurt elk artikel door Claude Haiku voor relevantie-analyse, en registreert `newsflow/content`-actions in `aintern-loop` voor de ContentBuilder.

**Output:**
| Bestemming | Wat er weggeschreven wordt |
|---|---|
| `aintern-loop` DynamoDB — `ACTION#<uuid>` / `META` | Nieuw action-item per MKB-relevant artikel: `type=newsflow/content`, urgency-score, topLezersvraag, lezersvragen, artikelUrl, rssSource |
| CloudWatch Logs | Structured JSON per feed: `items`, `recent`, `new_actions`, `duplicates`, `skipped_old`; run-summary met totaaltelling en errors |

---

### aintern-contentbuilder

| Eigenschap     | Waarde                                                    |
|----------------|-----------------------------------------------------------|
| Schedule       | Dagelijks `cron(0 12 * * ? *)` — 12:00 UTC               |
| EventBridge    | `aintern-contentbuilder-schedule`                         |
| Timeout        | 300 s (~30–60 s Sonnet + git clone + S3)                 |
| Model          | Claude Sonnet                                             |
| DynamoDB lees + schrijf | `aintern-loop` (claim/complete/logIssue) + `aintern-newsflow` (PutItem `LANDING_PAGE#*`) |
| S3             | PutObject op `posts/<slug>.json` + `index.json`          |

**Wat het doet:** Claimt de hoogst-urgente openstaande `newsflow/content` action uit `aintern-loop`, genereert een MKB-landingspagina via Claude Sonnet, schrijft de JSON naar S3 en slaat metadata op in `aintern-newsflow`.

**Output:**
| Bestemming | Wat er weggeschreven wordt |
|---|---|
| S3 `aintern-newsflow` → `posts/<slug>.json` | Volledige landingspagina-JSON: title, metaDescription, sections (intro/context/mkbRelevantie/ainternAngle/bronnen), faq, cta, schema |
| S3 `aintern-newsflow` → `index.json` | Index-array bijgewerkt: slug, title, lezersvraag, publishedAt, urgencyScore (nieuwste eerst) |
| GitHub PR → `public/newsflow-sitemap.xml` | Nieuw `<url>`-blok toegevoegd met `<loc>`, `<lastmod>`, `changefreq=weekly`, `priority=0.7` |
| GitHub PR → `public/newsflow-llms.txt` | Nieuw Markdown-regelitem toegevoegd: `- [title](url): lezersvraag` |
| `aintern-newsflow` DynamoDB — `LANDING_PAGE#<slug>` / `META` | Volledig nieuw item: url, urgencyScore, publishedAt, status=published, traffic (alles 0), optimizationCount=0, GSI1pk/GSI2pk voor queries |
| `aintern-loop` DynamoDB — `ACTION#<actionId>` | UpdateItem: status=done (via `completeAction`); bij fout: PutItem nieuw `ISSUE#<uuid>` / `META` |
| CloudWatch Logs | actionId, urgency, slug, url, prUrl, urgencyBucket per run |

---

### aintern-seooptimizer

| Eigenschap     | Waarde                                                         |
|----------------|----------------------------------------------------------------|
| Schedule       | Dagelijks `cron(0 18 * * ? *)` — 18:00 UTC                   |
| EventBridge    | `aintern-seooptimizer-schedule`                               |
| Timeout        | 300 s                                                          |
| Model          | Claude Sonnet                                                  |
| DynamoDB lees  | Query op GSI1 (`STATUS#published`, gesorteerd op `publishedAt`) |
| DynamoDB schrijf | UpdateItem op `LANDING_PAGE#*` in `aintern-newsflow`         |
| S3             | PutObject op `posts/<slug>.json` (geoptimaliseerde versie)    |
| Extra bron     | GA4 (via service-account SSM param) voor pageview-statistieken |

**Wat het doet:** Selecteert de langst-ongeoptimaliseerde gepubliceerde pagina (GSI1, oudste `publishedAt` eerst), haalt GA4-statistieken op, regenereert de content via Claude Sonnet, en overschrijft de S3-pagina + DynamoDB-record.

**Output:**
| Bestemming | Wat er weggeschreven wordt |
|---|---|
| S3 `aintern-newsflow` → `posts/<slug>.json` | Verbeterde versie van de volledige pagina-JSON (overschrijft bestaand bestand); `slug`, `publishedAt` en `lezersvraag` blijven ongewijzigd |
| `aintern-newsflow` DynamoDB — `LANDING_PAGE#<slug>` / `META` | UpdateItem: `traffic` (pageviews/bounceRate/avgSessionDuration), `lastOptimizedAt`, `optimizationCount + 1`, `optimizationLog` (lijst_append met agent/changes/trafficBefore) |
| GitHub PR → `public/newsflow-sitemap.xml` | `<lastmod>` datum geüpdatet voor de betreffende slug (alleen als datum wijzigt) |
| CloudWatch Logs | slug, optimizationCount, GA4-stats, changesSummary per run |

---

## Afhankelijkheden tussen stacks

```
AInternLoopStack
  └─ aintern-loop (DynamoDB)
       ├─ gelezen door: NewsAnalyzer, ContentBuilder
       └─ geschreven door: NewsAnalyzer (ACTION#*), ContentBuilder (UpdateItem/PutItem ISSUE#*)

NewsFlowStack
  ├─ aintern-newsflow (DynamoDB)  — geschreven door ContentBuilder, SEOOptimizer
  └─ aintern-newsflow (S3)        — geschreven door ContentBuilder, SEOOptimizer
```

`NewsFlowStack` importeert `aintern-loop` als `Table.fromTableAttributes` (geen eigenaar).
`AInternLoopStack` bezit de tabel en publiceert de naam via SSM (`/aintern/loop/table-name`).

---

## SSM-parameters per Lambda

| Lambda              | SSM-parameters                                                         |
|---------------------|------------------------------------------------------------------------|
| NewsAnalyzer        | `anthropic/api-key` (dev + prod)                                       |
| ContentBuilder      | `anthropic/api-key`, `amplify/build-webhook-url` (dev + prod)          |
| SEOOptimizer        | `anthropic/api-key`, `amplify/build-webhook-url`, `ga4/service-account-json`, `ga4/property-id` (dev + prod) |
| IssueResolver       | `anthropic/api-key` (dev + prod)                                       |
| LearningAgent       | `anthropic/api-key` (dev + prod)                                       |
