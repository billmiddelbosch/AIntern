# AI Studio — Vision

## Backlog ID
A-20 (Component Builder), A-21 (Template Builder)

## Last Updated
2026-05-07 — initial vision

---

## Problem Being Solved

AIntern demonstrates its value to MKB clients partly through live demos — showing that AI can generate production-ready Vue UI code on demand. Today that demo requires a developer to hand-code the result. There is also no fast internal path from "I need a new kennisbank article template" to a working Vue view; every variation requires manual coding, a feature branch, review, and a deploy.

Two concrete pain points:

1. **Demo friction.** During client demos, the team cannot interactively show Claude generating a real Vue component from a description. The demo is static and unconvincing to non-technical buyers.

2. **Template iteration speed.** The Kennisbank article template is a single hard-coded view. Experimenting with a minimal template, a visual template, or a CTA-heavy template requires a full development cycle.

---

## Goals

| # | Goal | Success metric |
|---|---|---|
| G-1 | Internal team can generate a working Vue component from a natural language description in under 2 minutes | Time-to-preview < 2 min from typing instruction to seeing rendered output |
| G-2 | Internal team can save a generated component to the repo without leaving the browser | Saved file visible in GitHub within 30 seconds of clicking "Save" |
| G-3 | Kennisbank template can be swapped without a code deploy | Active template change reflected on the live site after a config update only |
| G-4 | Feature is usable as a live client demo | No crashes, no raw JSON visible, preview renders visually correct output |

---

## User Personas

**Internal user (Bill / Lars / Sanne):** Technical enough to write natural language instructions, not a Vue developer. Needs a fast feedback loop. Will use this weekly to generate new UI pieces or iterate on the Kennisbank layout.

**Demo observer (MKB client):** Non-technical. Watches the screen during a sales demo. Their "wow moment" is seeing a rendered component appear from plain text in real time.

---

## User Flows

### Flow 1 — Component Builder

```
1. User navigates to /admin/ai-studio
2. User clicks "Component Builder" tab
3. User types a natural language instruction in the prompt textarea
   e.g. "Create a pricing card component with a title, price, and a CTA button"
4. User clicks "Generate"
5. Loading state shows ("Generating...")
6. Claude API returns .vue SFC source code
7. Code is injected into a sandboxed iframe via Vue runtime compiler
8. User sees the rendered component in the preview pane
9. User can:
   a. Refine: edit the instruction → click "Regenerate" → preview updates
   b. Edit code directly in the code panel → preview hot-reloads
   c. Approve: enter a component name → click "Save to repo"
10. On save: Lambda POSTs the SFC source to GitHub API as a new commit
    → file written to src/components/ai-generated/{ComponentName}.vue
11. Success toast: "Saved as ComponentName.vue — view on GitHub"
```

### Flow 2 — Template Builder

```
1. User clicks "Template Builder" tab
2. User types a natural language instruction for a full kennisbank page template
   e.g. "Minimal template: article title, reading time, body text, one CTA at the bottom"
3. User clicks "Generate"
4. Claude API returns a full .vue view SFC
5. Preview renders the template in the iframe (with mock article data injected)
6. User iterates (same refine loop as Flow 1)
7. User enters a template name → clicks "Save to repo"
8. Lambda writes the file to src/views/{TemplateName}.vue
9. User can click "Set as active template"
10. Lambda updates DynamoDB config record
    → Kennisbank article route now uses the new template
11. Success toast: "Template activated — kennisbank articles now use {TemplateName}"
```

### Flow 3 — Gallery

```
1. User opens either tab
2. A "Previously generated" panel shows a list of saved items:
   - Component name / template name
   - Generation instruction used
   - Created at timestamp
   - "Load" button (restores instruction + code into the builder)
   - "Delete" button (removes from gallery list only — does not delete the file from the repo)
3. User clicks "Load" → instruction and generated code are restored into the editor
```

---

## Acceptance Criteria

### Component Builder
- [ ] User can type a natural language instruction and receive a `.vue` SFC from Claude
- [ ] Rendered output appears in an iframe within 10 seconds of generation completing
- [ ] User can refine the instruction and regenerate; preview updates without page reload
- [ ] User can edit the generated code directly and the preview reflects the change
- [ ] Clicking "Save to repo" writes the SFC to `src/components/ai-generated/{name}.vue` via GitHub API
- [ ] A success or error toast is shown after save
- [ ] Previously saved components appear in the gallery with name, instruction, and date

### Template Builder
- [ ] User can generate a full Vue view SFC from a natural language description
- [ ] Preview renders with mock article data (title, body, reading time) inside the iframe
- [ ] User can save the template to `src/views/{TemplateName}.vue` via GitHub API
- [ ] User can mark a template as "active", which updates the DynamoDB config record
- [ ] The Kennisbank article route reads the active template name from config and renders the correct template
- [ ] Active template change does NOT require a code deploy

### Gallery
- [ ] All saved components and templates are listed with name, instruction, and creation date
- [ ] User can restore a previously saved item into the builder
- [ ] Gallery persists across sessions (backed by DynamoDB)

---

## Dependencies

| Dependency | Status | Notes |
|---|---|---|
| Existing Claude API integration (adminAxios / Lambda) | Existing | Reuse admin API client; new Lambda endpoint for AI generation |
| GitHub API (file write via commit) | New Lambda endpoint | PAT stored in AWS Secrets Manager |
| DynamoDB (gallery metadata + template config) | Extend existing DynamoDB setup | New table or new PK prefix in existing table |
| Vue runtime compiler (`@vue/runtime-dom` + `@vue/compiler-dom`) | New frontend dependency | Required for in-browser SFC compilation |
| AWS Secrets Manager (GitHub PAT) | New secret | One-time infrastructure setup |
| Admin auth (JWT guard) | Existing | No changes needed |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Claude-generated code fails to compile in the runtime compiler | Medium | High | Catch compilation errors, show them in the editor instead of crashing; prompt Claude to produce clean, compilable SFCs |
| GitHub API rate limiting (5000 req/hr authenticated) | Low | Low | One commit per save; well within limits |
| iframe sandbox escapes (XSS from generated code) | Medium | High | Strict iframe sandbox attribute; no `allow-same-origin`; postMessage only |
| Vue runtime compiler bundle size (~40KB gzipped) | Low | Low | Only loaded on /admin/ai-studio route via dynamic import |
| Active template switch breaks kennisbank if template has a bug | Medium | High | Validate SFC compilation before activating; keep previous template name in config as fallback |

---

## Open Questions Resolved

**Q1: Where does the "active template" config live?**
Decision: **DynamoDB**. A lightweight config record with PK `CONFIG#kennisbank-template` stores the active template name. This allows runtime switching without a deploy. Lambda reads this on every kennisbank article request (with a short TTL cache). Alternatives considered: router config file (requires deploy), Lambda env var (requires CDK redeploy). DynamoDB wins on flexibility.

**Q2: How does the iframe preview work technically?**
Decision: **Vue runtime compiler in-browser + srcdoc iframe**. The frontend dynamically imports `@vue/compiler-dom` + `@vue/runtime-dom`, compiles the SFC template string client-side, and mounts it into a `srcdoc`-populated iframe. No separate route needed. The iframe has a strict `sandbox="allow-scripts"` attribute — no same-origin, no forms, no top navigation. Communication from the compiled component back to the parent (if needed) uses `postMessage`. Alternatives considered: separate route `/admin/ai-preview` (adds routing complexity), server-side compilation (adds latency).

**Q3: What metadata is stored for saved components?**
Decision: Stored in DynamoDB with the following fields:

| Field | Type | Description |
|---|---|---|
| `id` | String | UUID (PK) |
| `type` | String | `component` or `template` |
| `name` | String | PascalCase filename without extension |
| `instruction` | String | Natural language prompt used to generate it |
| `code` | String | The generated `.vue` SFC source (stored for "Load" functionality) |
| `filePath` | String | Actual repo path written (e.g. `src/components/ai-generated/PricingCard.vue`) |
| `githubCommitSha` | String | Commit SHA from GitHub API response |
| `createdAt` | String | ISO-8601 timestamp |
| `createdBy` | String | Admin user ID from auth token |

**Q4: Is there a gallery view?**
Decision: **Yes, inline within each builder tab** as a collapsible sidebar panel. Not a separate page. Shows the 20 most recent items of each type. This keeps the UX focused — the builder is the primary surface, the gallery is secondary.
