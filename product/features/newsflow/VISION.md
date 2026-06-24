# NewsFlow — Vision
**Zelf-lerend nieuws-naar-landingspagina flywheel voor AIntern SEO**

**Tags:** SEO, content-engine, agents, groei-systeem  
**Priority:** P1  
**Effort:** XL  
**Owner:** CMO (strategie + prioritering), CTO (implementatie)  
**Status:** Vision fase — spec volgt  
**Date:** 2026-06-24  
**Afhankelijkheid:** AInternLoop (vereist als fundament)

---

## Probleemstelling

aintern.nl mist dagelijks organisch verkeer dat ontstaat rondom actuele nieuwsvragen. Mensen die Nederlands nieuws lezen, stellen vervolgvragen — "wat betekent dit voor mijn bedrijf?", "hoe werkt dit AI-systeem?" — maar aintern.nl heeft geen content die op die vragen antwoordt.

Drie specifieke problemen:

1. **Actuele lezersvragen worden niet omgezet in content.** Het nieuws genereert dagelijks search-volume, maar aintern.nl is er niet op gevonden. Die kans verdwijnt binnen 24–72 uur.
2. **Handmatig content maken schaalt niet.** Eén landingspagina per dag is met mensen onhaalbaar op hoge kwaliteit en consistentie.
3. **Gepubliceerde pagina's worden niet continu geoptimaliseerd.** Eén keer schrijven is niet genoeg: verkeersdata onthult wat werkt, maar niemand verwerkt die feedback systematisch terug in de content.

---

## Visie

> **NewsFlow is een dagelijks flywheel dat Nederlands nieuws omzet in één hoogwaardige, SEO-geoptimaliseerde landingspagina op aintern.nl — gestuurd door de meest urgente lezersvraag van die dag. Gepubliceerde pagina's worden continu verbeterd op basis van werkelijk verkeer. Het systeem leert wat werkt.**

Het flywheel werkt in drie stappen: nieuws analyseren → content bouwen → SEO optimaliseren. Elke stap is een gespecialiseerde agent die draait op AInternLoop. Issues worden automatisch geëscaleerd; instructies worden centraal beheerd en scherpen zich aan op basis van resultaten.

---

## Doel

**Primair:** 1 nieuwe SEO-landingspagina per dag, gepubliceerd op aintern.nl, gebaseerd op de meest urgente Nederlandse lezersvraag.

**Secondair:**
- Organisch verkeer per gepubliceerde pagina stijgt na optimalisatierondes
- Systeem leert welke vraag-typen, content-structuren en SEO-aanpassingen het beste converteren
- Agents worden autonoom beter zonder handmatige instructie-updates

---

## Agents

### NewsAnalyzer
- **Frequentie:** dagelijks (ochtend)
- **Bron:** Nederlandse RSS feeds — NOS.nl, NU.nl (uitbreidbaar)
- **Taak:** haalt top-nieuwsitems op, destilleert potentiële lezersvragen per item, kent urgentiescore toe (trending, tijdsgevoelig, hoog search-volume potentieel), schrijft gerangschikte acties van type `newsflow/content` in de AInternLoop `actions`-tabel
- **Prioritering:** zowel NewsAnalyzer als ContentBuilder bepalen urgentie — de hoogste-prioriteit actie wordt als eerste opgepakt
- **Output:** acties in `actions`-tabel, gesorteerd op urgentiescore

### ContentBuilder
- **Frequentie:** dagelijks (middag)
- **Taak:** filtert open `newsflow/content`-acties op urgentie, pakt de hoogste prioriteit op, verzamelt online informatie (zoekresultaten, gerelateerde content), genereert een Vue-landingspagina, publiceert via branch-workflow, werkt sitemap + LLM-bestanden bij, zet actie op `published`
- **Branch-workflow:** maakt feature branch van master → test → mergt naar master/test/production via Amplify
- **Kan ook:** nieuwe acties aanmaken voor andere agents (bijv. `newsflow/additional-content` voor SEOOptimizer indien aanvullende content nodig is)
- **Output:** gepubliceerde Vue-pagina, URL in `landing_pages`-tabel, actie-status `published`

### SEOOptimizer
- **Frequentie:** continu / dagelijkse schedule per gepubliceerde pagina
- **Taak:** analyseert traffic-data per landingspagina, identificeert verbeterpunten (structuur, zoekwoorden, interne links, CTA's, aanvullende content), implementeert verbeteringen via branch-workflow, publiceert direct
- **Interactie met ContentBuilder:** kan `newsflow/additional-content`-acties aanmaken indien inhoudelijke uitbreiding nodig is
- **Leert:** logt per optimalisatieronde wat er gewijzigd is en wat het effect was; LearningAgent (AInternLoop) verwerkt bevindingen terug in algemene agent-instructies
- **Output:** verbeterde pagina gepubliceerd, traffic + optimalisatielog bijgewerkt in `landing_pages`-tabel

---

## Branch-workflow (geldt voor ContentBuilder én SEOOptimizer)

Elke agent die een pagina aanmaakt of aanpast:

1. Maakt een feature branch van `master`
2. Voert wijzigingen door
3. Runt tests
4. Mergt naar `master` → `test` → `production` (via Amplify deploy-pad)

Geen directe commits op `master`. Tests moeten slagen vóór merge.

---

## Tabellen (DynamoDB)

| Tabel | Inhoud |
|---|---|
| `actions` (AInternLoop) | actietype `newsflow/content` of `newsflow/additional-content`, urgentiescore, status, agent, issue-referentie |
| `landing_pages` | URL, gekoppelde actie, publicatiedatum, traffic (paginaweergaven, bouncepercentage, gemiddelde sessieduur), optimalisatie-log (wat, wanneer, door welke agent, effect) |

---

## Admin (`aintern/admin/nieuws`)

Dagelijks bijgewerkt overzicht:

- Per agent: naam, huidige instructie (zichtbaar), aantal acties opgepakt vandaag, succes/faal
- Instructies zijn bewerkbaar door human én door LearningAgent (via AInternLoop governance)
- Historisch overzicht: trending pagina's, meest geoptimaliseerde content, leercurve per agent

---

## AInternLoop-integratie

NewsFlow is volledig gebouwd op AInternLoop:

| AInternLoop-component | Gebruik door NewsFlow |
|---|---|
| `actions`-tabel | Centrale coördinatie tussen NewsAnalyzer, ContentBuilder en SEOOptimizer |
| `issues`-tabel | Agents loggen blokkades; IssueResolver lost op of escaleert |
| `agents`-tabel | Agent-instructies opgeslagen; alleen LearningAgent of human mag aanpassen |
| IssueResolver | Analyseert elke 30 min open issues van NewsFlow-agents |
| LearningAgent | Verwerkt opgeloste issues en SEO-bevindingen terug naar agent-instructies |

---

## Wat buiten scope valt

- Engelstalige content of niet-Nederlandse nieuwsbronnen (fase 2)
- Social media distributie van gepubliceerde pagina's (apart systeem)
- Betaald verkeer of advertenties rondom gepubliceerde content
- Redactionele goedkeuring vóór publicatie — systeem publiceert autonoom; human kan achteraf ingrijpen via admin
- Meer dan 1 nieuwe landingspagina per dag in fase 1

---

## Relatie met andere onderdelen

| Onderdeel | Relatie |
|---|---|
| AInternLoop | Vereist fundament — orkestratie, issues, leren |
| Kennisbank / Blog | Gepubliceerde landingspagina's volgen hetzelfde S3/Amplify-publicatiepad als kennisbank-artikelen |
| Sitemap + LLM-bestanden | ContentBuilder werkt deze bij na elke publicatie |
| SEO keyword strategy (`product/seo/keyword-strategy.md`) | NewsAnalyzer gebruikt keyword-strategie als context bij urgentiescore-berekening |
| S-13 Editorial Outreach | Gepubliceerde landingspagina's kunnen als linkdoel dienen in editorial outreach |

---

## Risico's en mitigaties

| Risico | Kans | Mitigatie |
|---|---|---|
| Gegenereerde content bevat fouten of is misleidend | Middel | SEOOptimizer flaggt lage-kwaliteitspagina's; human kan via admin ingrijpen; IssueResolver escaleert bij structurele kwaliteitsproblemen |
| RSS-feeds offline of gewijzigd | Laag | NewsAnalyzer logt als issue; IssueResolver probeert alternatieve feed; geen publicatie op die dag |
| Branch-workflow faalt (test mislukt) | Middel | Actie gaat on-hold als issue; ContentBuilder logt foutmelding; IssueResolver analyseert |
| SEOOptimizer verslechtert bestaande pagina's | Laag | Traffic-log toont effect per optimalisatieronde; bij daling vlaggt SEOOptimizer als issue; LearningAgent past instructie aan |
| Amplify build-time overschrijding | Laag | Feature branches triggeren alleen een partial deploy van de gewijzigde pagina |
