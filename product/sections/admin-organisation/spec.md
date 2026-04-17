# Spec A-18 — Extend /admin/organisation with All Agents + Visual Icons

**Status:** Draft  
**Backlog item:** B-27 (spec) → A-18 (implementation)  
**Implemented by:** CTO (Morgan)  
**Route:** `/admin/organisation`  
**View:** `src/views/admin/AdminOrganisationView.vue`

---

## Overview

The current `/admin/organisation` page (B-12) shows the four C-level agents (Alex CEO, Blake CMO, Morgan CTO, Sam COO) with a basic hierarchy diagram and responsibility cards. It has no icons, no sub-agents, and no representation of the full AIntern agent ecosystem.

This feature extends the page to show **all agents** used by AIntern — C-level and sub-agents — with a visual icon (emoji) per agent, a clear hierarchy tree, and per-agent detail cards that include the parent relationship.

The page remains **static** for v1: no live agent-status API, no real-time data.

---

## Agent Inventory

### Tier 1 — C-Level (Human Board reporters)

| Agent | Name | Emoji | Role | Reports to |
|---|---|---|---|---|
| CEO | Alex | 🧑‍💼 | Strategy, sales, OKR oversight, partnerships | Human Board |
| CMO | Blake | 📣 | Content marketing, LinkedIn, lead generation | CEO (Alex) |
| CTO | Morgan | 🔧 | Platform architecture, Lambda, infra, security | CEO (Alex) |
| COO | Sam | ⚙️ | Operations, delivery, quality, onboarding | CEO (Alex) |

### Tier 2 — Sub-agents by parent

#### CEO sub-agents

| Agent ID | Emoji | Role | Triggered by |
|---|---|---|---|
| backlog-manager | 📋 | Manages product feature backlog; confirms every change | CEO — feature triage, sprint planning |
| general-purpose | 🤖 | General research, multi-step tasks, codebase queries | CEO — ad-hoc research |
| Plan | 🗺️ | Architecture planning, implementation strategy | CEO — vision-to-spec bridge |
| company-intel | 🔍 | Research company snapshots and intel | CEO — sales prep, partnership research |
| Vision:1-product-vision | 🌟 | Define product vision | CEO — roadmap sessions |
| Vision:2-product-roadmap | 🛣️ | Generate product roadmap | CEO — quarterly planning |
| thought-journal | 📓 | Reflective journaling from Obsidian vault | CEO / CMO — content ideation |

#### CMO sub-agents

| Agent ID | Emoji | Role | Triggered by |
|---|---|---|---|
| marketing-super-team | 🎯 | 5-expert analysis (Hormozi, Ogilvy, Gary Vee, Brunson, Suby) | CMO — campaign strategy |
| social-content | 📱 | Social media post creation and scheduling | CMO — content calendar |
| outreach | 📨 | AIntern LinkedIn outreach workflow (find → draft → send) | CMO — lead outreach |
| linkedin-outreach | 🤝 | Full 2-step LinkedIn sequence (connect + DM) | CMO — connection campaigns |
| lead-outreach | 👥 | CSV-based LinkedIn connection requests | CMO — bulk lead processing |
| apify-lead-generation | 🕷️ | B2B/B2C lead scraping (Google Maps, LinkedIn, etc.) | CMO — lead sourcing |
| linkedin-cli | 🔗 | LinkedIn CLI automation; profile fetch and search | CMO — profile lookups |

#### CTO sub-agents

| Agent ID | Emoji | Role | Triggered by |
|---|---|---|---|
| vuejs-feature-builder | 🖼️ | Vue.js feature implementation pipeline (Vision→Review) | CTO — frontend features |
| vuejs-project-scaffolder | 🏗️ | New Vue.js project setup with plugins + Claude config | CTO — new projects |
| lambda-feature-builder | ⚡ | AWS Lambda feature builder (serverless functions) | CTO — backend features |
| dynamodb-feature-builder | 🗄️ | DynamoDB schema design and index optimization | CTO — data modeling |
| code-reviewer | 👁️ | Code quality, security, and maintainability review | CTO — after every code change |
| security-reviewer | 🔒 | Security vulnerability detection (OWASP Top 10) | CTO — after input/API/auth code |
| Explore | 🔎 | Fast codebase exploration by pattern or keyword | CTO — research queries |
| ui-designer | 🎨 | Visual design, UI systems, pixel-perfect implementation | CTO — UI tasks |
| ux-designer | 🧭 | UX design thinking, user psychology, experience strategy | CTO — UX review |
| plugin-dev:* | 🔌 | Full plugin development suite (structure, skills, agents, hooks) | CTO — plugin work |
| claude-api | 🤖 | Claude API / Anthropic SDK development and optimization | CTO — AI integrations |
| firecrawl | 🕸️ | Web scraping, search, crawling via Firecrawl CLI | CTO — external data needs |
| session-health | 📊 | Session health check; context, standards, spec sync | CTO — ongoing hygiene |
| simplify | ✨ | Code simplification and quality review post-implementation | CTO — refactoring |
| init | 📄 | Initialize new CLAUDE.md with codebase documentation | CTO — project setup |
| review | 🔍 | Full pull request review | CTO — PR workflow |

#### COO sub-agents

| Agent ID | Emoji | Role | Triggered by |
|---|---|---|---|
| daily-board-meeting | 📅 | Orchestrates daily standup across all C-levels | COO — every morning |
| schedule | 🕐 | Create/manage scheduled remote agents (cron triggers) | COO — automation scheduling |
| loop | 🔁 | Recurring task execution at a set interval | COO — polling, monitoring loops |

---

## Visual Design

### Icon approach

**Emojis only — no new icon libraries or npm dependencies.**

Each agent card and hierarchy node shows a single emoji as a visual identifier. The emoji is rendered in a small rounded square background tinted to match the agent's tier color:

- Tier 1 (C-level): colored badge — same palette as B-12 (indigo/pink/teal/violet)
- Tier 2 (sub-agents): neutral slate badge with smaller text

Example HTML pattern (Tailwind v4):
```html
<div class="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100 text-xl">
  🧑‍💼
</div>
```

### Color palette per C-level (carry over from B-12)

| C-Level | Bg token | Text token | Ring token |
|---|---|---|---|
| CEO (Alex) | `bg-indigo-50` | `text-indigo-700` | `ring-indigo-200` |
| CMO (Blake) | `bg-pink-50` | `text-pink-700` | `ring-pink-200` |
| CTO (Morgan) | `bg-teal-50` | `text-teal-700` | `ring-teal-200` |
| COO (Sam) | `bg-violet-50` | `text-violet-700` | `ring-violet-200` |

Sub-agent cards use `bg-slate-50` with a left-side colored border matching the parent C-level.

---

## Hierarchy Diagram Description

### Layout

Three-tier vertical tree, top-down:

```
                  [Human Board]
                       |
                  [🧑‍💼 CEO Alex]
          ┌────────────┼────────────┐
    [📣 CMO Blake] [🔧 CTO Morgan] [⚙️ COO Sam]
         |               |               |
   [sub-agents...]  [sub-agents...]  [sub-agents...]
```

Implementation approach:
- **Tier 1 row** (Human Board + CEO): centered, full width
- **Tier 2 row** (CMO / CTO / COO): 3-column grid below CEO, connected with a horizontal line + vertical drops (same pattern as current B-12 implementation)
- **Tier 3 rows** (sub-agents): each C-level's sub-agents displayed in a collapsible panel or scrollable horizontal chip list directly below the C-level card

For v1 the sub-agent tier is rendered as a **horizontal scrollable chip list** below each C-level column — not full cards — to keep the diagram readable. Full detail cards for sub-agents appear in the section below the diagram.

---

## Component Architecture

### Changes to existing file

`src/views/admin/AdminOrganisationView.vue`:

1. **Extend `Agent` interface** — add fields:
   - `emoji: string` — visual icon
   - `tier: 'clevel' | 'subagent'`
   - `parentRole: string | null` — e.g. `'CTO'`, null for CEO
   - `agentId: string` — kebab-case identifier (e.g. `'vuejs-feature-builder'`)
   - `triggeredBy: string` — short description of when this agent fires

2. **Extend agent data array** — add all 30+ sub-agents with parent references

3. **Update hierarchy diagram** — add Tier 3 sub-agent chip rows under each C-level column

4. **Update agent cards grid** — add emoji to card header; add `triggeredBy` field; group cards by tier with a section header ("C-Suite" / "Sub-agents — CMO" / etc.)

5. **Add `subAgentsByParent` computed** — groups sub-agents by `parentRole` for rendering

### No new components needed for v1

All changes are self-contained within `AdminOrganisationView.vue`. If the view exceeds ~350 lines, extract an `AgentCard.vue` component to `src/components/admin/`.

---

## Acceptance Criteria

- [ ] All 4 C-level agents display an emoji icon in both the hierarchy diagram and detail cards
- [ ] All sub-agents listed in the Agent Inventory section above are present in the data array
- [ ] Each sub-agent card shows: emoji, agent ID, role description, parent C-level, and trigger context
- [ ] The hierarchy diagram shows C-level nodes with their sub-agent chip list below each column
- [ ] Sub-agent chips are horizontally scrollable on mobile (no horizontal overflow break)
- [ ] Color palette from B-12 is preserved for C-level cards; sub-agent chips use the parent's tint color
- [ ] No new npm packages are installed (`npm list` remains unchanged)
- [ ] `npm run type-check` passes with no errors
- [ ] `npm run lint:check` passes with no errors
- [ ] Page is responsive at 375 px (iPhone SE) — hierarchy diagram does not overflow

---

## Out of Scope (v1)

- Live agent-status indicators (online/offline/busy)
- Agent performance metrics or KPI data
- Clickable agent cards linking to logs or history
- CPO agent (not yet implemented in the system)
- Sub-agent sub-sub-agent relationships (e.g., `plugin-dev:*` sub-skills shown as leaf nodes)
- Animation or interactive tree expand/collapse beyond the chip list
- Search or filter on the agent list
- i18n translations for agent descriptions (English only for v1; NL strings in future backlog)
