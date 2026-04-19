# Morgan — Daily Context
_Last updated: 2026-04-19_

## Open Acties (toegewezen aan mij)
- B-32: L-10 spec schrijven — Social Proof / Testimonials Section (product/sections/social-proof/spec.md) — lagere prio, volgende vergadering
- O-02 implementatie: spec klaar (product/sections/admin-lead-pipeline/spec.md) — start volgende vergadering (deadline 30 april, T-11d)

## KPI Status (week 16, 13–19 april)
- Security check: ✅ gedaan 2026-04-16 (week 16)
- Sitemap: ✅ S3=8, sitemap.xml=8 (geen discrepantie)
- Test suite: ✅ 112/112 tests passing na vitest.config.ts resolve.alias fix

## Actieve Blockers
- JWT/service-account A-14 KPI API — weekrapport O-01 kan KPI actuals niet ophalen zonder auth token (laag prio)
- `claude -p` subprocess auth: API key niet beschikbaar in subproces; terminals inline uitvoeren

## Genomen Beslissingen (board 2026-04-19)
- B-33 RTK geïmplementeerd ✅ commit 9dcc05c — CLAUDE.md mode (hook-mode niet ondersteund op Windows)
  - Broken PreToolUse hook verwijderd (.claude/settings.json → {"hooks": {}})
  - ~/.bash_profile aangemaakt voor RTK PATH ($HOME/.local/bin)
- B-34 sitemap tests ✅ commit 935c167 — src/test/sitemap.test.ts, 8 tests
- B-35 Lambda endpoint tests ✅ commit 935c167 — src/test/lambda-kennisbank-admin.test.ts, 21 tests
  - Fix: vitest.config.ts resolve.alias voor jsonwebtoken, @aws-sdk/client-s3, @aws-sdk/client-ssm
  - Pattern: vi.hoisted() + __cmd tagging voor S3 command discriminatie
- Skill v0.3.6 gepubliceerd: RTK PATH auto-fix + backlog post-build-error check + Obsidian vault pre-check
- B-28 (A-05) backlog gecorrigeerd → ✅ done (commit was 25aeded, stale door build-error disruption)
- Spec admin-article-form/spec.md: stale "Out of Scope" deletion UI verwijderd

## Lopende Context
- Alle 112 tests groen: 83 unit + 8 sitemap + 21 Lambda
- RTK actief in CLAUDE.md mode — `rtk <command>` prefix voor sessie-optimalisatie
- Branch feature/board-2026-04-19 bevat: B-33, B-34+B-35, skill v0.3.6, backlog updates, outreach CSV
- Volgende vergadering: O-02 implementatie starten, L-10 spec (lagere prio)
