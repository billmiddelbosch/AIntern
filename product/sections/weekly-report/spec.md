# O-01 — Weekly Auto-Report

**Backlog ID:** O-01 (delivered via B-11)
**Owner:** COO
**Effort:** S (scope) → M (implementation)
**Depends on:** A-14 (DynamoDB KPI actuals endpoints — already implemented)
**Status:** Scope defined — pending CEO approval on open questions below

---

## Goal

Generate a concise weekly internal report that gives the CEO a single-glance view of pipeline
health, project status, open blockers, and KPI progress — ready for the Monday standup without
manual collation.

## Audience

| Consumer | Use case |
|---|---|
| CEO (Bill) | Monday standup preparation — 5-minute read |
| COO | Weekly ops review — confirm all sections are complete |
| Board (async) | Optional read — emailed version |

---

## Data Sources

| Section | Source | How to read |
|---|---|---|
| **Lead pipeline** | `product/marketing/leads/outreach-log.csv` | Parse CSV — count by `status` column (`pending_connection`, `connection_sent`, `dm_sent`, `responded`, `converted`). Weekly delta = rows where `connection_sent_at` or `dm_sent_at` falls in current ISO week. |
| **KPI actuals** | A-14 Lambda `GET /admin/kpi/actuals?week={isoWeek}` | Fetch all actuals for the current ISO week. Compare against targets from OKR memory. Flag metrics below target. |
| **Backlog status** | `product/backlog.md` | Parse markdown table — extract ID, title, status column. Summarise: done this week, in-progress, todo. Highlight items shipped (rows with a date in current ISO week). |
| **Open blockers** | Agent memory files: `C:/Users/bmidd/.claude/projects/C--Users-bmidd-AIntern/memory/*.md` | Scan for project memories containing "blocker", "blocked", "risico", "escalatie", or "open question". Surface file name + relevant line. |
| **Kennisbank articles** | S3 `aintern-kennisbank` (via A-13 integration endpoint) or KPI actual `cpo.1` / `kr3.3` | Articles published this week + running quarterly total. |
| **LinkedIn post count** | KPI actual `cmo.1` (LinkedIn posts this week) via A-14 | Weekly post count vs target of 3/week. |

---

## Report Format

### Primary: Markdown

A single `.md` file rendered in Obsidian. Structure is defined in `template.md`.

### Optional: HTML email version

A styled HTML wrapper around the same content — suitable for sending to `w.middelbosch@gmail.com`
via the existing Gmail MCP tool (`mcp__claude_ai_Gmail__gmail_create_draft`).

Styling: inline CSS only (email clients strip `<style>` blocks). Use a clean table-based layout
with AIntern brand colours (to be defined; default: `#1e293b` header, `#f8fafc` background).

---

## Trigger

| Mode | Details |
|---|---|
| **Manual (now)** | Run `claude -p "Generate weekly report for week {ISO}"` inside the AIntern project root. The skill/agent reads the data sources listed above and writes the output file. |
| **Scheduled (future — O-01 v2)** | Monday 07:00 CET via a CronCreate trigger. Depends on all data sources being reliably machine-readable. |

---

## Output Destination

| Destination | Path / Address | Condition |
|---|---|---|
| Obsidian vault | `C:/Users/bmidd/OneDrive/Documents/Obsidian Vault/Bill/AIntern Meeting Minutes/weekrapport-{YYYY-WNN}.md` | Always |
| Email draft | Gmail draft to `w.middelbosch@gmail.com` — subject: `AIntern Weekrapport W{NN} — {datum}` | When `--email` flag is set or CEO requests it |

---

## Dependencies

| Dependency | Status | Notes |
|---|---|---|
| A-14 DynamoDB + Lambda KPI endpoints | ✅ Implemented | `GET /admin/kpi/actuals?week={isoWeek}` |
| `outreach-log.csv` | ✅ Live | `product/marketing/leads/outreach-log.csv` — updated after each outreach run |
| Agent memory files | ✅ Live | `C:/Users/bmidd/.claude/projects/C--Users-bmidd-AIntern/memory/*.md` |
| S3 Kennisbank article count | ✅ Live (via A-13) | Surfaced as KPI actuals `cpo.1` and `kr3.3` |
| LinkedIn post count | ⚠️ Manual | KPI actual `cmo.1` is manually entered in the dashboard; no automated LinkedIn API integration yet |
| Backlog parser | ✅ Feasible | `product/backlog.md` is plain markdown — parseable with regex |

---

## Implementation Plan (for O-01 v1)

1. **Skill: `weekly-report`** — a Claude Code skill that:
   a. Reads all data sources listed above
   b. Hydrates the `template.md` placeholders with real values
   c. Writes the filled report to the Obsidian vault path
   d. Optionally creates a Gmail draft

2. **No new Lambda or frontend required for v1** — all reads happen locally (CSV, markdown files,
   memory files) or via the existing A-14 API. The skill runs on the developer machine.

3. **v2 (scheduled)** — wrap the skill in a `CronCreate` trigger for Monday 07:00 CET.

---

## Acceptance Criteria

- [ ] Running the skill produces a complete `.md` file in the Obsidian vault
- [ ] All 6 sections (pipeline, KPIs, backlog, blockers, Kennisbank, LinkedIn) are populated
- [ ] Metrics below target are flagged with a warning indicator
- [ ] File is named `weekrapport-{YYYY-WNN}.md` (e.g. `weekrapport-2026-W16.md`)
- [ ] Skill runs without manual data entry — only the ISO week number is required as input
- [ ] Optional `--email` flag creates a Gmail draft (not auto-sent — human sends)

---

## Out of Scope (v1)

- Automated LinkedIn post count (no LinkedIn API) — manually supplied via KPI dashboard
- Google Analytics traffic data (GA4 API credentials not set up for skill context)
- PDF export
- Auto-send of email (draft only — CEO sends manually, consistent with outreach approval gate)
- Multi-language (Dutch only for v1)

---

## Open Questions — CEO Approval Needed

| # | Question | Context | Default if no answer |
|---|---|---|---|
| Q1 | Which day should the scheduled trigger fire? Monday before standup. What time? | Standup is not yet at a fixed time | 07:00 CET Monday |
| Q2 | Should the report include a "wins of the week" section (free-text, manually added)? | Would make the report more human but requires manual input | No — fully automated v1 |
| Q3 | Should the email be sent automatically or remain a draft? | Approval gate principle suggests draft only | Draft only |
| Q4 | Should blockers from agent memory be included verbatim or summarised by Claude? | Verbatim is auditable; summary is faster to read | Summarised (1 sentence per blocker) |
| Q5 | Should historical weekly reports be tracked in a separate index file in Obsidian? | Would enable week-over-week comparison | No index in v1; filenames are self-indexing |
