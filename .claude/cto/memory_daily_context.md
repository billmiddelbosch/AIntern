# Lars — Daily Context
_Last updated: 2026-04-25_

## Open Acties (toegewezen aan mij)
- B-60: O-03 Client Onboarding Checklist spec ✅ aangemaakt — implementatie morgen (deadline 1 mei)
- B-38: O-02 Kanban (van vorige week) — status controleren
- B-41: S-03 schema.org (van vorige week) — status controleren

## KPI Status (week 17, 20–26 april)
- Security check: ✅ B-47 gedaan (2026-04-25); B-56/B-57 stale carry-overs gecanceld
- Sitemap: ✅ 13 routes (B-58 gedaan — S3 had 11 artikelen, sitemap had 10)
- Test suite: ✅ 112/112 tests passing (ongewijzigd)

## Actieve Blockers
- JWT/service-account A-14 KPI API — weekrapport O-01 kan KPI actuals niet ophalen (laag prio)

## Genomen Beslissingen (board 2026-04-25)
- B-58 ✅ sitemap geregenereerd — 13 routes na npm run sitemap:generate
- B-60 ✅ O-03 spec aangemaakt — product/sections/client-onboarding/spec.md
- B-56 + B-57 ❌ geannuleerd — CORS fix (B-21, commit 7b47c1b) en DOMPurify (B-23) al gedaan; security check kopieerde week-16 items zonder verificatie
- Import script gefixd: CRLF-normalisatie in parseFrontmatter() + --force flag (fixes episode-01 skip op Windows)
- SKILL.md v0.3.9: improvement 10 (security carry-over cross-check) + improvement 11 (frontmatter checklist) toegepast
- Haiku switch actief: lead-outreach + linkedin-outreach agents (commit 9083c37)

## Lopende Context
- O-03 implementatie morgen: product/sections/client-onboarding/spec.md (deadline 1 mei = T-6)
- Import script lambda/scripts/import-ghostwriter-drafts.mjs heeft --force flag voor herinsport en CRLF fix
- Alle 4 ghostwriter episodes correct in DynamoDB (ep01: d215d623, ep02: 84a8b02c, ep03: 15e4536c, ep04: 3bbcab6e)
