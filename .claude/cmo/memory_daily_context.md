# Sanne — Daily Context
_Last updated: 2026-07-06_

## Open Acties (toegewezen aan mij)
- B-105: Cold email targeting prep — 5 targets identificeren via Apollo (todo)
- B-31: 2 leads nog needs_enrichment (topicsfashion.nl, chocoladeverpakking.nl)
- Kennisbank artikel #2 week 28 — volgende meeting

## KPI Status (week 28, 6–12 juli)
- LinkedIn posts: 0/3 (ep06 klaar, Bill post zelf voor 13 juli)
- Nieuwe connecties: 0/20–25 (7 leads wachten handmatige acceptatie)
- Kennisbank artikelen: 1/2 ✅ (B-117 gepubliceerd 2026-07-08: ai-integreren-in-bewezen-architectuur-mkb)

## Actieve Blockers
- B-31 (deels): topicsfashion.nl + chocoladeverpakking.nl nog needs_enrichment — Apify of handmatig
- Geen nieuwe not_contacted leads met LinkedIn-URL — outreach batch geblokkeerd tot Bill nieuwe leads aanlevert

## Goedkeuringsregel (permanent)
- Alles wat extern zichtbaar wordt vereist altijd Human Board goedkeuring vóór uitvoering.
- LinkedIn persoonlijke posts: Bill post altijd zelf, ook na goedkeuring van de draft.

## Genomen Beslissingen (board 2026-07-06)
- B-116 ✅: Ghostwriter ep06 "Acht weken lang keek ik niet mee" gedraft — feitenbasis weekrapport W27 (8-wekengat + stille NewsFlow-403). Geïmporteerd DynamoDB (dev, id 3f2472a9). Bill akkoord ("2 JA"), post zelf voor 2026-07-13.
- Bijvangst: ep01 en ep03 bleken nog nooit in DynamoDB gestaan — nu alsnog geïmporteerd. Verklaart eerdere status-discrepantie CMO memory vs. DynamoDB.
- B-117 ✅: Kennisbank "AI integreren in bewezen architectuur: de MKB-strategie die wél werkt" — gate-goedgekeurd ("3 JA"), gepubliceerd naar S3, Obsidian-seed gemarkeerd GEBRUIKT.
- Obsidian seed-tracking gecorrigeerd: 5 seeds bleken al gepubliceerd + 2 al door ghostwriter gebruikt, nooit gemarkeerd — alle 7 nu GEBRUIKT. 10 seeds resteren echt onbenut (was 17).
- B-119 (nieuw, CTO): get-latest-episode.mjs filtert op verkeerde serie-naam ('AIntern Experiment' i.p.v. 'Het AIntern Experiment') — meldt altijd "No episodes found". Ep02 heeft ook een serie-veld typo.

## Ghostwriter Status
- ep01: ✅ gepubliceerd (alsnog geïmporteerd DynamoDB 2026-07-06) | ep02: ✅ gepubliceerd | ep03: ✅ gepubliceerd (alsnog geïmporteerd DynamoDB 2026-07-06) | ep04: ✅ gepubliceerd | ep05: ✅ gepubliceerd (2026-05-19)
- ep06: draft klaar, Bill akkoord, post_voor 2026-07-13 — `.claude/cmo/ghostwriter_drafts/episode-06-acht-weken-stilte.md`
- **Serienaam (canoniek): "Het AIntern Experiment"** — let op B-119, get-latest-episode.mjs gebruikt nog de korte vorm
- Volgende episode: ep07 (na publicatie ep06)

## Lopende Context
- 3 dm_sent leads wachten op reactie: Bram Hofman, Jan Bulthuis, Bob van Boekel
- 7 connection_sent leads wachten op acceptatie: Franny, Denise, Ilse, Nick, Bep (2026-05-05), Jeppe Hondelink, Jeroen de Groot (2026-05-16)
- 2 leads needs_enrichment: topicsfashion.nl, chocoladeverpakking.nl
- Kennisbank S3: 21 artikelen (index bijgewerkt 2026-07-08, Amplify prod-build getriggerd voor sitemap/llms)
- outreach-log.csv: geen wijzigingen 2026-07-06
