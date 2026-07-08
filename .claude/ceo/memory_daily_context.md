# Joost — Daily Context
_Last updated: 2026-07-06_

## Open Acties (toegewezen aan mij)
- Q3 OKRs vaststellen — Q2 eindigde 2026-06-30, nog geen Q3-doelen; openstaand sinds weekrapport W27 🔴
- B-104 deel 2: nieuwe lead toevoegen aan pipeline — Bill geeft lead op; nog open
- B-119: get-latest-episode.mjs serie-filter bug + ep02 typo — todo, CTO, XS

## KPI Status (week 28, 6–12 juli)
- LinkedIn posts: 0/3 (ep06 klaar voor Bill, post_voor 13 juli)
- Kennisbank: 1/2 ✅ (B-117 gepubliceerd 2026-07-08: ai-integreren-in-bewezen-architectuur-mkb)
- Nieuwe connecties: 0/20–25 (7 leads in pijplijn, wachten handmatige acceptatie)
- Lambda security (HIGH): 0 open ✅ (B-114 afgerond, npm audit clean)

## Actieve Blockers
- 2 leads needs_enrichment (topicsfashion.nl, chocoladeverpakking.nl) — geen LinkedIn-URL, handmatige lookup nodig
- B-104 deel 2: nieuwe lead van Bill nog niet opgegeven

## Top 5 Dagelijkse Acties (2026-07-06)
1. Weekrapport W27 (B-115) ✅ — maandag-verplichting, herstelt rapportagegat W19–W26
2. Ghostwriter ep06 (B-116) ✅ — "Acht weken lang keek ik niet mee" gedraft + DynamoDB-import
3. S-14 + B-118 + B-114 ✅ — NewsFlow pre-rendering, lambda tsc fixes, vitest 4 SEC-HIGH bump; commit `bf2d201`
4. B-117 ✅ — Kennisbank artikel W28 gepubliceerd na gate-goedkeuring; commit `0557096`
5. B-104 ✅ — outreach pipeline geverifieerd (CSV was al correct, backlog liep achter)

## Backlog Correcties (2026-07-06)
- S-14 ✅ done — NewsFlow pre-rendering via vite-ssg
- B-118 ✅ done — lambda tsc errors (6→0), incl. echte persona-opslagbug gefixt
- B-114 ✅ done — vitest 4 bump, SEC-HIGH audit clean
- B-116 ✅ done — Ghostwriter ep06 draft + DynamoDB import
- B-117 ✅ done — Kennisbank artikel W28 gepubliceerd
- B-104 ✅ done — outreach pipeline geverifieerd
- B-119 todo (nieuw) — data-hygiene: get-latest-episode.mjs serie-filter + ep02 typo

## Genomen Beslissingen (board 2026-07-06)
- Bundled commit-gate: S-14 + B-118 + B-114 samen ter goedkeuring i.p.v. per-terminal — Bill akkoord ("1 - ja")
- Kennisbank W28 goedgekeurd en gepubliceerd ("3 JA")
- Ghostwriter ep06 draft geaccepteerd, Bill post zelf ("2 JA")
- LinkedIn acceptatiecontrole + Q3 OKRs bevestigd als openstaand, geen actie deze sessie ("4 EN 5 OK")
- Obsidian seed-tracking gecorrigeerd: 7 bestanden alsnog gemarkeerd GEBRUIKT (tracking was 8 weken gedreft)
- Security-reviewer agent: S-14/B-118 diff schoon, geen bevindingen

## Lopende Context
- Branch feature/board-2026-07-06: 2 commits (`bf2d201` code+ep06, `0557096` backlog B-117)
- Ghostwriter ep06: `.claude/cmo/ghostwriter_drafts/episode-06-acht-weken-stilte.md` (post_voor 2026-07-13)
- Kennisbank S3: 21 artikelen (ai-integreren-in-bewezen-architectuur-mkb toegevoegd 2026-07-08)
- Amplify prod-build getriggerd (HTTP 202) voor sitemap/llms-refresh
- 7 connection_sent leads wachten op acceptatie: Franny, Denise, Ilse, Nick, Bep (2026-05-05), Jeppe Hondelink, Jeroen de Groot (2026-05-16)
- Skill daily-board-meeting: v0.4.5
