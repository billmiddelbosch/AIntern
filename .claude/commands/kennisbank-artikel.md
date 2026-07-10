---
name: kennisbank-artikel
description: "Schrijf en publiceer één Kennisbank-artikel los van de dagelijkse boardvergadering. Zelfde onderwerp-sourcing (Obsidian) en schrijfstandaarden als Fase 4 van daily-board-meeting, maar losstaand draaibaar met drie verschillen: skip-condities zijn optioneel (bij een treffer wordt de Human Board gevraagd of toch doorgegaan moet worden, i.p.v. automatisch overslaan), er is geen approval-gate (artikel wordt direct geschreven en gepubliceerd), en sitemap.xml/llms-full.txt worden ververst via dezelfde Amplify-build-webhook als NewsFlow — niet via de oude 'geen deploy nodig'-aanname."
---

Schrijft en publiceert één Kennisbank-artikel, buiten de dagelijkse boardvergadering om.

$ARGUMENTS

Als een onderwerp is meegegeven als argument, gebruik dat direct als seed en sla Stap 2 over. Anders: source het onderwerp uit Bill's Obsidian vault (Stap 2).

## Stap 1 — Skip-condities (optioneel — vraag door, skip niet automatisch)

Evalueer beide condities. Bij een treffer: **stop niet vanzelf** — stel de Human Board expliciet de vraag via de AskUserQuestion tool en wacht op antwoord voordat je verdergaat.

**Conditie 1 — Weekdoel al gehaald:**
Bereken de ISO-weekstart (vandaag minus weekdag-index, maandag=0). Tel gepubliceerde Kennisbank-artikelen met `publishedAt >= maandag` uit `.claude/cmo/memory_daily_context.md`. Als het aantal ≥ 2 (het weekdoel), vraag:
`"Kennisbank-weekdoel al gehaald (N/2 deze week). Toch een artikel schrijven en publiceren?"`

**Conditie 2 — Vandaag al gepost:**
Check `.claude/cmo/memory_daily_context.md` op een publicatie met vandaag als datum. Zo ja, vraag:
`"Er is vandaag al een Kennisbank-artikel gepubliceerd ('[titel]'). Toch nog een artikel schrijven en publiceren?"`

Bij "nee": stop de flow en meld welke conditie de reden was. Bij "ja" (of geen enkele conditie geraakt): ga door naar Stap 2.

## Stap 2 — Onderwerp sourcen (Obsidian)

Volg `.claude/skills/daily-board-meeting/references/obsidian-vault.md`:
- Lees de 10 meest recente entries uit `Thoughts/` (recursief, alle submappen — niet alleen de root)
- Filter entries die al `AFGEWEZEN` of `GEBRUIKT` zijn: check de "Genomen Beslissingen" sectie van `.claude/cmo/memory_daily_context.md` op de exacte bestandsnaam
- Scoor relevantie (High/Medium/Low) voor de doelgroep (Lightspeed webshops, MKB, AI-automatisering)
- Kies de hoogst scorende, nog niet gebruikte entry als seed

Als alle 10 entries AFGEWEZEN/GEBRUIKT zijn: meld dit en stop — er is geen bruikbare seed beschikbaar.

## Stap 3 — Angle bepalen

Laad de `marketing-super-team` skill voor een Quick Audit op de gekozen seed: klopt de invalshoek voor de doelgroep? Bepaal titel, categorie (zie tabel in `.claude/skills/daily-board-meeting/references/kennisbank-publishing.md`), angle (1 zin) en outline (2-3 secties).

## Stap 4 — Artikel schrijven

Schrijf het volledige artikel direct — **geen approval-stap, geen wachten op goedkeuring van de Human Board**:
- Taal: Nederlands
- Lengte: 500-800 woorden (400-700 basisartikel + FAQ-sectie)
- Format: HTML (`<p>`, `<h2>`, `<ul>`, `<li>`, `<strong>`)
- Toon: direct, plain, geen buzzwords — begin bij de pijn van de lezer
- Altijd minstens één concreet cijfer/metric (bijv. "60 minuten per product → 5 minuten")
- **FAQ / klantvragen sectie (verplicht):** zelfde patroon als NewsFlow — identificeer 2-3 concrete vragen die een MKB/Lightspeed-webshopeigenaar zou stellen over het onderwerp, en beantwoord elk in max 80 woorden. Embed aan het eind van `content`, vóór de CTA:
  ```html
  <h2>Veelgestelde vragen</h2>
  <p><strong>Vraag 1?</strong> Antwoord in max 80 woorden.</p>
  <p><strong>Vraag 2?</strong> Antwoord in max 80 woorden.</p>
  ```
- Zachte CTA: "Benieuwd wat dit voor jouw webshop betekent? Plan een gratis gesprek." (na de FAQ-sectie)
- Slug: lowercase, hyphen-separated Nederlandse woorden, max ~60 tekens

## Stap 5 — Publiceren naar S3 (incl. sitemap/llms refresh)

Volg **alle** publish-stappen uit `.claude/skills/daily-board-meeting/references/kennisbank-publishing.md`, inclusief de laatste stap (Amplify build-trigger):
1. Formatteer als post-JSON (`slug`, `title`, `category`, `publishedAt`, `excerpt`, `metaDescription`, `content`)
2. Sla lokaal op in temp (`$env:TEMP` / `AppData/Local/Temp`, nooit in de git repo)
3. **Index-integriteitscheck** vóór je de index aanpast — vergelijk S3-postcount met index-entrycount; bij mismatch: rebuild de volledige index uit S3 in plaats van prependen op een stale index (zie referentie voor de exacte rootcause en het rebuild-script)
4. Prepend de nieuwe post-summary aan `index.json`
5. Upload beide bestanden naar `s3://aintern-kennisbank/` via `aws s3 cp`
6. **Trigger de Amplify build** (Publish Step 7 in de referentie) — ververst `sitemap.xml`/`llms-full.txt` via dezelfde webhook als NewsFlow (alias `prod`, verwacht HTTP 200). Een mislukte trigger is non-fatal: het artikel is al gepubliceerd via stap 5; meld `[BLOCKER: Amplify build trigger mislukt — sitemap/llms blijven stale tot de volgende deploy]` en ga door. **Nooit de webhook-URL loggen** — bevat een secret token.

## Stap 6 — Melden

Rapporteer aan de Human Board:
- Titel, categorie en slug van het gepubliceerde artikel + live URL (`https://aintern.nl/kennisbank/{slug}`)
- Amplify-build status (getriggerd / mislukt)
- Of een skip-conditie is doorbroken, en welke
- Obsidian-seed die is gebruikt (exacte bestandsnaam)

Werk `.claude/cmo/memory_daily_context.md` direct bij met de nieuwe publicatie (datum, titel, categorie) en markeer de gebruikte Obsidian-seed als `GEBRUIKT` in de Genomen Beslissingen sectie — zodat toekomstige skip-conditie-checks en KPI-tellingen kloppen. Dit is een interne actie en vereist geen goedkeuring.
