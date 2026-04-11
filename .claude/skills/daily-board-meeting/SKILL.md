---
name: daily-board-meeting
description: This skill should be used when the user asks to "start the daily board meeting", "run the morning standup", "kick off the daily briefing", "start the C-suite discussion", "begin the board meeting", "start the daily sync", or "run the daily AIntern meeting". Orchestrates a structured daily session between CEO (Alex), CMO (Blake), CTO (Morgan), and COO (Sam) to align on the day's priorities, generate LinkedIn outreach proposals, create Kennisbank content from Obsidian, produce a meeting summary saved to Obsidian and emailed to Bill, update each board member's memory, and improve the skill itself at the end.
version: 0.2.6
---

# Daily Board Meeting

A structured daily session that runs the AIntern C-suite through seven phases: context loading, executive discussion, LinkedIn outreach proposals, Kennisbank content proposals, meeting summary, board memory update, and skill improvement.

**Execution model:** Run all phases fully automatically without stopping. Collect every item that requires a human decision into a single **End-of-Meeting Approval Gate** presented at the very end. The only exception is a hard blocker (e.g., missing file, auth error) — surface it inline and continue with the remaining phases.

---

## Phase 1 — Context & Agenda (Opening)

Load context before starting the discussion:

**Step 0 — CTO creates the session feature branch (runs first, before anything else):**

Run directly in the main session (no separate terminal needed — this is a safe, non-destructive git operation):
```bash
git checkout -b feature/board-{YYYY-MM-DD} 2>/dev/null || git checkout feature/board-{YYYY-MM-DD}
```
The branch name uses today's date (e.g., `feature/board-2026-04-11`). Alex (CEO) records this branch name — **all subsequent agent actions during this meeting must be executed on this branch**. If the branch already exists (repeat run), the `||` fallback checks it out instead of recreating it.

1. Read OKRs from memory: `C:/Users/bmidd/.claude/projects/C--Users-bmidd-AIntern/memory/project_okrs_q2_2026.md`
2. Read CMO memory index and pending items:
   - `.claude/cmo/MEMORY.md`
   - `.claude/cmo/memory_outreach_dm_pending.md` — check for accepted connections awaiting manual DMs
3. Read CTO blockers explicitly:
   - `.claude/cto/memory_apify_credits_low.md` — flag if credits < $1
4. Read `product/backlog.md` — identify the first non-completed item per section (Landing Page, Admin, Organisation). These are the top 3 for today's discussion.

Then open the meeting in this format:

```
## AIntern Dagelijkse Boardvergadering — {datum}

**Aanwezig:** Alex (CEO), Blake (CMO), Morgan (CTO), Sam (COO)
**Voorzitter:** Alex (CEO)

**Actieve blockers:**
- [Lijst blockers uit CTO/CMO memory — bijv. "Apify credits uitgeput ($0.07)" of "3 DMs wachten op handmatig verzenden"]
- Geen (als er geen blockers zijn)

**Agenda van vandaag:**
1. Directiebespreking — prioriteiten van de dag
2. LinkedIn outreach voorstellen
3. Kennisbank content voorstellen
4. Vergaderverslag + e-mail
5. Skill verbeterreview
```

---

## Agent Execution Model — Branch-Scoped Claude Terminals

Every action performed by any C-suite agent (CEO, CMO, CTO, COO) that writes files, commits code, publishes content, or calls external tools **must be executed in a dedicated new Claude terminal**, not inline in the main meeting session.

### How to open an agent terminal

Use the `claude` CLI with a self-contained prompt:
```
claude -p "<agent task here>"
```

The prompt passed to each terminal **must**:
1. Start with: `"You are working on branch feature/board-{YYYY-MM-DD}. Verify you are on this branch (git status) before making any changes. If not, run: git checkout feature/board-{YYYY-MM-DD}."`
2. Describe the specific action to take
3. End with: `"When done, commit all changes to branch feature/board-{YYYY-MM-DD} with a descriptive commit message, then output a terminal summary in this format:\n\n**Terminal Summary — [Agent] [Action]**\n- Branch: feature/board-{YYYY-MM-DD}\n- Files changed: [list]\n- Commit: [message]\n- Status: ✅ Done / ❌ Failed ([reason])"`

### CEO branch oversight

Alex (CEO) is responsible for branch integrity and backlog governance throughout the meeting:

- **Before each terminal is dispatched:** confirm (1) the branch name in the prompt matches `feature/board-{YYYY-MM-DD}` and (2) the corresponding backlog item exists and has status `todo` or `in-progress` — if the backlog item is missing, instruct the backlog manager to add it first and wait for confirmation before opening the terminal
- **After each terminal completes:** read the Terminal Summary and verify Status is ✅. If ❌, surface a `[BLOCKER]` inline and hold subsequent terminals until resolved
- **Before the End-of-Meeting Approval Gate:** run a final check — `git log feature/board-{YYYY-MM-DD} --oneline` — and include the full commit list in the gate summary under "Branch Commits"
- **Merge conflict prevention:** each terminal must pull the latest branch state (`git pull origin feature/board-{YYYY-MM-DD} --rebase`) at the start before making changes. Terminals are dispatched **sequentially**, not in parallel, to avoid write conflicts

---

## Phase 2 — C-Suite Discussion (3-Round Debate)

Run a structured 3-round discussion modeled on the marketing-super-team debate format. Each executive speaks in character using their real name, role, and domain expertise.

**Personas:**
- **Alex (CEO)** — strategy, cross-functional alignment, board priorities, OKRs
- **Blake (CMO)** — lead generation, content, LinkedIn campaigns, Kennisbank, outreach ROI
- **Morgan (CTO)** — product velocity, technical blockers, infra, backlog feasibility
- **Sam (COO)** — operations, lead pipeline health, client onboarding readiness, weekly report status

### Round 1 — Domain Priorities

Each executive states their **top 2 priorities for today**, anchored to the current OKRs and backlog. Format:

```
**Alex (CEO):**
1. [Priority] — [why it matters today]
2. [Priority] — [why it matters today]

**Blake (CMO):**
1. [Priority] — [why it matters today]
2. [Priority] — [why it matters today]

**Morgan (CTO):**
1. [Priority] — [why it matters today]
2. [Priority] — [why it matters today]

**Sam (COO):**
1. [Priority] — [why it matters today]
2. [Priority] — [why it matters today]
```

### Round 2 — Cross-Examination

Each executive reacts to one priority from another exec. Surface dependencies, conflicts, and risks. Keep it direct. Example structure:

```
**Blake challenges Alex:** [disagreement or dependency]
**Morgan challenges Blake:** [feasibility or sequencing concern]
**Alex responds:** [resolution or decision]
```

### Round 3 — Synthesis

**Step A — KPI Pulse.** Before setting actions, check this week's progress against weekly targets (from OKRs memory). Use actual numbers where available:
- **Connection count:** count `connection_sent` rows added this week in `product/marketing/leads/outreach-log.csv`
- **Kennisbank article count:** check `.claude/cmo/memory_daily_context.md` (if already updated) or CMO MEMORY.md
- **LinkedIn post count:** check `.claude/cmo/memory_daily_context.md` — if not tracked, use `0 (niet getrackt — handmatige check vereist)` as fallback
- **CEO prospect outreach / discovery calls:** check `.claude/ceo/memory_daily_context.md` — if not tracked, use `0 (niet getrackt — handmatige check vereist)` as fallback
- **Website traffic / uptime (CPO):** check `.claude/cto/memory_daily_context.md` for uptime and `.claude/cmo/memory_daily_context.md` for traffic — if not tracked, use `0 (niet getrackt — handmatige check vereist)` as fallback

```
| Exec    | KPI                             | Target/week | Actual (est.) | Status       |
|---------|---------------------------------|-------------|---------------|--------------|
| CEO     | Prospect outreach verstuurd     | ≥ 1         | [N]           | ✅ / ❌       |
| CEO     | Discovery call gevoerd/gepland  | ≥ 0,5       | [N]           | ✅ / ❌       |
| CMO     | LinkedIn posts                  | 3           | [N]           | ✅ / ⚠️ / ❌ |
| CMO     | New connection requests sent    | 20–25       | [N]           | ✅ / ⚠️ / ❌ |
| CMO     | Kennisbank articles             | 2           | [N]           | ✅ / ⚠️ / ❌ |
| CPO/CTO | Website traffic check gedaan    | 1×          | [Y/N]         | ✅ / ❌       |
| CPO/CTO | Uptime check gedaan             | 1×          | [Y/N]         | ✅ / ❌       |
| CTO     | Security check done             | 1           | [Y/N]         | ✅ / ❌       |
| COO     | Lead pipeline updated           | 2×          | [N]           | ✅ / ⚠️ / ❌ |
```

**Step B — Top 5 Daily Actions** — agreed by the group, ordered by impact on the highest off-track OKR metric:

```
| # | Action | Owner | Success Metric |
|---|--------|-------|----------------|
| 1 | ...    | CMO   | ...            |
| 2 | ...    | CTO   | ...            |
...
```

**Step C — Backlog Registration (runs immediately after the Top 5 table is finalized, before any phase begins):**

Alex (CEO) instructs the `backlog-manager` skill to log every Top 5 action as a backlog item. Each item is registered with:
- **Title:** [action from the table]
- **Owner:** [assigned exec]
- **Status:** `todo`
- **Source:** `board-meeting-{YYYY-MM-DD}`
- **Success Metric:** [from the table]

The backlog manager confirms each item before writing (per its own rules). Alex waits for confirmation of all 5 items before proceeding to Phase 3. No agent terminal may be dispatched for an action that is not yet logged in the backlog.

```
**Alex (CEO) — Backlog Registratie:**
Ik instrueer de backlog manager om de volgende 5 acties te registreren vóór wij beginnen:
1. [actie 1] — [eigenaar] — [succescriterium]
2. [actie 2] — [eigenaar] — [succescriterium]
...
[Wacht op bevestiging van backlog manager]
```

---

## Phase 3 — LinkedIn Outreach Proposals

Blake (CMO) leads this phase with support from the `marketing-super-team` and `social-content` skills.

### Pre-flight Check

Before drafting any messages, evaluate the outreach state using context already loaded in Phase 1:

| Check | Bron | Resultaat |
|-------|------|-----------|
| Apify credits voldoende? | `memory_apify_credits_low.md` | OK / **Uitgeput (<$1)** |
| Pending DMs (handmatig)? | `memory_outreach_dm_pending.md` | [N namen] |
| CSV heeft LinkedIn URLs? | `references/outreach-format.md` | Ja / **Nee — enrichment nodig** |

**Blocked-outreach beslisboom:**

- Als Apify credits < $1 → skip nieuwe lead-enrichment; werk alleen met al verrijkte leads
- Als er pending DMs zijn (uit `memory_outreach_dm_pending.md`) → prioritiseer deze boven nieuwe verzoeken; DMs worden handmatig verstuurd na approval
- Als alles geblokkeerd → presenteer een actie-lijst en ga direct naar Phase 4:
  ```
  ### Outreach — GEBLOKKEERD
  Actie vereist voor volgende run:
  1. Apify credits bijvullen: https://console.apify.com/billing/subscription
  2. Handmatig te versturen DMs: [lijst uit memory_outreach_dm_pending.md]
  ```

### Steps

1. Read `product/marketing/leads/` — identify 3–5 uncontacted leads with LinkedIn URLs
2. Load the `marketing-super-team` skill to evaluate the outreach angle for today's batch
3. For each lead, draft a connection request message using the approved template (see `references/outreach-format.md`)
4. Apply the `social-content` skill to check hook quality and adjust if needed
5. Store the proposed messages internally — they will be presented at the **End-of-Meeting Approval Gate**. Do **not** pause here.
6. **Do not send anything until the End-of-Meeting Approval Gate is reached.** After approval there, delegate to the `linkedin-outreach` agent with the approved message list.

---

## Phase 4 — Kennisbank Content Proposals

Blake (CMO) leads this phase. Source inspiration from Bill's Obsidian vault, then use `marketing-super-team` to shape the angle.

### Pre-flight Check — Skip Conditions

Before running this phase, evaluate two skip conditions:

**Skip condition 1 — Target already met:**
Check the KPI Pulse table from Phase 2 Round 3. If the Kennisbank articles KPI is already ✅ (at or above the weekly target of 2), **skip this phase entirely** — content proposals are not needed this week. Mention this briefly: `_Phase 4 overgeslagen — Kennisbank weekdoel al behaald._`

**Skip condition 2 — Already posted today:**
Check `.claude/cmo/memory_daily_context.md` for a Kennisbank article published on today's date. If one was already published today, **skip this phase entirely**. Mention: `_Phase 4 overgeslagen — Kennisbank artikel al gepubliceerd vandaag._`

> **⚠️ Tracking gap warning:** `memory_daily_context.md` is only updated at the end of each meeting (Phase 6). If a post or article was published outside a meeting session (e.g., manually by Bill), the file may be stale. If the Human Board reports that content was already published and the memory shows zero, immediately update `memory_daily_context.md` to reflect the correct count before continuing.

Only proceed with the steps below if **both** skip conditions are false.

### Steps

1. Read the 3 most recent entries from the Obsidian vault (see `references/obsidian-vault.md` for vault location and structure)
2. Identify 1–2 topic seeds relevant to the AIntern audience (Lightspeed webshop owners, MKB, AI automation)
2b. **Rejected seed filter:** Before selecting seeds, check the "Genomen Beslissingen" section of `.claude/cmo/memory_daily_context.md`. Skip any Obsidian entry whose topic matches a Kennisbank proposal that was rejected in the same or previous session. Move to the next most recent entry instead.

3. Load `marketing-super-team` skill — run a **Quick Audit** on each seed: is this the right angle for the target audience?

> **⚠️ Plan mode risk:** Invoking `marketing-super-team` may trigger plan mode. If plan mode activates mid-meeting, immediately write a one-line note to the plan file at `C:\Users\bmidd\.claude\plans\<plan-id>.md` and call `ExitPlanMode` before continuing. Do not attempt to resume the meeting inside plan mode.
4. Draft proposals internally — they will be presented at the **End-of-Meeting Approval Gate**. Use this format for the gate:

```
### Kennisbank Content Proposals

**Proposal 1:**
- Title: [Dutch title]
- Category: [valid category — see references/kennisbank-publishing.md]
- Angle: [1 sentence — what pain it addresses]
- Outline:
  1. [Section 1]
  2. [Section 2]
  3. [Section 3]

**Proposal 2:** ...
```

Do **not** pause here. Continue directly to Phase 5.

5. For each approved proposal (after End-of-Meeting gate): write the full article (Dutch, HTML, 400–700 words), format as JSON, and publish to S3 following the steps in `references/kennisbank-publishing.md`.

---

## Phase 5 — Meeting Summary

Compile a concise management summary covering all phases.

### Summary format

```markdown
# AIntern Boardvergadering — {datum}

## Aanwezig
Alex (CEO), Blake (CMO), Morgan (CTO), Sam (COO)

## Top 5 Dagelijkse Acties
| # | Actie | Eigenaar | Succescriterium |
|---|-------|----------|-----------------|
...

## LinkedIn Outreach
- Leads voorgesteld: N
- Status: [goedgekeurd / in behandeling / verstuurd]
- Berichten: [lijst]

## Kennisbank Content
- Voorstellen: [titels]
- Status: [goedgekeurd / gepubliceerd / in behandeling]

## Open Punten & Blockers
- [Lijst]

## Volgende Vergadering
{datum van morgen}
```

### Save to Obsidian

Save the summary as `{YYYY-MM-DD} AIntern Boardvergadering.md` to:
```
C:/Users/bmidd/OneDrive/Documents/Obsidian Vault/Bill/Aintern Meeting Minutes/
```

Create the folder if it does not exist.

### Email the summary

Send the summary to `w.middelbosch@gmail.com` using **Zapier MCP** (`mcp__claude_ai_Zapier__gmail_send_email`) — this sends immediately. Subject: `AIntern Boardvergadering — {datum}`. Body: HTML. Fallback: `mcp__claude_ai_Gmail__gmail_create_draft` creates a draft only.

---

## Phase 6 — Board Memory Update (After Approval Gate)

After receiving the Human Board's response at the End-of-Meeting Approval Gate, update each executive's memory directory. **This phase runs after the human's approval/rejection — not before.** Include the human's decisions (what was approved, rejected, or modified) in the relevant memory files.

### Memory locations

| Executive | Directory |
|-----------|-----------|
| Alex (CEO) | `.claude/ceo/` |
| Blake (CMO) | `.claude/cmo/` |
| Morgan (CTO) | `.claude/cto/` |
| Sam (COO) | `.claude/coo/` |

### What to write per executive

For each executive, upsert the file `{dir}/memory_daily_context.md` using this structure:

```markdown
# [Name] — Daily Context
_Last updated: {YYYY-MM-DD}_

## Open Acties (toegewezen aan mij)
- [Actie uit Top 5 Daily Actions die aan deze exec is toegewezen]

## KPI Status (deze week)
- [KPI]: [Actual] / [Target] — [status]

## Actieve Blockers
- [Blocker die relevant is voor deze exec — of "Geen"]

## Genomen Beslissingen (vandaag)
- [Beslissingen uit Round 2/3 die deze exec raken]

## Lopende Context
- [Andere relevante context — bijv. pending DMs, Kennisbank artikel in behandeling, backlog item in scope]
```

**Write rules:**
- Always overwrite the full file — do not append
- Only include information relevant to that executive's domain
- CMO: include outreach batch status (approved/rejected/modified by Human Board), pending DMs, Kennisbank proposal status (approved/rejected)
- CTO: include backlog items in scope, any tech blocker status changes
- COO: include pipeline health status, onboarding checklist state
- CEO: include the Top 5 Daily Actions list, any cross-functional decisions, and Human Board feedback
- Always note which items were approved, rejected, or modified by the Human Board — this is the ground truth for the next meeting

---

## Phase 7 — Skill Improvement

At the end of every meeting, review the session and propose improvements to this skill.

### Steps

1. Identify 2–3 specific friction points from today's meeting:
   - Instructions that were unclear
   - Steps that took longer than expected
   - Information that was missing and had to be fetched ad hoc
   - Outputs that didn't match the expected format

2. Store improvement proposals for the **End-of-Meeting Approval Gate** in this format:

```
### Skill Verbetervoorstellen

**Verbetering 1:** [wat te wijzigen]
- Locatie: SKILL.md / references/[bestand]
- Voorgestelde wijziging: [specifieke aanpassing]
- Reden: [welke frictie het wegneemt]

**Verbetering 2:** ...
```

Do **not** pause here. Present these at the End-of-Meeting Approval Gate.

3. On approval: edit this `SKILL.md` or the relevant `references/` file directly. Increment the version number in frontmatter (patch bump: 0.1.0 → 0.1.1).

---

## End-of-Meeting Approval Gate

After completing all seven phases automatically, present **one consolidated approval prompt** to the Human Board:

```
---
## Einde Vergadering — Goedkeuring Vereist

De vergadering is voltooid. Onderstaande items vereisen jouw beslissing:

### A) Backlog — User Stories voor deze vergadering
[Lijst van alle backlog items geregistreerd in Phase 2 Step C, met hun huidige status]

| # | User Story | Eigenaar | Status |
|---|-----------|----------|--------|
| 1 | [actie]   | [exec]   | todo / in-progress / done |
...

→ Antwoord "backlog goedgekeurd" om uitgevoerde items als `done` te markeren, of geef per item feedback.

### B) LinkedIn Outreach
[Herhaal alle voorgestelde berichten uit Phase 3]
→ Antwoord "linkedin goedgekeurd" om te versturen, of geef feedback per lead.

### C) Kennisbank Content
[Herhaal alle voorgestelde artikelen uit Phase 4]
→ Antwoord "kennisbank [1]" en/of "kennisbank [2]" om te publiceren.

### D) Skill Verbeteringen
[Herhaal verbetervoorstellen uit Phase 7]
→ Antwoord "skill goedgekeurd" om de skill bij te werken, of "overslaan".

### E) Branch Commits
[Lijst van alle commits op feature/board-{YYYY-MM-DD} — output van `git log feature/board-{YYYY-MM-DD} --oneline`]
→ Na goedkeuring: branch blijft open voor handmatige review + merge via PR.

### F) Samenvatting
- Opgeslagen in Obsidian: ✅
- E-mail verstuurd: ✅ / (Draft aangemaakt — stuur handmatig)
- Board memory: wordt bijgewerkt ná jouw reactie hieronder

Reageer met een of meerdere van de bovenstaande commando's, of "alles goedgekeurd" voor alles.
---
```

After receiving approval responses:
1. **Backlog update (first):** For every approved item, the `backlog-manager` skill updates the backlog — set status to `done` for completed actions, `in-progress` for started-but-unfinished, and add a note with today's date and the Terminal Summary commit message. For rejected items, set status back to `todo`. The backlog manager confirms each change before writing (per its own rules).
2. Execute the remaining approved actions (send LinkedIn messages, publish Kennisbank articles, update SKILL.md)
3. **Then** run Phase 6 — update board memory files, incorporating the human's decisions (what was approved, rejected, and any modifications made)

---

## Execution Rules

- **Run all phases automatically** — do not pause mid-meeting for approvals
- **Single approval gate** — collect all human decisions and present them at the very end
- **Never auto-send** LinkedIn messages or emails — only send after explicit End-of-Meeting approval
- **Board memory is written after the approval gate** — Phase 6 runs only after the Human Board responds; include their decisions in the memory files
- **Stay in character** — each executive speaks in their own voice throughout
- **Cite OKRs** — anchor every priority to a Q2 OKR metric
- **Alles in het Nederlands** — vergadering, discussie, samenvatting, outreach en Kennisbank content zijn allemaal in het Nederlands
- **Hard blocker exception** — if a phase encounters a fatal error (missing file, auth failure), surface it inline with a `[BLOCKER]` tag and continue with remaining phases; include it in the End-of-Meeting gate
- **Feature branch required** — CTO creates `feature/board-{YYYY-MM-DD}` in Phase 1 Step 0; no agent may write, commit, or publish outside this branch
- **One terminal per backlog item** — each `claude -p "..."` terminal covers exactly one backlog item end-to-end. Never combine multiple backlog items in one terminal. Every terminal prompt must include the instruction: "Complete all steps inline — do not spawn sub-agents or additional terminals." If a backlog item is too large, split it into smaller items and get Human Board approval before dispatching
- **Sequential dispatch** — terminals are dispatched one at a time; the next terminal only starts after the previous Terminal Summary shows ✅
- **CEO gate on each terminal** — Alex (CEO) verifies the branch name in every terminal prompt before dispatch and reads the Terminal Summary on return; a ❌ status halts further terminals until resolved
- **Merge conflict prevention** — every terminal starts with `git pull origin feature/board-{YYYY-MM-DD} --rebase` before making changes
- **Backlog-first** — every action must be logged in `product/backlog.md` by the `backlog-manager` skill before its terminal is opened; CEO enforces this gate on every dispatch
- **Backlog update after approval** — the `backlog-manager` is the first thing called after the human's approval response; it updates item statuses before any other post-approval action runs

---

## Additional Resources

### Reference Files

- **`references/meeting-format.md`** — Detailed debate techniques, persona voice guides, and example exchanges
- **`references/obsidian-vault.md`** — Vault location, folder structure, and how to extract topic seeds
- **`references/kennisbank-publishing.md`** — Full S3 publish workflow, JSON schemas, valid categories, and AWS commands
- **`references/outreach-format.md`** — Approved LinkedIn connection message templates and character-count rules

### Zapier MCP Actions

- **`mcp__claude_ai_Zapier__gmail_send_email`** — Send meeting summary email directly (no draft step)
- **`mcp__claude_ai_Zapier__linkedin_create_company_update`** — Post to AIntern brand page (company_id pre-set); use after publishing new Kennisbank articles or key announcements. **Only trigger if the LinkedIn posts KPI is not yet ✅ for the week** — do not post if the weekly target is already met.
- **`mcp__claude_ai_Zapier__linkedin_create_share_update`** — Post to Bill's personal LinkedIn feed (visibility: public)

### External Skills

- **`marketing-super-team`** — Used in Phase 2 (debate structure), Phase 3 (outreach angle), Phase 4 (content angle audit)
- **`social-content`** — Used in Phase 3 to check hook quality
- **`outreach`** — Used after Phase 3 approval to execute the LinkedIn sequence

### Agents

- **`linkedin-outreach`** — Handles the actual sending after Phase 3 approval
- **`cmo`** (Blake) — Leads Phases 3 and 4
- **`ceo`** (Alex) — Chairs Phases 1 and 2, synthesises Round 3
- **`cto`** (Morgan) — Leads technical inputs in Phase 2
- **`coo`** (Sam) — Ops priorities in Phase 2: pipeline health, onboarding checklist, weekly report status
