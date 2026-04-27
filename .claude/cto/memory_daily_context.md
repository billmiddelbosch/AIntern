# Lars — Daily Context
_Last updated: 2026-04-27_

## Open Acties (toegewezen aan mij)
- B-61: AI MKB Groei Systeem Stap 2 Insight Extractie — volgende prioriteit
- B-64: L-13 Portfolio/Animations (ITGuru als bron) — nog todo

## KPI Status (week 18 start — 27 april)
- Security check: ✅ B-47 PASS 2026-04-25 (vorige week)
- Build: ✅ npm run build slaagt (B-80 gebouwd)
- Rate limiting B-77: ✅ workflowScanThrottle 10 rps/burst 20 in admin-stack.ts

## Actieve Blockers
- JWT/service-account A-14 KPI API — weekrapport O-01 kan KPI actuals niet ophalen (laag prio)
- Commits B-80 pending — wacht op Human Board goedkeuring voor feature/board-2026-04-27

## Genomen Beslissingen (board 2026-04-27)
- B-80 ✅ O-03 Client Onboarding Checklist: lambda/src/onboarding.ts + aintern-onboarding DynamoDB + Vue routes /admin/onboarding + i18n — build pass
- B-77 ✅ Rate limiting /workflow-scan: workflowScanThrottle in admin-stack.ts (geïmplementeerd samen met B-80)
- B-78 ✅ Weekrapport week 17 aangemaakt inline (terminal backgrounded)
- SKILL.md verbeterd met 5 fixes: #7 Obsidian recursief, #8 weekrapport pre-check, #9 0-bytes fallback, ghostwriter DynamoDB-check, kennisbank index-integriteit

## Lopende Context
- Branch: feature/board-2026-04-27 (commits pending)
- Ghostwriter DynamoDB status (2026-04-27 geverifieerd):
  - ep01: goedgekeurd DynamoDB (serie: Het Aintern experiment)
  - ep02: goedgekeurd DynamoDB (serie: Het Aintern Experiment)
  - ep03/ep04: NIET in DynamoDB — alleen lokale .md files
  - **Verwijder stale DynamoDB IDs uit memory**: ep01 d215d623 / ep02 84a8b02c / ep03 15e4536c / ep04 3bbcab6e zijn NIET de correcte IDs — queries zijn de enige betrouwbare bron
- AI MKB Groei Systeem: Stap 1 Signaaldetectie ✅ (B-76) → Stap 2 B-61 volgende
