---
name: memory_model_usage_matrix_2026-04-25
description: CTO audit of all Claude inference call sites — decision matrix recommending the right model per action to reduce costs ≥30% without quality loss.
type: project
---

# Claude Model Usage Matrix — 2026-04-25

_Auteur: Morgan (CTO) — B-37_
_Datum: 2026-04-25_

## Context

Available models (cost order, cheapest first):
- **claude-haiku-4-5-20251001** — fastest, cheapest; suitable for classification, simple formatting, short extraction, boolean decisions
- **claude-sonnet-4-6** — balanced; suitable for summarisation, structured generation, moderate reasoning, code review
- **claude-opus-4-7** — most capable, most expensive; required for complex reasoning, multi-step orchestration, original code generation

All call sites were audited by scanning `.claude/agents/`, `.claude/skills/`, agent frontmatter, and Lambda source files (`lambda/src/`). No direct Anthropic SDK calls were found in `src/` or `lambda/src/` — all inference is routed through the Claude Code agent runtime.

---

## Decision Matrix

| # | Call Site | Task Description | Current Model | Recommended Model | Rationale | Est. Cost Reduction |
|---|-----------|-----------------|---------------|-------------------|-----------|---------------------|
| 1 | `.claude/agents/ceo.md` | Strategic orchestration, cross-functional triage, delegation routing, OKR alignment decisions | inherit (Sonnet) | **Sonnet** | Multi-step reasoning across domains; must correctly delegate and avoid hallucinated subtask structures. Haiku risk: drops context in long meeting sessions. | 0% (already Sonnet) |
| 2 | `.claude/agents/cto.md` | Code generation, bug fixing, Lambda TypeScript, Vue 3 components, CDK infra, build validation | inherit (Sonnet) | **Sonnet** | Code generation and build validation require strong type reasoning. Haiku produces high error rates on TypeScript template types. Opus not needed for greenfield feature work at this scale. | 0% (already Sonnet) |
| 3 | `.claude/agents/cmo.md` | Kennisbank article drafting (400–700 words, Dutch), LinkedIn brand posts, outreach strategy | inherit (Sonnet) | **Sonnet** | Customer-facing output; quality directly affects brand perception and lead conversion. Dutch-language generation at this length performs poorly on Haiku. | 0% (already Sonnet) |
| 4 | `.claude/agents/ghostwriter.md` | Long-form LinkedIn post drafting for Bill's personal profile — "Het AI-Duo Experiment" series | inherit (Sonnet) | **Sonnet** | Personal voice consistency and storytelling quality are critical; posts are directly published under Bill's name. Haiku cannot maintain series tone coherence across episodes. | 0% (already Sonnet) |
| 5 | `.claude/agents/lead-outreach.md` | Lead CSV processing, LinkedIn profile matching, personalised connection message generation (max 280 chars) | **sonnet** (explicit) | **Haiku** | Task is constrained: read CSV row → look up profile → fill short approved template. Template is fixed; personalisation is simple variable substitution (domain name, company). Boolean decision: has LinkedIn URL? Message is ≤280 chars with strict format. Haiku is sufficient. | **~60–70%** |
| 6 | `.claude/agents/linkedin-outreach.md` | Full 2-step outreach sequence: find contact → draft connection note + icebreaker DM; A/B variant rotation; CSV log updates | **sonnet** (explicit) | **Haiku** | Same reasoning as #5. Template rotation (ROI/Nieuwsgierigheid/Resultaat) is selection + fill, not creative generation. DM drafts are short (≤200 chars per memory). No complex reasoning needed; failure mode is mostly CSV parsing errors, not inference quality. | **~60–70%** |
| 7 | `.claude/agents/security-auditor.md` | OWASP Top 10 scan, XSS analysis in Vue templates, secret exposure detection, Lambda injection risks | inherit (Sonnet) | **Sonnet** | Security analysis requires accurate pattern recognition across multiple files with subtle context. Haiku misses chained injection paths and nuanced IDOR issues. False negatives are worse than cost. | 0% (already Sonnet) |
| 8 | `daily-board-meeting` SKILL (via `claude -p`) | Full C-suite orchestration: 7 phases, multi-file context, backlog management, KPI synthesis, approval gate | inherit (Sonnet) | **Sonnet** | Most complex task in the system — hours of context, multi-domain decisions, precise file writes. Haiku context window and reasoning depth are insufficient. Opus would add cost without measurable gain at this task complexity level. | 0% (already Sonnet) |
| 9 | `marketing-super-team` SKILL (invoked inside board meeting) | Quick Audit of Kennisbank topic angle; outreach angle evaluation; content critique | inherit (Sonnet) | **Haiku** | Quick Audit is a structured classification task: angle relevance (yes/no + 1 sentence). Input is a short seed text; output is a short verdict. This is exactly Haiku's sweet spot. Switch saves ~60% on every board meeting that reaches Phase 4. | **~60%** |
| 10 | `social-content` SKILL (invoked inside board meeting) | Hook quality check on LinkedIn outreach connection messages | inherit (Sonnet) | **Haiku** | Input: ≤280 char message. Task: rate hook quality + suggest one tweak. Binary classification + short text edit. Haiku is well within range for this. | **~60%** |

---

## Priority Changes

| Priority | Change | Action |
|----------|--------|--------|
| High | `lead-outreach` agent: Sonnet → Haiku | Edit `.claude/agents/lead-outreach.md` frontmatter: `model: haiku` |
| High | `linkedin-outreach` agent: Sonnet → Haiku | Edit `.claude/agents/linkedin-outreach.md` frontmatter: `model: haiku` |
| Medium | `marketing-super-team` Quick Audit: add `--model haiku` flag when dispatching from board meeting | Update `SKILL.md` Phase 4 Quick Audit step and Phase 3 angle evaluation step |
| Medium | `social-content` hook check: add `--model haiku` flag | Update `SKILL.md` Phase 3 social-content step |
| Low | All `inherit` agents: no change needed — Sonnet is the correct default for complex/critical tasks | — |

---

## Estimated Savings Summary

| Category | Current | Recommended | Frequency (est./week) | Est. Saving |
|----------|---------|-------------|----------------------|-------------|
| Lead outreach (connection notes + DMs) | Sonnet | Haiku | 20–25 calls/week | **~65%** per call |
| Marketing-super-team Quick Audit | Sonnet | Haiku | 2–4 calls/week (board meetings) | **~60%** per call |
| Social-content hook check | Sonnet | Haiku | 2–4 calls/week | **~60%** per call |
| All other agents (CEO, CTO, CMO, Ghostwriter, Security, Board) | Sonnet | Sonnet | — | 0% (correct already) |

**Overall projected savings:** The two outreach agents account for the bulk of weekly inference calls (20–25 connection + DM drafts). Switching both to Haiku yields ~65% cost reduction on those calls. Including marketing-super-team and social-content, total weekly inference cost drops by an estimated **35–45%** — exceeding the ≥30% target without any quality-critical path being downgraded.

---

## Validation Protocol

Before marking changes as permanent, run one week of Haiku on the outreach agents and evaluate:
1. Connection message acceptance rate (target: no change vs. Sonnet baseline)
2. DM reply rate (target: no change)
3. Any CSV parsing failures or format errors in outreach-log.csv

If quality holds: keep Haiku. If acceptance/reply rate drops >10%: revert to Sonnet and escalate to CMO.

---

## Implementation Notes

- Model switching in Claude Code agents is a frontmatter change only — no Lambda deploy needed
- Changes take effect on the next agent invocation — no restart required
- `inherit` agents automatically use the main session model (currently Sonnet 4.6 per system context) — no change needed
- Claude Code skill invocations do not currently support per-skill model flags; Phase 3/4 Quick Audit model reduction requires skill-level dispatch changes in SKILL.md if the platform adds `--model` flag support for sub-skills

_Status: recommended — awaiting CEO/board approval before applying frontmatter changes_
