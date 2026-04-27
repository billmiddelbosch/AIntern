# Sanne — Daily Context
_Last updated: 2026-04-27_

## Open Acties (toegewezen aan mij)
- B-39: 5 LinkedIn connection requests (Franny, Denise, Ilse, Nick, Bep) — **ON HOLD** — Bill wil nieuwe outreach optie evalueren
- B-31: LinkedIn URL enrichment — 4 leads nog needs_enrichment (handmatige lookup Bill)

## KPI Status (week 18, 27 april–)
- LinkedIn posts: 0 / 3 — week 18 gestart
- Nieuwe connecties: 0 / 20–25 — ⚠️ (outreach ON HOLD)
- Kennisbank artikelen: 1 / 2 — ⚠️ (B-81: ai-uitbesteden-mkb-regie-houden gepubliceerd 2026-04-27; 1 nog te doen)

## Actieve Blockers
- Outreach ON HOLD — wacht op B-61 (AI MKB Stap 2 Insight Extractie)
- Kennisbank week 18 artikel 2: concept klaar ("Technisch inzicht is niet meer het voordeel") — publiceren morgen 2026-04-28

## Goedkeuringsregel (permanent)
- Alles wat extern zichtbaar wordt vereist altijd Human Board goedkeuring vóór uitvoering.

## Genomen Beslissingen (board 2026-04-27)
- B-81 Kennisbank "AI uitbesteden of zelf doen?" gepubliceerd ✅ — ai-uitbesteden-mkb-regie-houden.json + index herbouwd (12 artikelen)
- Kennisbank index.json gecorrigeerd: had 4 artikelen (corrupt), herbouwd naar 12 via S3 post-files
- Ghostwriter ep03 aangemaakt: episode-03-het-eerste-lek.md (week 16 security audit) — status: draft, post_voor 2026-05-05
- Ghostwriter ep01/ep02 frontmatter gecorrigeerd: serie-naam + status: approved
- Ghostwriter DynamoDB: duplicaat drafts verwijderd voor ep01/ep02 (serie-naam mismatch veroorzaakte herduplicatie)
- Kennisbank artikel 2 (Technisch inzicht) — concept klaar, publiceer morgen 2026-04-28

## Ghostwriter Status (DynamoDB verified 2026-04-27)
- ep01: ✅ approved (DynamoDB) | ep01-introductie.md: serie=Het Aintern experiment, status=approved
- ep02: ✅ approved (DynamoDB) | ep02-de-directie.md: serie=Het Aintern Experiment, status=approved
- ep03: draft | ep03-het-eerste-lek.md aangemaakt — nog niet in DynamoDB geïmporteerd
- ep04: ontbreekt — nog te schrijven (feitenbasis: week 16/17 data)
- **Volgende te schrijven: ep04** (query DynamoDB voor verifiëring, nooit CMO memory)

## Genomen Beslissingen (board 2026-04-25)
- B-59 LinkedIn company post gepubliceerd ✅ — "Van software naar agents" (urn:li:share:7453754568632467458)
- B-44 ghostwriter episodes 02–04 herschreven met echte feiten + geïmporteerd in DynamoDB ✅
  - ep01: d215d623 | ep02: 84a8b02c | ep03: 15e4536c | ep04: 3bbcab6e
- B-49 gecorrigeerd naar ✅ done (was stale; commit 7a1ab2e)
- B-56, B-57 geannuleerd — stale security carry-overs, al gefixd in B-21/B-23
- LinkedIn outreach leads 1–5: ON HOLD — wacht op nieuwe outreach optie van Bill
- Haiku switch bevestigd actief voor lead-outreach + linkedin-outreach agents (commit 9083c37)

## Lopende Context
- 2 openstaande connection requests week 16: Hilde Bolks (liatelier.nl), Robert Theuws (homefitness4you.nl) — wachten op acceptatie (8 dagen)
- 3 dm_sent leads wachten op reactie: Bram Hofman, Jan Bulthuis, Bob van Boekel
- 5 not_contacted leads KLAAR maar ON HOLD: Franny van Soest, Denise Aa, Ilse Huijbregts, Nick van den Berg, Bep Floor
- Ghostwriter drafts beschikbaar in /admin/linkedin (ep01–04, status: draft)
- Afgewezen/gebruikte Obsidian seeds (alle opgebruikt):
  - AFGEWEZEN: Claude superkracht.md, Claude people pleaser.md, AI Agent Beveiliging.md
  - GEBRUIKT: AI implementatie MKB.md, AI-winnaars governance.md, AI-development democratiseert.md, AI procesautomatisering.md, De startup van de toekomst 2 AI operators.md, Software bouwen is skills en agents bouwen.md
