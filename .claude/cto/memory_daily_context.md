# Lars — Daily Context
_Last updated: 2026-05-05_

## Open Acties (toegewezen aan mij)
- B-88b (X/Twitter): on hold — Zapier X-integratie weg; alternatief nodig
- infra/lib/admin-stack.ts security fix deployen — commit klaar op feature/board-2026-05-05; Bill keurt goed

## KPI Status (week 19, 4–10 mei)
- Security check: ✅ gedaan 2026-05-05 (B-95, PR #149) — PASS na fix
- Backlog items shipped: B-95 (security check + MEDIUM fix admin-stack.ts)
- Volgende security check: week 20 (2026-05-11)

## Actieve Blockers
- B-88b (X/Twitter): Zapier heeft geen X-integratie meer — on hold; code klaar

## Genomen Beslissingen (board 2026-05-05)
- B-95 security check PR #149: PASS na fix
  - MEDIUM gefixd: adminAuthFn SSM resources ['*'] → arn:aws:ssm:${region}:${account}:parameter/aintern/admin/*
  - Fix in infra/lib/admin-stack.ts op feature/board-2026-05-05 (nog te committen)
  - 3 LOWs geaccepteerd: lead-matcher Apollo contactEmail, useEditorialOutreach client-length, apiGwInvokeRole scope
- B-96 / S-12: al geïmplementeerd — bevestigd via locale-check

## Lopende Context
- Branch feature/board-2026-05-05: security fix infra/lib/admin-stack.ts
- Security rapport: .claude/cto/memory_security_check_2026-05-05.md
- Carry-over LOW: CORS-duplicatie workflow-scan.ts + linkedin-posts.ts (maintenance risk, geen security issue)
- npm audit: run zodra nieuwe dependency wordt toegevoegd aan lambda/package.json
