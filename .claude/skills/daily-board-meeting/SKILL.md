---
name: daily-board-meeting
description: This skill should be used when the user asks to "start the daily board meeting", "run the morning standup", "kick off the daily briefing", "start the C-suite discussion", "begin the board meeting", "start the daily sync", or "run the daily AIntern meeting". Orchestrates a structured daily session between CEO (Alex), CMO (Blake), CTO (Morgan), and COO (Sam) to align on the day's priorities, generate LinkedIn outreach proposals, create Kennisbank content from Obsidian, produce a meeting summary saved to Obsidian and emailed to Bill, and improve the skill itself at the end.
version: 0.1.3
---

# Daily Board Meeting

A structured daily session that runs the AIntern C-suite through six phases: context loading, executive discussion, LinkedIn outreach proposals, Kennisbank content proposals, meeting summary, and skill improvement. Each phase that requires human approval pauses and waits for an explicit "approved" or "go ahead" before continuing.

---

## Phase 1 — Context & Agenda (Opening)

Load context before starting the discussion:

1. Read OKRs from memory: `C:/Users/bmidd/.claude/projects/C--Users-bmidd-AIntern/memory/project_okrs_q2_2026.md`
2. Read CMO memory index and pending items:
   - `.claude/cmo/MEMORY.md`
   - `.claude/cmo/memory_outreach_dm_pending.md` — check for accepted connections awaiting manual DMs
3. Read CTO blockers explicitly:
   - `.claude/cto/memory_apify_credits_low.md` — flag if credits < $1
4. Check `product/backlog.md` for the top 3 backlog items

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

**Step A — KPI Pulse.** Before setting actions, check this week's progress against weekly targets (from OKRs memory). Use actual numbers where available (check `product/marketing/leads/outreach-log.csv` for connection count; CMO memory for Kennisbank article count):

```
| Exec  | KPI                          | Target/week | Actual (est.) | Status       |
|-------|------------------------------|-------------|---------------|--------------|
| CMO   | LinkedIn posts               | 3           | [N]           | ✅ / ⚠️ / ❌ |
| CMO   | New connection requests sent | 20–25       | [N]           | ✅ / ⚠️ / ❌ |
| CMO   | Kennisbank articles          | 2           | [N]           | ✅ / ⚠️ / ❌ |
| CTO   | Security check done          | 1           | [Y/N]         | ✅ / ❌       |
| COO   | Lead pipeline updated        | 2×          | [N]           | ✅ / ⚠️ / ❌ |
```

**Step B — Top 5 Daily Actions** — agreed by the group, ordered by impact on the highest off-track OKR metric:

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
### Skill Verbetervoorstellen

**Verbetering 1:** [wat te wijzigen]
- Locatie: SKILL.md / references/[bestand]
- Voorgestelde wijziging: [specifieke aanpassing]
- Reden: [welke frictie het wegneemt]

**Verbetering 2:** ...

**Wachten op goedkeuring. Antwoord "goedgekeurd" om de skill bij te werken, of "overslaan" om te sluiten.**
```

3. On approval: edit this `SKILL.md` or the relevant `references/` file directly. Increment the version number in frontmatter (patch bump: 0.1.0 → 0.1.1).

---

## Execution Rules

- **Never auto-send** LinkedIn messages or emails — always pause and wait for explicit human approval
- **Stay in character** — each executive speaks in their own voice throughout
- **Cite OKRs** — anchor every priority to a Q2 OKR metric
- **Alles in het Nederlands** — vergadering, discussie, samenvatting, outreach en Kennisbank content zijn allemaal in het Nederlands
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
- **`coo`** (Sam) — Ops priorities in Phase 2: pipeline health, onboarding checklist, weekly report status
