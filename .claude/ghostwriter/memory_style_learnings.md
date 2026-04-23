---
name: Style Learnings — Ghostwriter
description: Wat werkt qua haak, toon, lengte en structuur op basis van engagement data; bijgewerkt na elke gepubliceerde episode
type: project
---

# Style Learnings — Het AI-Duo Experiment

_Last updated: 2026-04-21_

## Human Board Feedback

| Datum | Feedback |
|-------|----------|
| 2026-04-22 | Posts mogen feitelijker en concreter. Voorkom te algemene opmerkingen. Stijl episode-01 goedgekeurd als referentie. |
| 2026-04-22 | Gebruik feiten niet expliciet maar als inspiratie. Noem geen namen uit meeting minutes, geen exacte backlog-nummers, geen interne beslissingsnotaties. Vertaal het feit naar Bills beleving, de spanning, de keuze die hij maakte. |
| 2026-04-22 | Lees de vorige post altijd uit DynamoDB via `node lambda/scripts/get-latest-episode.mjs` — niet uit het markdown-bestand. Bill kan posts aanpassen in de admin vóór publicatie; die versie is authoritative. |

**Wat dit betekent:** Elke zin moet iets concreets zeggen — een getal, een beslissing, een naam, een datum. Vermijd zinnen die altijd waar zijn ("het duurt een kwartier", "mensen sturen, AI voert uit") zonder feitelijke onderbouwing uit de meeting minutes.

---

## Stijlgids (initieel — vóór engagement data)

Gebaseerd op `.claude/cmo/memory_storywriter_brief.md` en de schrijfstijl van Bill's bestaande LinkedIn posts.

| Element | Wat werkt |
|---------|-----------|
| **Haak** | Eerste zin = verrassing of tegenstelling ("Ik kan geen code schrijven. Echt niet.") |
| **Structuur** | Korte alinea's (1–3 zinnen), witruimte, geen opsommingen |
| **Lengte** | 150–250 woorden — compacter dan 300 presteert beter op LinkedIn |
| **Afsluiting** | Open vraag of eerlijke observatie — nooit een CTA |
| **Perspectief** | Eerste persoon, twijfels en fouten benoemen — menselijk, niet perfect |
| **Commercieel** | Terloops, nooit direct — "eerste gesprekken" niet "klanten" |

## Engagement Learnings

_Nog geen gepubliceerde episodes — learnings worden hier bijgehouden na publicatie + 48–72 uur._

Formaat per learning:
```
**Episode N — [Titel]** (gepubliceerd: [datum])
- Bereik: [N]  Likes: [N]  Comments: [N]  Saves: [N]
- Wat werkte: [haak/thema/lengte observatie]
- Wat minder werkte: [observatie]
- Learning voor volgende batch: [concrete aanpassing]
```
