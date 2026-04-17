# Morgan — Daily Context
_Last updated: 2026-04-17_

## Open Acties (toegewezen aan mij)
- A-05 implementeren: spec klaar (product/sections/admin-article-form/spec.md) — na merge feature/board-2026-04-17
- A-18 implementeren: spec klaar (product/sections/admin-organisation/spec.md) — uitbreiding AdminOrganisationView.vue
- B-07 + B-10: CEO handmatige acties (niet CTO-taak)
- JWT/service-account voor A-14 KPI API inregelen — O-01 weekrapport kan dan live actuals ophalen (Blocker 3)

## KPI Status (week 16, 13–19 april)
- Security check: ✅ gedaan 2026-04-16 (week 16)
- B-24 ✅: sitemap.xml gefixed, sitemap:generate npm script toegevoegd
- B-25 ✅: A-05 spec geschreven met alle CEO-beslissingen
- B-27 ✅: A-18 spec geschreven, 34 agents geïnventariseerd

## Actieve Blockers
- JWT/service-account A-14 KPI API — weekrapport O-01 kan KPI actuals niet ophalen zonder auth token
- Branches 2026-04-15 en 2026-04-16 wachten op PR + merge door Bill voor verdere implementatie

## Genomen Beslissingen (board 2026-04-17 — goedgekeurd door Human Board)
- BUG-04 ✅: sitemap.xml regenereert nu correct; publish-flow update volgt bij A-05 implementatie
- A-05 spec ✅: TipTap (MIT free), Lambda sitemap op S3+Amplify, S3-only drafts, slug live-check+409
- A-18 spec ✅: emoji-iconen, Vue native drag (geen plugins), uitbreiding AdminOrganisationView.vue
- S-08 ✅: keyword-strategy.md geïmplementeerd (B-18) — backlog bijgewerkt
- S-09 nieuw: Search Console koppeling per artikel — apart backlog-item

## Lopende Context
- Branch feature/board-2026-04-17: 4 commits klaar voor PR + merge
- Implementatievolgorde na merge: A-05 → A-18 → O-02 (afhankelijk van COO prio)
- O-02 spec klaar (B-26): DynamoDB (aintern-admin tabel), Vue native D&D, deadline 30 april
- A-05 open implementatievragen: Amplify rewrite rules voor sitemap.xml verifiëren; Lambda IAM role PutObject permissie controleren
