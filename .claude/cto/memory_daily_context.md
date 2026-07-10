# Lars — Daily Context
_Last updated: 2026-07-06_

## Open Acties (toegewezen aan mij)
- B-88b (X/Twitter): on hold — Zapier X-integratie weg; alternatief nodig
- B-119: get-latest-episode.mjs serie-filter bug + ep02 typo — todo, XS
- B-112: ContentBuilder rate-limit retry terugporten naar git — volgende meeting

## KPI Status (week 28, 6–12 juli)
- Security check: ✅ B-114 afgerond 2026-07-06 — npm audit --audit-level=high clean in lambda/ (2 moderate over: esbuild dev-server, fast-xml-parser)
- Backlog items shipped: S-14 (NewsFlow pre-rendering), B-118 (tsc fixes), B-114 (vitest 4 bump)
- Vitest: 4.1.10, 28/28 tests groen

## Actieve Blockers
- B-88b (X/Twitter): Zapier heeft geen X-integratie meer — on hold; code klaar
- Geen security blockers — B-114 sluit de laatste HIGH-finding

## Genomen Beslissingen (board 2026-07-06)
- S-14 ✅: NewsFlow pre-rendering via vite-ssg — 17 `/newsflow/:slug`-routes nu met echte content i.p.v. loading-spinner. `vite.config.ts` includedRoutes uitgebreid (HTTP fetch publieke S3 index.json), `NewsFlowView.vue` SSG-compatibel (top-level await, DOMPurify), `App.vue` Suspense-boundary.
- B-118 ✅: 6 lambda tsc-errors → 0 (lead-matcher, newsanalyzer, seooptimizer, sequence-scheduler, signaaldetectie). Bonus: signaaldetectie-fix corrigeert echte bug — RSS-signalen sloegen `persona` niet op (undefined-veld zonder removeUndefinedValues).
- B-114 ✅: vitest 4 bump, SEC-HIGH audit item gesloten.
- Security-reviewer agent gedispatcht voor S-14/B-118 diff: geen bevindingen, klaar voor commit.
- Commit `bf2d201` op feature/board-2026-07-06 (17 files) — Bill akkoord ("1 - ja").
- B-119 aangemaakt: get-latest-episode.mjs filtert op `serie = 'AIntern Experiment'`, echte data is `'Het AIntern Experiment'` → altijd "No episodes found". Ep02's opgeslagen serie-veld heeft ook een typo (kleine letter). Geen blocker, kleine follow-up.

## Lopende Context
- Branch feature/board-2026-07-06: commits `bf2d201` (S-14+B-118+B-114+ep06) en `0557096` (B-117 backlog status)
- npm audit: her-check zodra nieuwe dependency wordt toegevoegd aan lambda/package.json
- Carry-over: geen open HIGH/CRITICAL findings
- Bash-cwd-gotcha: `cd lambda && cmd` laat de shell in lambda/ staan voor de vólgende tool-call — altijd `pwd` checken of cd vermijden bij opeenvolgende calls
- MSYS_NO_PATHCONV=1 nodig vóór `aws ssm get-parameter --name "/..."` in Git Bash — anders wordt het leading-slash pad omgezet naar een Windows-pad en faalt de call met ParameterNotFound
