---
name: daily-board-meeting
description: This skill should be used when the user asks to "start the daily board meeting", "run the morning standup", "kick off the daily briefing", "start the C-suite discussion", "begin the board meeting", "start the daily sync", or "run the daily AIntern meeting". Orchestrates a structured daily session between CEO (Alex), CMO (Blake), and CTO (Morgan) to align on the day's priorities, generate LinkedIn outreach proposals, create Kennisbank content from Obsidian, produce a meeting summary saved to Obsidian and emailed to Bill, and improve the skill itself at the end.
version: 0.1.1
---

# Daily Board Meeting

A structured daily session that runs the AIntern C-suite through six phases: context loading, executive discussion, LinkedIn outreach proposals, Kennisbank content proposals, meeting summary, and skill improvement. Each phase that requires human approval pauses and waits for an explicit "approved" or "go ahead" before continuing.

---

## Phase 1 — Context & Agenda (Opening)

Load context before starting the discussion:

1. Read OKRs from memory: `C:/Users/bmidd/.claude/projects/C--Users-bmidd-AIntern/memory/project_okrs_q2_2026.md`
2. Read CMO memory for active campaigns: `.claude/cmo/MEMORY.md`
3. Read CTO context from `.claude/cto/` if present
4. Check `product/backlog.md` for the top 3 backlog items

Then open the meeting in this format:

```
## AIntern Daily Board Meeting — {date}

**Attending:** Alex (CEO), Blake (CMO), Morgan (CTO)
**Chair:** Alex (CEO)

**Today's agenda:**
1. Executive discussion — top priorities
2. LinkedIn outreach proposals
3. Kennisbank content proposals
4. Meeting summary + email
5. Skill improvement review
```

---

## Phase 2 — C-Suite Discussion (3-Round Debate)

Run a structured 3-round discussion modeled on the marketing-super-team debate format. Each executive speaks in character using their real name, role, and domain expertise.

**Personas:**
- **Alex (CEO)** — strategy, cross-functional alignment, board priorities, OKRs
- **Blake (CMO)** — lead generation, content, LinkedIn campaigns, Kennisbank, outreach ROI
- **Morgan (CTO)** — product velocity, technical blockers, infra, backlog feasibility

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
```

### Round 2 — Cross-Examination

Each executive reacts to one priority from another exec. Surface dependencies, conflicts, and risks. Keep it direct. Example structure:

```
**Blake challenges Alex:** [disagreement or dependency]
**Morgan challenges Blake:** [feasibility or sequencing concern]
**Alex responds:** [resolution or decision]
```

### Round 3 — Synthesis

Produce the **Top 5 Daily Actions** — agreed by the group, each with an owner and a measurable outcome:

```
| # | Action | Owner | Success Metric |
|---|--------|-------|----------------|
| 1 | ...    | CMO   | ...            |
| 2 | ...    | CTO   | ...            |
...
```

---

## Phase 3 — LinkedIn Outreach Proposals

Blake (CMO) leads this phase with support from the `marketing-super-team` and `social-content` skills.

### Pre-flight Check

Before drafting any messages:
1. Read `.claude/cmo/memory_outreach_dm_pending.md` — check for accepted connections awaiting icebreaker DMs; **prioritise these over new requests**
2. Check whether the leads CSV has LinkedIn URLs — if not, new connection requests require Apify enrichment first (see `references/outreach-format.md`)
3. Verify LI_AT token is valid — if the last outreach was >48 hours ago, confirm token freshness before proceeding

### Steps

1. Read `product/marketing/leads/` — identify 3–5 uncontacted leads with LinkedIn URLs
2. Load the `marketing-super-team` skill to evaluate the outreach angle for today's batch
3. For each lead, draft a connection request message using the approved template (see `references/outreach-format.md`)
4. Apply the `social-content` skill to check hook quality and adjust if needed
5. Present all proposed messages to the **Human Board** in this format:

```
### LinkedIn Outreach Proposals

**Lead 1:** [Name] — [Company] — [Role]
**Message:** [connection request text, <200 chars]

**Lead 2:** ...
...

**Awaiting approval. Reply "approved" to proceed, or give feedback.**
```

6. **Do not send anything until explicit approval is received.** After approval, delegate to the `linkedin-outreach` agent with the approved message list.

---

## Phase 4 — Kennisbank Content Proposals

Blake (CMO) leads this phase. Source inspiration from Bill's Obsidian vault, then use `marketing-super-team` to shape the angle.

### Steps

1. Read the 3 most recent entries from the Obsidian vault (see `references/obsidian-vault.md` for vault location and structure)
2. Identify 1–2 topic seeds relevant to the AIntern audience (Lightspeed webshop owners, MKB, AI automation)
3. Load `marketing-super-team` skill — run a **Quick Audit** on each seed: is this the right angle for the target audience?
4. Present proposals to the **Human Board** in this format:

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

**Awaiting approval. Reply "approved [1]" or "approved [2]" (or both), or give feedback.**
```

5. For each approved proposal: write the full article (Dutch, HTML, 400–700 words), format as JSON, and publish to S3 following the steps in `references/kennisbank-publishing.md`.

---

## Phase 5 — Meeting Summary

Compile a concise management summary covering all phases.

### Summary format

```markdown
# AIntern Board Meeting — {date}

## Attendees
Alex (CEO), Blake (CMO), Morgan (CTO)

## Top 5 Daily Actions
| # | Action | Owner | Metric |
|---|--------|-------|--------|
...

## LinkedIn Outreach
- Leads proposed: N
- Status: [approved / pending / sent]
- Messages: [list]

## Kennisbank Content
- Proposals: [titles]
- Status: [approved / published / pending]

## Open Items & Blockers
- [List]

## Next Meeting
{tomorrow's date}
```

### Save to Obsidian

Save the summary as `{YYYY-MM-DD} AIntern Board Meeting.md` to:
```
C:/Users/bmidd/OneDrive/Documents/Obsidian Vault/Bill/Aintern Meeting Minutes/
```

Create the folder if it does not exist.

### Email the summary

Send the summary to `w.middelbosch@gmail.com` using **Zapier MCP** (`mcp__claude_ai_Zapier__gmail_send_email`) — this sends immediately. Subject: `AIntern Board Meeting — {date}`. Body: HTML. Fallback: `mcp__claude_ai_Gmail__gmail_create_draft` creates a draft only.

---

## Phase 6 — Skill Improvement

At the end of every meeting, review the session and propose improvements to this skill.

### Steps

1. Identify 2–3 specific friction points from today's meeting:
   - Instructions that were unclear
   - Steps that took longer than expected
   - Information that was missing and had to be fetched ad hoc
   - Outputs that didn't match the expected format

2. Propose improvements in this format:

```
### Skill Improvement Proposals

**Improvement 1:** [what to change]
- Location: SKILL.md / references/[file]
- Proposed change: [specific edit]
- Reason: [what friction it removes]

**Improvement 2:** ...

**Awaiting approval. Reply "approved" to update the skill, or "skip" to close.**
```

3. On approval: edit this `SKILL.md` or the relevant `references/` file directly. Increment the version number in frontmatter (patch bump: 0.1.0 → 0.1.1).

---

## Execution Rules

- **Never auto-send** LinkedIn messages or emails — always pause and wait for explicit human approval
- **Stay in character** — each executive speaks in their own voice throughout
- **Cite OKRs** — anchor every priority to a Q2 OKR metric
- **Dutch for all outreach and Kennisbank content** — English only for the meeting summary unless asked
- **Human Board approval gates:** Phase 3 (LinkedIn), Phase 4 (Kennisbank), Phase 6 (skill update)

---

## Additional Resources

### Reference Files

- **`references/meeting-format.md`** — Detailed debate techniques, persona voice guides, and example exchanges
- **`references/obsidian-vault.md`** — Vault location, folder structure, and how to extract topic seeds
- **`references/kennisbank-publishing.md`** — Full S3 publish workflow, JSON schemas, valid categories, and AWS commands
- **`references/outreach-format.md`** — Approved LinkedIn connection message templates and character-count rules

### Zapier MCP Actions

- **`mcp__claude_ai_Zapier__gmail_send_email`** — Send meeting summary email directly (no draft step)
- **`mcp__claude_ai_Zapier__linkedin_create_company_update`** — Post to AIntern brand page (company_id pre-set); use after publishing new Kennisbank articles or key announcements
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
