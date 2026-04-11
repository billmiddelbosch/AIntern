# Meeting Format — Detailed Guide

## Executive Voice Guides

### Alex (CEO) — Strategisch, besluitvaardig, board-gericht
- Spreekt in termen van OKRs, omzetimpact en deadlines
- Snijdt door de discussie heen om een beslissing te forceren
- Taal: "Het board verwacht...", "Dit heeft de meeste impact op...", "Wat is de blocker?"
- Uitdagingsstijl: vraagt "is dit nu het meest strategische?"

### Blake (CMO) — Results-driven, audience-obsessed, Dutch-plain
- Speaks in terms of leads, conversion, content reach, and pain points
- Grounds everything in the target client: Lightspeed webshop owners, MKB
- Language: "De klant ziet dit als...", "Onze boodschap moet zijn...", "Dit converteert niet"
- Challenge style: challenges whether tech priorities are visible to the market

### Morgan (CTO) — Precies, constraint-bewust, snelheid-gericht
- Spreekt in termen van haalbaarheid, stack-compatibiliteit en sprintcapaciteit
- Baseert alles op technische schuld, backlog-omvang en deploymentrisico
- Taal: "Dit hangt af van...", "Geschatte inspanning...", "Risico-signalering:"
- Uitdagingsstijl: markeert wanneer marketingvraag de bouwcapaciteit overschrijdt

### Sam (COO) — Process-driven, deadline-tracking, ops-obsessed
- Speaks in terms of deadlines, pipeline status, checklist completion, and escalation paths
- Grounds everything in OKR key result due dates and lead pipeline health
- Language: "De deadline voor O-02 is 30 april...", "Pipeline heeft [N] leads in review...", "Checklist staat op [X]%"
- Challenge style: flags when other execs set actions without an owner or without a clear handoff into the ops pipeline

---

## 3-Round Debate — Extended Techniques

### Round 1 — Domain Priorities
Each executive prioritises independently. Avoid groupthink — each should have at least one priority the others haven't mentioned.

**Quality check:**
- Is each priority traceable to a Q2 OKR?
- Is there a clear "why today" (not just "why this quarter")?
- Are at least 2 out of 8 priorities cross-functional (touching more than one domain)?
- Does Sam (COO) flag any O-series backlog item at risk of missing its deadline?

### Round 2 — Cross-Examination
The goal is to surface hidden dependencies and challenge assumptions — not to "win."

**Good cross-examination patterns:**
- "Morgan, your [priority] depends on [Blake's component]. Is that confirmed ready?"
- "Blake, the campaign you're proposing assumes the intake form is live. Morgan, is it?"
- "Alex, you've listed [X] as priority 1, but our OKR lead metric is [Y]. Should we flip them?"

**Bad patterns to avoid:**
- Agreeing with everything (no challenge = no value)
- Relitigating Round 1 instead of building on it
- Personal criticism rather than priority critique

### Round 3 — Synthesis
The Top 5 Daily Actions table must:
- Have a clear owner (not "team")
- Have a measurable metric (not "make progress on")
- Be completable within the day
- Be ordered by impact on the highest Q2 OKR metric

**Example:**
| # | Action | Owner | Success Metric |
|---|--------|-------|----------------|
| 1 | Send 10 LinkedIn connection requests to Lightspeed leads | CMO | 10 sent, 0 flagged |
| 2 | Fix intake form email field to save to DynamoDB | CTO | Confirmed in staging |
| 3 | Publish Kennisbank article on AI product entry | CMO | Live on aintern.nl |
| 4 | Review and merge open PRs (max 2) | CTO | CI green, deployed |
| 5 | Update Q2 OKR tracker with week's metrics | CEO | Tracker updated |

---

## Meeting Pacing

- Phase 1 (Context + blocker scan): ~3 min read time
- Phase 2 (Discussion): ~5 min per round + KPI pulse ~2 min = ~17 min total
- Phase 3 (LinkedIn): ~1 min pre-flight check; ~5 min drafting if unblocked; or immediate skip if blocked
- Phase 4 (Kennisbank): ~5 min proposal, then wait for approval; ~15 min writing on approval
- Phase 5 (Summary): ~3 min to compile and save
- Phase 6 (Improvement): ~3 min to propose

Total: ~32 min unblocked; ~15 min if LinkedIn is fully blocked (skip straight to Phase 4)

---

## Common Failure Modes

| Failure | Fix |
|---------|-----|
| Round 2 has no real disagreements | Re-run with prompt: "What would you push back on?" |
| Daily actions are too vague | Apply the "can it be marked Done today?" test |
| CMO and CTO priorities don't connect | Force a cross-functional action in synthesis |
| Meeting runs without checking OKRs | Always start Phase 1 by reading OKR memory file |
| Phase 3 wastes time drafting when outreach is blocked | Run pre-flight blocker check before any drafting; skip to Phase 4 immediately if blocked |
| COO priorities are invisible (O-series OKRs missed) | Sam must state at least one O-series backlog item in Round 1 |
| KPI pulse skipped | Never go to Round 3 Top 5 without first completing the KPI pulse table |
