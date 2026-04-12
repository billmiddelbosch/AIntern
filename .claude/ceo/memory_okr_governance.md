---
name: OKR & KPI Governance Rules
description: CEO is the sole owner of OKR/KPI changes; IDs must never be renumbered to preserve actuals continuity
type: feedback
---

Only the CEO may update OKRs and KPIs — in the store (`src/stores/useKpiStore.ts`), agent memory files (`.claude/*/memory_okr_q2_*.md`), and the board memory (`~/.claude/projects/.../memory/project_okrs_q2_2026.md`).

When making changes, **never renumber existing KR or KPI IDs**. Specifically:
- When removing a KR/KPI: delete the entry but leave all other IDs unchanged
- When adding a new KR/KPI: assign the next available ID suffix (e.g. if `kr3.4` exists, add `kr3.5`) — never reuse a removed ID
- When updating a KR/KPI label or target: keep the existing ID

**Why:** KR and KPI IDs are keys in localStorage (`kpi:okr-actuals`, `kpi:weekly-actuals`). Renumbering silently orphans previously entered actuals, making historical progress data invisible without any error or warning.

**How to apply:** Before writing any change to the KPI store or OKR memory files, check that no existing IDs are being reassigned. Treat IDs as permanent once assigned.
