# Content Distributie — Vision

**Owner:** CMO (Blake)  
**Date:** 2026-04-29  
**Status:** Draft — pending board approval

---

## Probleemstelling

Het Groei Systeem genereert elke week automatisch opportunity statements, LinkedIn posts en X-threads op basis van Reddit pain signals. Deze assets worden nergens gebruikt: ze zitten in DynamoDB en dat is het.

Tegelijk werken de CMO-agent en de daily board meeting al met inspiratiebronnen (Obsidian vault, ghostwriter briefs). De flywheel-data is een betere bron dan buikgevoel — maar de agents weten niet dat die data bestaat.

---

## Visie

> **De Groei Systeem assets — opportunities, gegenereerde posts en pain signals — worden automatisch aangeboden als contextinput aan de bestaande agents en processen die content en outreach aansturen. Geen nieuw admin-scherm. Geen nieuwe goedkeuringsflow. Alleen de juiste data op de juiste plek.**

---

## De vier stromen

### Stroom 1 — LinkedIn Company posts (via Daily Board Meeting)

De huidige manier om LinkedIn company posts te maken loopt via de daily board meeting, waarbij de CMO-agent posts genereert op basis van Obsidian-input en board context.

**Aanpassing:** De CMO-agent krijgt automatisch de meest recente Groei Systeem assets als aanvullende inspiratie meegeleverd bij elke board meeting: de top-3 opportunities van die week (pain, persona, opportunity statement) en de daarbijhorende gegenereerde LinkedIn post-drafts. De agent beslist zelf of en hoe hij deze gebruikt — naast de Obsidian input.

**Wat er gebouwd wordt:** Geen nieuwe Lambda, geen nieuwe Vue-component. Alleen de agent-prompt van de CMO-agent uitbreiden met een DynamoDB-lookup van de meest recente `OPPORTUNITY#` en `CONTENT#linkedin_company` items.

---

### Stroom 2 — Kennisbank artikelen (via Daily Board Meeting)

Hetzelfde principe als LinkedIn: de CMO-agent genereert al kennisbank-drafts als onderdeel van de board meeting workflow.

**Aanpassing:** De CMO-agent krijgt dezelfde Groei Systeem context mee bij de kennisbank-generatie: welke pains zijn deze week het meest urgent, wat zijn de bijbehorende opportunity statements. De agent gebruikt dit als kapstok voor het artikel — naast de Obsidian vault als primaire bron.

**Wat er gebouwd wordt:** Geen nieuwe Lambda. Alleen de CMO-agent-prompt uitbreiden zodat hij `OPPORTUNITY#` items als kennisbankbron beschouwt.

---

### Stroom 3 — X/Twitter (volledig autonoom)

Content-engine genereert al X-threads per opportunity. Deze worden direct gepubliceerd via Zapier — geen goedkeuringsgate.

**Stroom:**
```
content-engine genereert X-thread → Lambda roept Zapier webhook aan → Zapier post naar X
```

**Rationale voor autonomie:** X is een experimenteel kanaal voor AIntern. De volume is laag (3/week), de risico's bij een matige post zijn beperkt, en het handmatig goedkeuren van elk tweet-thread voegt geen waarde toe. We meten bereik via flywheel-metrics en kunnen de content-engine prompt aanscherpen als de kwaliteit tegenvalt.

**Wat er gebouwd wordt:** Uitbreiding op `content-engine.ts` — na het aanmaken van een `CONTENT#x` item direct een Zapier webhook aanroepen. Status → `published`. Vereist Zapier X-account koppeling (eenmalige handmatige setup).

---

### Stroom 4 — Lead outreach: LinkedIn connection message

Opportunities bevatten `persona` en `pain` — exact de context die een LinkedIn connection request relevant maakt. Leads in de pipeline krijgen een gegenereerd, gepersonaliseerd bericht op basis van de opportunity die het meest op hun profiel matcht.

**Stroom:**
```
Opportunity (high priority) + Lead (new/enriched) → gegenereerd connection message → zichtbaar in /admin/leads
```

De COO of CEO keurt het bericht goed via de detail modal in `/admin/leads` en verstuurt. Geen automatisch verzenden — de menselijke stap blijft bij LinkedIn connection requests.

---

### Stroom 5 — Lead outreach: autonome e-mail sequentie

Naast LinkedIn wordt een volledig autonome e-mail outreach opgezet op basis van dezelfde opportunity context. Het systeem stuurt gepersonaliseerde e-mails, experimenteert met verschillende CTA's en meet welke variant converteert naar Workflow Scan submissions of discovery calls.

**Experiment-setup:**
- Elke batch van ~10 leads krijgt één CTA-variant
- Varianten rouleren (bijv. Variant A: "Doe de gratis Workflow Scan", Variant B: "Plan een 20-min gesprek", Variant C: "Download de checklist")
- Resultaten (opens, clicks, replies) worden bijgehouden per lead in DynamoDB
- CMO reviewt wekelijks welke variant wint → content-engine past template aan

**Wat er gebouwd wordt:** Uitbreiding op `sequence-scheduler.ts` + nieuw e-mail template per CTA-variant. E-mail versturen via Zapier Gmail-integratie (gratis). Lead-status update bij open/reply via Zapier webhook terugkoppeling.

---

## Kanalen — definitief advies

| Kanaal | Aanpak | Autonomie | Tool |
|---|---|---|---|
| LinkedIn Company | Via CMO-agent in board meeting | Semi (agent beslist, Bill keurt post goed) | DynamoDB context inject in agent-prompt |
| Kennisbank | Via CMO-agent in board meeting | Semi (agent genereert, CMO publiceert) | DynamoDB context inject in agent-prompt |
| X/Twitter | Direct publish na content-engine | Volledig autonoom | Zapier (gratis tier) |
| LinkedIn DM | Gegenereerd bericht in /admin/leads | Handmatig versturen (COO/CEO) | Bestaande lead pipeline |
| E-mail | Autonome sequentie met CTA-experiment | Volledig autonoom | Zapier Gmail (gratis) |

---

## Wat dit NIET is

- Geen nieuw admin-scherm voor content review (LinkedIn company en kennisbank gaan via bestaande flows)
- Geen persoonlijke LinkedIn posts van Bill
- Geen betaalde tools (Zapier gratis tier, geen Buffer/Hootsuite)
- Geen directe X API integratie (via Zapier)
