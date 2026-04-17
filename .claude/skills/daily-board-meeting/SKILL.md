---
name: daily-board-meeting
description: This skill should be used when the user asks to "start the daily board meeting", "run the morning standup", "kick off the daily briefing", "start the C-suite discussion", "begin the board meeting", "start the daily sync", or "run the daily AIntern meeting". Orchestrates a structured daily session between CEO (Alex), CMO (Blake), CTO (Morgan), and COO (Sam) to align on the day's priorities, generate LinkedIn outreach proposals, create Kennisbank content from Obsidian, produce a meeting summary saved to Obsidian and emailed to Bill, update each board member's memory, and improve the skill itself at the end.
version: 0.3.4
---

# Daily Board Meeting

A structured daily session that runs the AIntern C-suite through seven phases: context loading, executive discussion, LinkedIn outreach proposals, Kennisbank content proposals, meeting summary, board memory update, and skill improvement.

**Execution model:** Run all phases fully automatically without stopping. **Internal actions execute immediately** (backlog updates, board memory files, SKILL.md, Obsidian meeting minutes, summary email to Bill) — no approval needed. **Everything that becomes externally visible always requires explicit Human Board approval** before execution: Kennisbank articles, LinkedIn brand posts, LinkedIn personal posts, LinkedIn connection requests, LinkedIn DMs, and any external emails to prospects. Present a single End-of-Meeting Approval Gate for all external items. Hard blockers (missing file, auth error) are surfaced inline and the remaining phases continue.

---

## Phase 1 — Context & Agenda (Opening)

Load context before starting the discussion:

**Step 0 — CTO creates the session feature branch (runs first, before anything else):**

Run directly in the main session (no separate terminal needed — this is a safe, non-destructive git operation):
```bash
git checkout -b feature/board-{YYYY-MM-DD} 2>/dev/null || git checkout feature/board-{YYYY-MM-DD}
git branch --show-current
```
The branch name uses today's date (e.g., `feature/board-2026-04-11`). Alex (CEO) records this branch name — **all subsequent agent actions during this meeting must be executed on this branch**. If the branch already exists (repeat run), the `||` fallback checks it out instead of recreating it. The `git branch --show-current` call confirms the active branch explicitly in the output.

**Step 0.1 — CTO runs project health check:**

```bash
sheal check
```
Surface any warnings inline as `[HEALTH]` tags before continuing. A clean check proceeds silently. If `sheal` is not installed, skip and note it as a blocker.

**Sitemap vs S3 check (runs as part of Step 0.1):** Compare the number of Kennisbank articles in S3 against entries in `public/sitemap.xml`. Run:
```bash
aws s3 ls s3://aintern-kennisbank/posts/ | grep -c '\.json$'
grep -c '<loc>.*kennisbank/' public/sitemap.xml
```
If the S3 count exceeds the sitemap count, surface immediately as `[HEALTH] Sitemap verouderd — N artikelen in S3, M in sitemap. Run: npm run sitemap:generate`. Skip if AWS credentials are not available in the current session (note as `[HEALTH: sitemap check overgeslagen — geen AWS credentials]`).

**Step 0.2 — CTO loads weekly activity digest:**

```bash
sheal digest --since "7 days"
```
Use the digest output as context for Phase 2 (which areas got the most work, what was skipped, recurring patterns). Paste a 3-bullet summary into the agenda under a new `**Weekoverzicht:**` line before the blockers block.

1. Read OKRs from memory: `C:/Users/bmidd/.claude/projects/C--Users-bmidd-AIntern/memory/project_okrs_q2_2026.md`
2. Read CMO memory index and pending items:
   - `.claude/cmo/MEMORY.md`
   - `.claude/cmo/memory_outreach_dm_pending.md` — check for accepted connections awaiting manual DMs
   - **Index freshness check:** Compare the CMO MEMORY.md index entry for `memory_outreach_dm_pending.md` against the actual file contents. If the index says "pending" but the file says "afgehandeld", update the MEMORY.md index immediately before opening the meeting. Stale index entries cause false blocker reports in Phase 3.
3. Read CTO blockers explicitly:
   - `.claude/cto/memory_apify_credits_low.md` — flag if credits < $1
4. Read `product/backlog.md` — identify the first non-completed item per section (Landing Page, Admin, Organisation). These are the top 3 for today's discussion.
5. **Spec open-questions pre-check:** For each backlog item likely to be implemented today (based on step 4), check its spec file for an "Open Questions" section. If unanswered questions exist, flag them immediately in the agenda under "Actieve blockers" so the CEO can resolve them in Round 2 before any terminal is dispatched.

Then open the meeting in this format:

```
## AIntern Dagelijkse Boardvergadering — {datum}

**Aanwezig:** Alex (CEO), Blake (CMO), Morgan (CTO), Sam (COO)
**Voorzitter:** Alex (CEO)

**Actieve blockers:**
- [Lijst blockers uit CTO/CMO memory — bijv. "Apify credits uitgeput ($0.07)" of "3 DMs wachten op handmatig verzenden"]
- Geen (als er geen blockers zijn)

**Agenda van vandaag:**
1. Human Board check-in — backlog feedback
2. Directiebespreking — prioriteiten van de dag
3. LinkedIn outreach voorstellen
4. Kennisbank content voorstellen
5. Vergaderverslag + e-mail
6. Skill verbeterreview
```

---

## Human Board Check-in — Backlog Feedback

**This is the only deliberate pause before Phase 2.** Present the top backlog items and wait for the Human Board's response before continuing.

### What to show

Display the first non-completed item per backlog section (Landing Page, Admin, Organisation) — the same items loaded in Phase 1 Step 4. Use this format:

```
---
### Backlog — Human Board Check-in

Hieronder de top backlog items voor vandaag. Geef feedback vóór we beginnen:
- prioriteit aanpassen
- een item overslaan
- een nieuw item toevoegen
- opmerkingen over een specifiek item

| Sectie | # | Titel | Status | Spec |
|--------|---|-------|--------|------|
| Landing Page | B-xx | [titel] | todo | [link als aanwezig] |
| Admin        | B-xx | [titel] | todo | [link als aanwezig] |
| Organisation | B-xx | [titel] | todo | [link als aanwezig] |

Typ je feedback of "geen feedback" om direct door te gaan.
---
```

### What to do with the response

- **"geen feedback"** — proceed directly to Phase 2 with the backlog as-is
- **Priority shift** (e.g. "doe B-12 eerst") — reorder in Phase 2 Round 1; Morgan (CTO) opens Round 1 by acknowledging the shift and anchoring it to the relevant OKR
- **Skip item** — note it in Phase 2 and exclude it from the Top 5 Daily Actions
- **New item** — Alex (CEO) notes it for Phase 2 Round 3 Step C (Backlog Registration); do not write to the backlog yet
- **Other feedback** — Blake (CMO) or Morgan (CTO) address it in the relevant Round

Store the Human Board's response as `[HB_FEEDBACK]` — reference it explicitly at the start of Phase 2 Round 1:
```
**Alex (CEO) — Opening Round 1:**
Human Board feedback ontvangen: [HB_FEEDBACK samenvatting]
Dit nemen we mee als leidraad voor de prioriteiten van vandaag.
```

---

## Agent Execution Model — Branch-Scoped Claude Terminals

Every action performed by any C-suite agent (CEO, CMO, CTO, COO) that writes files, commits code, publishes content, or calls external tools **must be executed in a dedicated new Claude terminal**, not inline in the main meeting session.

### How to open an agent terminal

Use the `claude` CLI via **Bash** — this makes the terminal visible in the Claude Code console so the Human Board can see it live:
```bash
claude -p "<agent task here>" --allowedTools "Bash,Read,Write,Edit,Glob,Grep"
```
The `--allowedTools` flag pre-approves file writes so the terminal never blocks waiting for an interactive permission prompt.

> ⛔ **NEVER use the Agent tool for terminal actions.** The Agent tool runs in a hidden sub-context that is invisible to the Human Board. Only `Bash` + `claude -p` produces a visible console terminal.

The prompt passed to each terminal **must**:
1. Start with: `"You are working on branch feature/board-{YYYY-MM-DD}. Verify you are on this branch (git status) before making any changes. If not, run: git checkout feature/board-{YYYY-MM-DD}."`
2. Describe the specific action to take
3. End with: `"When all changes are written:\n1. Run git diff --stat\n2. Output the full Terminal Summary verbatim:\n\n**Terminal Summary — [Agent] [Action]**\n- Branch: feature/board-{YYYY-MM-DD}\n- Files changed: [list with one-line description per file]\n- Proposed commit message: [message]\n- Diff: [git diff --stat output]\n- Status: ✅ Ready to commit / ❌ Failed ([reason])\n\n3. Ask: **Goedkeuring voor commit? (ja / nee / feedback)**\n4. Wait for the Human Board to respond before committing.\n5. On 'ja': run git add -A && git commit -m '[proposed message]', then output: ✅ Committed.\n6. On 'nee' or feedback: do NOT commit. Output the feedback and close with: ⛔ Commit afgewezen — geen commit gedaan."`

### Human Board approval before every commit

The approval gate runs **inside the terminal** — the terminal itself outputs the summary and waits for the Human Board's response before committing. The main session (CEO) does **not** repeat or re-ask this — the CEO only verifies it happened correctly (see CEO branch oversight below).

> ⛔ **Never commit from inside a terminal without explicit Human Board approval within that terminal.** The terminal must show the full Terminal Summary and receive a "ja" before running git commit.

### CEO branch oversight

Alex (CEO) is responsible for branch integrity and backlog governance throughout the meeting:

- **Before each terminal is dispatched:** confirm (1) the branch name in the prompt matches `feature/board-{YYYY-MM-DD}` and (2) the corresponding backlog item exists and has status `todo` or `in-progress` — if the backlog item is missing, instruct the backlog manager to add it first and wait for confirmation before opening the terminal. State this check explicitly in the meeting output so Bill can verify before the terminal starts.
- **After each terminal completes:** verify in the terminal output that (1) the full Terminal Summary was shown verbatim and (2) the Human Board was asked for approval and responded "ja" before the commit ran. If either step was skipped, surface a `[BLOCKER]` — the commit is invalid, must be reverted, and the terminal must re-run with the correct approval flow. If ❌ status, hold all subsequent terminals until resolved.
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

**Step A — KPI Pulse.** Before setting actions, check this week's progress against weekly targets (from OKRs memory). Use actual numbers where available. Also run `sheal cost` — paste the per-project token spend line for AIntern into the table as the last row:
- **Connection count:** count rows in `product/marketing/leads/outreach-log.csv` where `connection_sent_at` falls within the current ISO week (Monday of current week ≤ date ≤ today). Do **not** use the cumulative count from memory — filter by date to avoid carrying over last week's connections.
- **Kennisbank article count:** check `.claude/cmo/memory_daily_context.md`. When the count is ≥ 1, verify each article's publish date against the current ISO week start (Monday). Only count articles published on or after Monday of the current ISO week. If the memory shows 2/2 but one article was published on a Sunday (previous week), the actual count for the current week is 1/2 — note this discrepancy.
- **LinkedIn post count:** use `.claude/cmo/memory_daily_context.md` as the **canonical source** — CEO memory may lag behind and should not be used for this metric. If not tracked in CMO memory, use `0 (niet getrackt — handmatige check vereist)` as fallback
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
| CTO     | Security check done             | 1           | [Y/N]         | ✅ (in current ISO week) / ⚠️ (done last week — show date) / ❌ (not done) |
| COO     | Lead pipeline updated           | 2×          | [N]           | ✅ / ⚠️ / ❌ |
| CTO     | Token spend (sheal cost)        | monitor     | [€/sessions]  | ✅ / ⚠️ (spike) |
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

Alex (CEO) registers every Top 5 action directly in `product/backlog.md` (Edit tool). The `backlog-manager` is an **agent**, not a skill — calling it via `Skill()` fails. Instead, append rows to the Board Meeting Actions (B) table directly. Each item is registered with:
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

  **Handmatige LinkedIn URL fallback (voor de Human Board):**
  Als Apify geblokkeerd blijft en er leads in de CSV staan zonder LinkedIn URL, presenteer dan de volgende instructies zodat Bill de URLs handmatig kan ophalen:
  ```
  ### Handmatige LinkedIn URL ophalen
  Voor de volgende leads ontbreekt een LinkedIn URL. Zoek deze handmatig op:

  | Website | Bedrijfsnaam | Actie |
  |---------|-------------|-------|
  | [website] | [naam] | Zoek op LinkedIn: site:linkedin.com/in "[bedrijfsnaam]" of open LinkedIn en zoek op naam + bedrijf |

  Voeg de gevonden URL toe als `linkedin_url` in `product/marketing/leads/outreach-log.csv` en meld dit in het gesprek zodat outreach direct kan starten.
  ```

### Steps

1. Read `product/marketing/leads/` — identify 3–5 uncontacted leads with LinkedIn URLs
   - **If no LinkedIn URLs available:** Skip to the Apify-enrichment branch below — do not attempt drafting connection messages
   - **Apify-enrichment branch:** Propose running `apify-lead-generation` skill on the remaining CSV leads to obtain LinkedIn URLs + names. Present this as the Phase 3 action in the Approval Gate (Section B). Skip steps 2–5 and go directly to the gate.
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

1. Read up to the **10 most recent entries** from the Obsidian vault (see `references/obsidian-vault.md` for vault location and structure). If all 10 are AFGEWEZEN or GEBRUIKT, skip Phase 4 entirely and mention: `_Phase 4 overgeslagen — geen ongebruikte Obsidian seeds beschikbaar in de laatste 10 entries._`
2. Identify 1–2 topic seeds relevant to the AIntern audience (Lightspeed webshop owners, MKB, AI automation)
2b. **Rejected seed filter:** Before selecting seeds, check the "Genomen Beslissingen" section of `.claude/cmo/memory_daily_context.md`. Look for lines containing `AFGEWEZEN` or `GEBRUIKT` with the **exact filename** of the Obsidian entry (e.g. `"2026-04-10 Claude als verborgen superkracht.md — AFGEWEZEN"`). Skip any entry whose filename appears in that list. Move to the next most recent entry instead.
   - **When writing rejected decisions to memory:** Always include the exact Obsidian filename, not a generic description (e.g. write `"2026-04-10 Claude als verborgen superkracht voor ontwikkelaars.md — AFGEWEZEN"` not `"Kennisbank voorstel 1 AFGEWEZEN"`)

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

**Learnings:** After writing all memory files, extract 1–2 non-obvious learnings from today's meeting (decisions made, blockers surfaced, patterns noticed) and persist them:
```bash
sheal learn add "[learning text]" --tags=board-meeting,{YYYY-MM-DD}
```
Run one `sheal learn add` call per learning. Skip if no new learnings surfaced.

**Write rules:**
- Always overwrite the full file — do not append
- Only include information relevant to that executive's domain
- CMO: include outreach batch status (approved/rejected/modified by Human Board), pending DMs, Kennisbank proposal status (approved/rejected)
- CTO: include backlog items in scope, any tech blocker status changes
- COO: include pipeline health status, onboarding checklist state
- CEO: include the Top 5 Daily Actions list, any cross-functional decisions, and Human Board feedback
- Always note which items were approved, rejected, or modified by the Human Board — this is the ground truth for the next meeting
- **Stale backlog sync:** After updating executive memory, scan all open B-items in `product/backlog.md` and compare against executive memory. If any B-item has status `todo` in the backlog but is marked as done/cancelled in executive memory, correct it immediately. The backlog is the single source of truth — memory should never be ahead of it for more than one meeting.

---

## Phase 7 — Skill Improvement

At the end of every meeting, review the session and propose improvements to this skill.

### Steps

0. Run a session retrospective to surface friction points automatically:
   ```bash
   sheal retro
   ```
   Use the retro output as direct input for step 1 below — friction points in the retro map to improvement proposals.

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

3. On approval: edit this `SKILL.md` or the relevant `references/` file directly as the **last post-approval action** — after LinkedIn outreach, Kennisbank publish, and LinkedIn posts. This ensures any Human Board feedback during the gate is incorporated before the skill is updated. Increment the version number in frontmatter (patch bump: 0.1.0 → 0.1.1).

---

## End-of-Meeting Approval Gate

After completing all seven phases automatically, present **one consolidated approval prompt** to the Human Board. Use a **numbered list** — each item is max 2 sentences so the Human Board can scan and respond quickly.

**Gate format:**

```
---
## Einde Vergadering — Goedkeuring Vereist

Reageer per nummer met "goedgekeurd", "afgewezen", of feedback. Of typ "alles goedgekeurd" voor alles.

**Extern zichtbaar (vereist goedkeuring):**

1. **LinkedIn Outreach — [Lead naam]**
   [Bericht tekst in één zin. Variant: ROI/Nieuwsgierigheid/Resultaat.]

2. **LinkedIn Outreach — [Lead naam]**
   [Bericht tekst in één zin. Variant: ROI/Nieuwsgierigheid/Resultaat.]

3. **Kennisbank artikel — "[Titel]"**
   [Categorie + één zin over de angle.]

4. **LinkedIn post**
   [Eerste zin van de post + hashtags in één regel.]

5. **Skill verbetering — [korte naam]**
   [Wat er wijzigt en waarom, in één zin.]

6. **Skill verbetering — [korte naam]**
   [Wat er wijzigt en waarom, in één zin.]

**Automatisch uitgevoerd (ter info):**
- Backlog bijgewerkt: [N items]
- Board memory bijgewerkt: CEO / CMO / CTO / COO
- Vergaderverslag opgeslagen in Obsidian ✅
- E-mail verstuurd naar w.middelbosch@gmail.com ✅
- Branch commits: [git log --oneline output]
---
```

**Uitvoervolgorde na goedkeuring:**
1. Voer goedgekeurde LinkedIn outreach uit (connection requests / DMs)
2. Publiceer goedgekeurde Kennisbank artikelen naar S3
3. Publiceer goedgekeurde LinkedIn posts via Zapier MCP
4. Pas goedgekeurde skill-verbeteringen toe als **laatste** stap — zodat eventuele feedback uit de gate is meegenomen in de wijzigingen
5. Voer Phase 6 uit — update board memory met de beslissingen van de Human Board

**Afgewezen of overgeslagen items:** zet backlog-status terug naar `todo` en log de reden in CMO/CEO memory.

---

## Execution Rules

- **Run all phases automatically** — do not pause mid-meeting for approvals, with one exception: the Human Board Check-in after Phase 1 is a deliberate pause; wait for the Human Board's response before starting Phase 2
- **Single approval gate** — collect all human decisions and present them at the very end
- **Never auto-send** LinkedIn messages or emails — only send after explicit End-of-Meeting approval
- **Board memory is written after the approval gate** — Phase 6 runs only after the Human Board responds; include their decisions in the memory files
- **Stay in character** — each executive speaks in their own voice throughout
- **Cite OKRs** — anchor every priority to a Q2 OKR metric
- **Alles in het Nederlands** — vergadering, discussie, samenvatting, outreach en Kennisbank content zijn allemaal in het Nederlands
- **Hard blocker exception** — if a phase encounters a fatal error (missing file, auth failure), surface it inline with a `[BLOCKER]` tag and continue with remaining phases; include it in the End-of-Meeting gate
- **Feature branch required** — CTO creates `feature/board-{YYYY-MM-DD}` in Phase 1 Step 0; no agent may write, commit, or publish outside this branch
- **Terminals must be visible** — always open terminals via `Bash` + `claude -p "..."`. Never use the Agent tool for terminal actions — it runs in a hidden context invisible to the Human Board
- **Windows terminal prompt encoding** — `claude -p "..."` fails on Windows/Git Bash when the prompt exceeds ~1000 characters due to quote-escaping. Fix: write the prompt to a temp file first, then dispatch via `claude -p "$(cat /tmp/board-task-{n}.txt)" --allowedTools "Bash,Read,Write,Edit,Glob,Grep"`. If the terminal output file is ≤30 lines and contains only bash errors (no Claude output), this encoding failure is the cause — fall back to implementing the task inline in the main session and note it as a blocker in the approval gate.
- **Human approval before every commit** — terminals write files and output a Terminal Summary but do NOT commit. The main session quotes the summary in full, asks "Goedkeuring voor commit?", and only commits via `git commit` after explicit Human Board approval
- **Terminal Summary verbatim inside the terminal** — the terminal itself must output the full Terminal Summary and ask "Goedkeuring voor commit?" before committing. The CEO verifies this happened; the main meeting output does not repeat or re-ask it
- **One terminal per backlog item** — each `claude -p "..."` terminal covers exactly one backlog item end-to-end. Never combine multiple backlog items in one terminal. Every terminal prompt must include the instruction: "Complete all steps inline — do not spawn sub-agents or additional terminals." If a backlog item is too large, split it into smaller items and get Human Board approval before dispatching
- **Sequential dispatch** — terminals are dispatched one at a time; the next terminal only starts after the previous Terminal Summary shows ✅
- **CEO gate on each terminal** — Alex (CEO) verifies the branch name in every terminal prompt before dispatch and reads the Terminal Summary on return; a ❌ status halts further terminals until resolved
- **Merge conflict prevention** — every terminal starts with `git pull origin feature/board-{YYYY-MM-DD} --rebase` before making changes
- **Backlog-first** — every action must be logged in `product/backlog.md` by the `backlog-manager` skill before its terminal is opened; CEO enforces this gate on every dispatch
- **Backlog update after approval** — the `backlog-manager` is the first thing called after the human's approval response; it updates item statuses before any other post-approval action runs

---

## Additional Resources

### Sheal CLI Utilities

Available throughout all phases when context is needed from past sessions:

| Command | When to use |
|---------|-------------|
| `sheal check` | Phase 1 Step 0.1 — project health pre-flight |
| `sheal digest --since "7 days"` | Phase 1 Step 0.2 — weekly activity context |
| `sheal cost` | Phase 2 Round 3 Step A — token spend KPI row |
| `sheal ask "<question>" --agent claude` | Any phase — query past sessions for decisions/context (e.g. `sheal ask "why did we drop Apify?"`) |
| `sheal learn add "<learning>" --tags=board-meeting,{date}` | Phase 6 — persist non-obvious learnings after approval gate |
| `sheal retro` | Phase 7 Step 0 — feed session friction points into improvement proposals |

If `sheal` is not installed, skip and note as `[HEALTH: sheal not found]` in Phase 1.

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