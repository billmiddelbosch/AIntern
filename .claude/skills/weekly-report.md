---
name: weekly-report
description: |
  Generates the AIntern weekly internal report (O-01) for the CEO.
  Trigger when user says: genereer weekrapport, weekly report aanmaken,
  maak rapport voor week [N], or run O-01. Uses DynamoDB as primary data
  source for all KPI actuals. Falls back to CSV/backlog where DynamoDB
  has no data. Writes to Obsidian vault and outputs a Ghostwriter input
  block for the AI-Duo Experiment LinkedIn post.
---

# Skill: weekly-report (O-01 v2 — DynamoDB primary)

## Doel
Genereer een wekelijks intern Markdown-rapport voor de CEO op basis van
DynamoDB-actuals, S3 Kennisbank, outreach-log CSV en backlog.md.
Geen handmatige invoer nodig — alleen het ISO-weeknummer is vereist
(default = huidige ISO-week).

## Gebruik
Run via slash command: /weekly-report
Met week argument: /weekly-report W17 of /weekly-report 2026-W17

---

## Uitvoer-pad (altijd)
`C:/Users/bmidd/OneDrive/Documents/Obsidian Vault/Bill/Aintern Meeting Minutes/weekrapport-{YYYY-WNN}.md`

Bestandsnaam-formaat: `weekrapport-2026-W17.md` (ISO jaar + weeknummer).

---

## DynamoDB configuratie
- **Tabel:** `aintern-admin`
- **Regio:** `eu-west-2`
- **Key schema:**

| pk prefix | sk | Inhoud |
|---|---|---|
| `METRIC#{isoWeek}` | `{metricId}` | KPI actueel-waarde (Number) |
| `LEAD#{website}` | `METADATA` | Lead record met status, datums, DM-tekst |
| `LINKEDIN#{id}` | `POST` | LinkedIn post draft/published |

### MetricId-mapping (geschreven door kpi-integrations Lambda)

| metricId | Bron | Beschrijving |
|---|---|---|
| `cmo.2` | outreach CSV (S3) | Connecties verstuurd **deze week** |
| `kr2.2` | outreach CSV (S3) | Q2 connecties totaal |
| `cpo.1` | S3 kennisbank posts/ | Kennisbank artikelen gepubliceerd **deze week** |
| `kr3.4` | S3 kennisbank posts/ | Q2 kennisbank artikelen totaal |
| `kr3.1` | Google Analytics 4 | Maandelijkse unieke bezoekers (last 30 days) |
| `cpo.4` | GA4 | Traffic-check uitgevoerd (0 of 1) |
| `cpo.2` | backlog.md (S3) | Backlog items shipped **deze week** |

Overige metrics kunnen handmatig zijn ingevoerd via PUT /admin/kpi/actuals.

---

## Stap 0 — ISO-week bepalen

Bereken de doelweek als `{YYYY-WNN}` (bijv. `2026-W17`). Leid ook het weekbereik af:
- Maandag = weekstart (bijv. `2026-04-20`)
- Zondag = weekeinde (bijv. `2026-04-26`)

Gebruik deze datumgrenzen in alle volgende stappen als filtercriterium.

---

## Stap 1 — KPI Actuals ophalen (DynamoDB)

Dit is de **meest gezaghebbende bron** — voer altijd eerst uit.

```bash
aws dynamodb query \
  --table-name aintern-admin \
  --region eu-west-2 \
  --key-condition-expression "pk = :pk" \
  --expression-attribute-values "{\":pk\":{\"S\":\"METRIC#{isoWeek}\"}}" \
  --query "Items[*].{metricId:sk.S,value:value.N,source:source.S,updatedAt:updatedAt.S}" \
  --output json
```

Vervang `{isoWeek}` door de doelweek (bijv. `2026-W17`).

Sla de output op als interne variabele `DDB_METRICS`. Gebruik de waarden direct in Stap 5 (KPI-tabel). Als een metricId ontbreekt in de output, wordt die waarde in de betreffende stap afgeleid uit alternatieve bronnen.

**Verwachte metricIds in de output:**
`cmo.2`, `kr2.2`, `cpo.1`, `kr3.4`, `kr3.1`, `cpo.4`, `cpo.2` + eventuele handmatige entries.

---

## Stap 2 — Lead Pipeline (DynamoDB primair, CSV secundair)

### 2a. Leads uit DynamoDB (primaire bron)

```bash
aws dynamodb scan \
  --table-name aintern-admin \
  --region eu-west-2 \
  --filter-expression "begins_with(pk, :p) AND sk = :sk" \
  --expression-attribute-values '{":p":{"S":"LEAD#"},":sk":{"S":"METADATA"}}' \
  --query "Items[*].{website:pk.S,status:status.S,name:linkedin_name.S,connectionSentAt:connection_sent_at.S,dmSentAt:dm_sent_at.S,dmResponse:dm_response.S}" \
  --output json
```

Tel per status (`not_contacted`, `connection_sent`, `dm_sent`, `responded`, `excluded`, `not_found`, `needs_enrichment`).

**Delta deze week:** filter op `connectionSentAt` of `dmSentAt` binnen weekbereik (maandag t/m zondag).

**Conversieratio:** `responded` / `dm_sent` × 100 (op basis van cumulatief totaal).

### 2b. CSV verificatie (secundaire bron)

Lees `product/marketing/leads/outreach-log.csv` — vergelijk statustelling met DynamoDB. Meld discrepantie als > 0 verschil.

**DynamoDB-waarde gebruiken als ze beschikbaar is; CSV alleen als DynamoDB geen data heeft.**

Alert als geen nieuwe outreach deze week (`cmo.2 = 0`) en er leads zijn met status `not_contacted` of `connection_sent`.

---

## Stap 3 — Backlog Status (product/backlog.md)

Lees `product/backlog.md`.

- **Shipped deze week:** B-items met `✅ done` of `~~` (strikethrough) en een datum in het weekbereik
- **In progress:** items met expliciete `in-progress` indicator
- Tel totalen: done (strikethrough), todo/open, gecancelled
- Highlight geblokkeerde of geescaleerde items

Cross-refereer met `cpo.2` uit DynamoDB (Stap 1). Als `cpo.2` afwijkt van het getelde aantal shipped items, noteer de discrepantie.

---

## Stap 4 — Blockers (memory + backlog)

- Scan `C:/Users/bmidd/.claude/projects/C--Users-bmidd-AIntern/memory/*.md` op: `blocker`, `blocked`, `risico`, `escalatie`, `uitgeput`
- Scan `product/backlog.md` op: `geblokkeerd`, `Prio 1` open bugs
- Per gevonden blocker: 1 samenvattende zin + bronbestand

---

## Stap 5 — Kennisbank (DynamoDB primair, backlog secundair)

### 5a. DynamoDB (primaire bron)

Gebruik `cpo.1` (week) en `kr3.4` (Q2 totaal) uit `DDB_METRICS` (Stap 1).

Als deze metricIds aanwezig zijn: gebruik direct. Als ze ontbreken: ga naar 5b.

### 5b. Backlog fallback

Tel B-items in `product/backlog.md` met Kennisbank-publicatie en datum in Q2 (≥ 2026-04-01).

Alert als artikelen/week < 2 (CPO KPI target = 2/week).

---

## Stap 6 — LinkedIn Activiteit (DynamoDB primair, backlog secundair)

### 6a. Gepubliceerde posts uit DynamoDB

```bash
aws dynamodb scan \
  --table-name aintern-admin \
  --region eu-west-2 \
  --filter-expression "begins_with(pk, :p) AND sk = :sk" \
  --expression-attribute-values '{":p":{"S":"LINKEDIN#"},":sk":{"S":"POST"}}' \
  --query "Items[*].{id:pk.S,status:status.S,publishedAt:publishedAt.S,title:title.S,postFor:post_voor.S}" \
  --output json
```

Filter op `status = published` en `publishedAt` binnen weekbereik → wekelijkse count.
Q2-totaal = alle `status = published` met `publishedAt >= 2026-04-01`.

### 6b. Connecties

Gebruik `cmo.2` (week) en `kr2.2` (Q2) uit `DDB_METRICS`.

### 6c. Backlog fallback

Als DynamoDB LinkedIn-scan leeg is: tel B-items met LinkedIn post done en datum in weekbereik.

Alert als posts < 3 deze week (OKR 2.1 — geen gat > 3 dagen).

---

## Stap 7 — KPI-tabel opstellen

Bouw de volledige KPI-tabel per C-level op basis van `DDB_METRICS` + aangevulde waarden uit Stap 2–6.

### OKR targets (uit `C:/Users/bmidd/.claude/projects/C--Users-bmidd-AIntern/memory/project_okrs_q2_2026.md`)

| metricId | KPI | Target/week | OKR ref |
|---|---|---|---|
| `cmo.2` | Connecties verstuurd | 20–25 | KR 2.2 |
| `kr2.2` | Q2 connecties totaal | 300 einde Q2 | KR 2.2 |
| `cpo.1` | Kennisbank artikelen gepubliceerd | 2 | KR 3.4 |
| `kr3.4` | Q2 Kennisbank totaal | 20 einde Q2 | KR 3.4 |
| `kr3.1` | Maandelijkse unieke bezoekers | 500/maand | KR 3.1 |
| `cpo.2` | Backlog items shipped | ≥ 1 | intern |
| LinkedIn posts | Posts gepubliceerd | 3 | KR 2.1 |
| Discovery calls | Calls gevoerd/gepland | ≥ 0,5 | KR 1.2 |
| Security check | Check uitgevoerd | 1× | CTO KPI |

Status per KPI: `✅ ON TRACK` / `⚠️ ACHTER` / `❌ GEMIST`

---

## Stap 8 — OKR Voortgang Q2

Schrijf Q2 OKR-tabel met percentage t.o.v. einddoel op basis van Stap 7.

---

## Stap 9 — Rapport schrijven

Schrijf het rapport naar het Obsidian vault pad (zie boven). Gebruik het W17-rapport als stijlreferentie.

Bevestig met: `Weekrapport {YYYY-WNN} geschreven naar [volledig pad]`

---

## Stap 10 — Ghostwriter Input Block (altijd uitvoeren)

Na het schrijven van het rapport, genereer een **Ghostwriter Input Block** — een compacte feitenbasis voor de AI-Duo Experiment LinkedIn post van deze week.

Het blok bevat uitsluitend verifieerbare cijfers en feiten uit het rapport. Geen interpretaties, geen commerciële toon. De ghostwriter gebruikt dit als grondstof.

### Format

```markdown
## Ghostwriter Input — Week {YYYY-WNN}

**Periode:** {maandag datum} – {zondag datum}

**Wat we hebben gebouwd (backlog shipped):**
- [Elke shipped B-item als 1 bullet: korte beschrijving + eigenaar]

**Leads & outreach:**
- Connecties verstuurd: {cmo.2} (Q2 totaal: {kr2.2})
- DMs verstuurd: {delta dm_sent}
- Reacties ontvangen: {responded count}
- Conversieratio: {ratio}%

**Content gepubliceerd:**
- Kennisbank artikelen: {cpo.1} (Q2 totaal: {kr3.4})
  - [{Titel artikel 1}]
  - [{Titel artikel 2}]
- LinkedIn posts gepubliceerd: {count} (Q2 totaal: {q2 count})

**KPI highlights:**
- Sterkste KPI: [{metricId} — waarde vs. target]
- Grootste achterstand: [{metricId} — waarde vs. target, % gap]

**Opvallende momenten / beslissingen:**
- [1–3 niet-triviale dingen die deze week zijn besloten of ontdekt — uit blockers, backlog, of board memory]
```

Dit blok wordt na het rapport uitgeprint in de console (niet opgeslagen als apart bestand).

---

## Beperkingen v2
- LinkedIn post count combineert DynamoDB + backlog; geen directe LinkedIn API
- GA4 data beschikbaar als `kr3.1` / `cpo.4` in DynamoDB — alleen als kpi-integrations Lambda is gerund voor de betreffende week
- Discovery call count (`kr1.2`) is handmatig — niet geautomatiseerd
- Als DynamoDB leeg is (Lambda nooit gerund): volledige fallback op CSV + backlog (gedrag v1)
