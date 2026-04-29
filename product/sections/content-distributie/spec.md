# Content Distributie — Specificatie

**Backlog ID:** B-88 (nieuw)  
**Owner:** CTO (Morgan) — implementatie; CMO (Blake) — primaire gebruiker  
**Vision:** `product/sections/content-distributie/vision.md`  
**Depends on:** B-36, B-61, B-53 (allemaal live)

---

## Overzicht

| ID | Naam | Type | Effort |
|---|---|---|---|
| B-88a | CMO-agent context: Groei Systeem assets injecteren | Agent prompt update | XS |
| B-88b | X/Twitter autonoom publiceren via Zapier | Lambda uitbreiding | S |
| B-88c | LinkedIn connection message vanuit opportunity | Lambda + Vue uitbreiding | M |
| B-88d | Autonome e-mail sequentie met CTA-experiment | Lambda uitbreiding | L |

---

## B-88a — CMO-agent context: Groei Systeem assets

### Wat er verandert

De CMO-agent (`.claude/agents/cmo.md`) en de daily board meeting skill krijgen automatisch de meest recente Groei Systeem assets meegeleverd als aanvullende context. Dit geldt zowel voor LinkedIn company post-generatie als voor kennisbank-artikelen.

Geen nieuwe Lambda. Geen nieuwe Vue-component. Alleen de agent-prompt uitbreiden.

### Implementatie

**Stap 1 — DynamoDB lookup toevoegen aan board meeting flow**

In de daily board meeting bash-pipeline (of in het agent-script dat de CMO-agent aanroept), een lookup toevoegen die de meest recente assets ophaalt:

```bash
# Ophalen top-3 opportunities van deze week
aws dynamodb query \
  --table-name aintern-admin \
  --index-name GSI1 \
  --key-condition-expression "GSI1pk = :pk" \
  --expression-attribute-values '{":pk": {"S": "PRIORITY#high"}}' \
  --scan-index-forward false \
  --limit 3 \
  --query 'Items[*].{pain: pain.S, persona: persona.S, opportunity: opportunity.S}'
```

```bash
# Ophalen meest recente LinkedIn content drafts
aws dynamodb query \
  --table-name aintern-admin \
  --index-name GSI1 \
  --key-condition-expression "GSI1pk = :pk" \
  --filter-expression "#s = :draft" \
  --expression-attribute-names '{"#s": "status"}' \
  --expression-attribute-values '{":pk": {"S": "CHANNEL#linkedin_company"}, ":draft": {"S": "draft"}}' \
  --limit 3
```

**Stap 2 — CMO-agent prompt uitbreiden**

Voeg toe aan `.claude/agents/cmo.md` onder de inspiratiebronnen sectie:

```markdown
## Inspiratiebronnen (in volgorde van prioriteit)

1. Obsidian vault (primaire bron — Bill's eigen observaties)
2. Groei Systeem assets (wekelijks automatisch beschikbaar):
   - Top-3 opportunities van deze week: pain, persona, opportunity statement
   - Gegenereerde LinkedIn post-drafts per opportunity
   - Gebruik deze als kapstok voor posts en kennisbank-artikelen
   - De agent beslist zelf of en hoe hij de assets verwerkt
3. Board meeting context (OKRs, actieve backlog items)
```

**Stap 3 — Kennisbank-specifieke instructie**

Bij kennisbank-generatie: als er een opportunity beschikbaar is waarvan de `pain` aansluit op het te schrijven artikel, gebruik dan de `rootCause` en `opportunity` velden als structuur voor het artikel.

### Acceptatiecriteria B-88a

- [ ] `.claude/agents/cmo.md` bevat instructie om Groei Systeem assets te gebruiken als inspiratiebron
- [ ] Daily board meeting script haalt top-3 opportunities + LinkedIn drafts op uit DynamoDB en injecteert deze in de CMO-agent context
- [ ] CMO-agent verwijst aantoonbaar naar opportunity-data in gegenereerde posts (test in één board meeting run)
- [ ] Geen wijzigingen aan Lambda's of Vue-componenten

---

## B-88b — X/Twitter autonoom publiceren via Zapier

### Huidige situatie

`content-engine.ts` schrijft `CONTENT#<id>` items met `GSI1pk: CHANNEL#x` en `status: draft`. Niets publiceert deze.

### Implementatie

**Uitbreiding in `content-engine.ts`** — direct na het aanmaken van het `CONTENT#x` item in DynamoDB:

```typescript
// Na PutCommand voor X item:
const xWebhookUrl = await getZapierXWebhook(alias)  // SSM: /aintern/{alias}/zapier/x-webhook-url
if (xWebhookUrl) {
  try {
    await fetch(xWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: xContent }),
    })
    // Update status naar published
    await ddb.send(new UpdateCommand({
      TableName: tableName,
      Key: { pk: `CONTENT#${xId}`, sk: 'DRAFT' },
      UpdateExpression: 'SET #status = :s, publishedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':s': 'published', ':now': now },
    }))
    console.log('[content-engine] x post published | id=%s', xId)
  } catch (err) {
    console.error('[content-engine] x publish failed | id=%s', xId, err)
    // Item blijft als draft — flywheel-metrics telt het niet als gepubliceerd
  }
}
```

**SSM parameter:** `/aintern/{alias}/zapier/x-webhook-url`  
**Zapier setup (eenmalige handmatige stap):** Maak een Zapier Zap aan: "Catch Hook" → "Post Tweet" op het AIntern X-account. Kopieer de webhook URL naar SSM.

**Format:** De `content` string van het X-thread item wordt als één bericht gepost. Als het >280 tekens is, truncate naar 277 + "..." (de content-engine prompt genereert al een genummerde thread — dit kan later worden uitgebreid naar thread-posting via meerdere Zapier steps).

### DynamoDB wijzigingen

`CONTENT#x` item: `publishedAt` attribuut toevoegen bij succesvolle publicatie. `publishError` bij fout.

### Pre-condition

- [ ] Zapier account is gekoppeld aan AIntern X-account (handmatige setup door Bill)
- [ ] Zapier webhook URL is opgeslagen in SSM als `/aintern/prod/zapier/x-webhook-url` en `/aintern/dev/zapier/x-webhook-url`

### Acceptatiecriteria B-88b

- [ ] Na `content-engine` run: X-thread items hebben `status: published` en `publishedAt` gevuld
- [ ] Bij Zapier-fout: item blijft `status: draft`, `publishError` gevuld, Lambda logt de fout maar crasht niet
- [ ] `npm run build` pass na wijzigingen in `content-engine.ts`

---

## B-88c — LinkedIn connection message vanuit opportunity

### Concept

Wanneer een `OPPORTUNITY#` item wordt aangemaakt met `priority: high`, worden leads met `status: new` of `status: enriched` gematcht. Per match genereert Haiku een gepersonaliseerd connection message (<200 tekens) op basis van de `pain` van de opportunity en de `companyName` van de lead.

De COO ziet het gegenereerde bericht in de `/admin/leads` detail modal en verstuurt het zelf.

### Nieuwe Lambda: `lead-matcher.ts`

**Trigger:** EventBridge, woensdag 10:00 UTC (één uur na content-engine)

```typescript
// Logica:
// 1. Query OPPORTUNITY# items: priority=high, status=in-content, geen leadMatchedAt attribuut
// 2. Query LEAD# items: status IN (new, enriched)
// 3. Per opportunity: match op max 5 leads (basis: alle unmatched leads in volgorde van createdAt)
// 4. Genereer per match via Haiku: connectionMessage (<200 tekens)
// 5. Schrijf SEQUENCE# entry:
//    pk: SEQUENCE#<id>, sk: ENTRY
//    leadId, opportunityId, connectionMessage, status: pending_approval
//    nextSendAt: volgende werkdag 09:00
// 6. Update opportunity: leadMatchedAt = now
```

**Haiku prompt voor connection message:**

```
Schrijf een LinkedIn connection request bericht van max 190 tekens.
Toon: concreet en herkenbaar, geen sales pitch.
Basis: gebruik het Lightspeed-template als toon-referentie.

Pain: {opp.pain}
Bedrijf: {lead.companyName ?? lead.website}

Retourneer ONLY valid JSON: { "message": "..." }
```

### Vue uitbreiding: `/admin/leads` detail modal

Voeg een "Outreach" tab toe aan de bestaande `LeadDetailModal.vue`:

- Toont het gegenereerde connection message als het een `SEQUENCE#` entry bestaat met `status: pending_approval`
- Knop "Markeer als verstuurd" → `status: connection_sent`, lead-status → `connection_sent`
- Lead-kaart in het board krijgt een badge "Outreach klaar" zolang `status: pending_approval`

### DynamoDB wijzigingen

| Item | Wijziging |
|---|---|
| `OPPORTUNITY#` | Nieuw attribuut: `leadMatchedAt` (ISO 8601) — voorkomt dubbele matching |
| `SEQUENCE#` | Nieuw attribuut: `opportunityId`, `connectionMessage`; status uitgebreid met `pending_approval` |
| `LEAD#` | Badge-indicator: frontend leest pending sequence via extra API call |

### Acceptatiecriteria B-88c

- [ ] `lead-matcher` Lambda draait wekelijks op woensdag 10:00 UTC
- [ ] Per high-priority opportunity: max 5 `SEQUENCE#` entries aangemaakt met `status: pending_approval`
- [ ] Connection message is <200 tekens (hard truncate in Lambda)
- [ ] Lead-kaart in `/admin/leads` toont badge "Outreach klaar" bij pending sequence
- [ ] Detail modal toont gegenereerd bericht + "Markeer als verstuurd" knop
- [ ] Opportunity wordt niet opnieuw gematcht na `leadMatchedAt` is gezet

---

## B-88d — Autonome e-mail sequentie met CTA-experiment

### Concept

Hetzelfde matching-mechanisme als B-88c (opportunity → lead), maar dan voor e-mail. Het systeem stuurt volledig autonoom gepersonaliseerde e-mails op basis van de opportunity-context. Elke batch van ~10 leads gebruikt één CTA-variant. Na 2 weken bekijkt de CMO welke variant het meest converteert.

### CTA-varianten (startset)

| Variant | CTA tekst | Doel |
|---|---|---|
| A | "Doe de gratis AI Workflow Scan — 5 minuten" | Workflow Scan submissions |
| B | "Plan een gratis 20-min gesprek" | Discovery calls |
| C | "Bekijk hoe [vergelijkbaar bedrijf] dit oploste" | Social proof / kennisbank |

Rotatie: 10 leads per variant, dan wisselen. Na 30 leads per variant: winnaar identificeren op basis van reply-rate.

### Uitbreiding `sequence-scheduler.ts`

**Toevoeging aan bestaande scheduler:**

```typescript
// Na LinkedIn connection matching: e-mail sequence step toevoegen
// Voor leads met status: enriched EN een e-mailadres (lead.email gevuld):

// Genereer gepersonaliseerde e-mail body via Haiku:
// - Onderwerp: "Hoe [bedrijf] [pain] kan oplossen"
// - Body: pain herkenning (2 zinnen) + rootCause (1 zin) + CTA (variant A/B/C)
// - Afzender: Bill (via Zapier Gmail)

// Schrijf SEQUENCE# entry:
// type: email, status: scheduled, sendAt: volgende werkdag 09:00
// ctaVariant: A/B/C (rotatie op basis van mod 10 van leadIndex)
// emailSubject, emailBody
```

**Verzending:** Zapier Gmail integratie (`gmail_send_email` — al geconfigureerd in Zapier MCP).  
**Trigger:** `sequence-scheduler` Lambda (dagelijks 08:00 UTC) pakt `SEQUENCE#` items op met `type: email` en `sendAt <= now` en `status: scheduled`.

### Meten en leren

Wanneer een lead reageert op de e-mail (reply), werkt de COO handmatig de lead-status bij in `/admin/leads`. De `ctaVariant` is opgeslagen op de `SEQUENCE#` entry, zodat de CMO achteraf kan filteren welke variant de meeste `dm_responded` statussen heeft opgeleverd.

Later (buiten scope voor nu): automatische open/click tracking via Zapier Gmail webhook.

### DynamoDB wijzigingen

| Item | Wijziging |
|---|---|
| `SEQUENCE#` | Nieuw: `type: linkedin \| email`, `emailSubject`, `emailBody`, `ctaVariant: A/B/C` |
| `LEAD#` | Pre-condition: `email` veld moet gevuld zijn voor e-mail sequence |

### Acceptatiecriteria B-88d

- [ ] Leads met `status: enriched` en gevuld `email` veld ontvangen een gepersonaliseerde e-mail via Zapier Gmail
- [ ] CTA-variant roteert per 10 leads (A → B → C → A...)
- [ ] `ctaVariant` is opgeslagen op de `SEQUENCE#` entry
- [ ] Dagelijks max 10 e-mails verstuurd (rate-limiting in scheduler om spam-signalen te vermijden)
- [ ] Lead-status in `/admin/leads` is handmatig bij te werken na reply
- [ ] CMO kan in DynamoDB (of via flywheel-metrics) per variant het aantal `dm_responded` statussen zien

---

## Implementatievolgorde

```
B-88a  →  CMO-agent context update           (geen code — direct uitvoerbaar)
B-88b  →  X autonoom publiceren              (klein — uitbreiding content-engine)
B-88c  →  LinkedIn connection matcher        (na B-88b, nieuwe Lambda + kleine Vue uitbreiding)
B-88d  →  E-mail sequentie + CTA-experiment  (na B-88c live — bouwt op hetzelfde matching fundament)
```

---

## Out of Scope

- Content review admin-scherm voor LinkedIn company posts (loopt via daily board meeting)
- Kennisbank engine als aparte Lambda (loopt via CMO-agent in board meeting)
- Persoonlijke LinkedIn posts van Bill (volledig losgekoppeld)
- Betaalde tools of API's
- Automatische e-mail open/click tracking (v1: handmatige reply-registratie)
- Meerdere follow-up e-mails in dezelfde sequence (v1: één e-mail per lead per opportunity)
