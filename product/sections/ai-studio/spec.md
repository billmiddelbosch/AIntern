# AI Studio — Specification

## Backlog ID
A-20 (Component Builder), A-21 (Template Builder)

## Last Updated
2026-05-07 — initial spec
2026-05-07 — DESIGN stage: atomic levels assigned, open questions resolved, sample data + types generated

---

## Overview

AI Studio is a two-tab admin section at `/admin/ai-studio`. It lets internal users generate Vue 3 single-file components and page templates via Claude AI, preview them live in a sandboxed iframe, iterate on them, and save them directly to the GitHub repository via a Lambda-backed GitHub API commit. A persistent gallery shows previously generated items.

The Component Builder saves to `src/components/ai-generated/` and the Template Builder saves to `src/views/`. The active Kennisbank template is controlled by a DynamoDB config record — no deploy required to switch.

---

## Routes

| Route | Name | Component | Auth |
|---|---|---|---|
| `/admin/ai-studio` | `admin-ai-studio` | `AdminAiStudioView.vue` | requiresAuth: true |

The single route contains both builders as tabs. No nested routes needed.

---

## Component Architecture

### Atomic Design Map

```
PAGE
  AdminAiStudioView.vue                  [PAGE]
    AiStudioHeader.vue                   [MOLECULE] — title, tab switcher
    ComponentBuilder.vue                 [ORGANISM] — full builder panel (used for BOTH tabs via `type` prop)
      AiPromptPanel.vue                  [MOLECULE] — textarea + generate button + AiGenerationStatus
      AiCodeEditor.vue                   [MOLECULE] — plain textarea with monospace font, copy button
      AiPreviewPane.vue                  [ORGANISM] — iframe sandbox + srcdoc compile/render logic
      AiSavePanel.vue                    [MOLECULE] — name input + save button + set-active toggle
      AiGalleryPanel.vue                 [ORGANISM] — collapsible list of AiGalleryCard items
        AiGalleryCard.vue                [MOLECULE] — single gallery item card
    AiGenerationStatus.vue               [ATOM] — spinner / error / success badge (src/components/ui/)
```

**DESIGN DECISION: TemplateBuilder is NOT a separate organism.**
The `ComponentBuilder` organism accepts a `type: 'component' | 'template'` prop and handles
both builders. This avoids duplicating the organism structure and reduces the component count by 1.
The `type` prop drives: mock data injection, "Set as active" toggle visibility, and gallery filtering.

### Atomic Level Assignments + Rationale

| Component | Atomic Level | Rationale |
|---|---|---|
| `AiGenerationStatus.vue` | **Atom** | Smallest indivisible status indicator. No project logic, no store imports. Purely driven by `status` prop. Reusable in any context. |
| `AiStudioHeader.vue` | **Molecule** | Composes heading text + two tab buttons into a navigation unit. Single responsibility: tab switching. No store imports. |
| `AiPromptPanel.vue` | **Molecule** | Composes label + textarea + character counter + generate button + status atom into a prompt-entry unit. |
| `AiCodeEditor.vue` | **Molecule** | Composes toolbar (copy button, language badge) + monospace textarea + line counter into a code-entry unit. |
| `AiSavePanel.vue` | **Molecule** | Composes name input + save button + optional toggle + confirmation into a persist unit. |
| `AiGalleryCard.vue` | **Molecule** | Composes name badge + instruction excerpt + file path + date + two action buttons into a gallery-item unit. |
| `AiPreviewPane.vue` | **Organism** | Owns compile domain logic (srcdoc builder, debounce watcher, error handling). Too complex for a molecule. |
| `AiGalleryPanel.vue` | **Organism** | Coordinates multiple AiGalleryCard molecules + collapse state + empty/loading states. Domain-aware. |
| `ComponentBuilder.vue` | **Organism** | Orchestrates all molecules + organisms + useAiStudio composable. Owns builder domain logic. |
| `AdminAiStudioView.vue` | **Page** | Thin route-level component. Manages active tab, lazy-loads compiler, delegates to ComponentBuilder organism. |

### Component Contracts

#### `AdminAiStudioView.vue` [PAGE]
- Manages active tab (`component` | `template`)
- Lazy-loads `@vue/compiler-dom` + `@vue/runtime-dom` on mount
- No props — top-level page

#### `AiStudioHeader.vue` [MOLECULE]
- Props: `activeTab: 'component' | 'template'`
- Emits: `update:activeTab`
- Renders: page title, two tab buttons

#### `ComponentBuilder.vue` / `TemplateBuilder.vue` [ORGANISM]
- Props: `type: 'component' | 'template'`
- Internally uses `useAiStudio(type)` composable for all state and actions
- Renders: `AiPromptPanel` + `AiCodeEditor` + `AiPreviewPane` + `AiSavePanel` + `AiGalleryPanel`

#### `AiPromptPanel.vue` [MOLECULE]
- Props: `modelValue: string`, `loading: boolean`
- Emits: `update:modelValue`, `generate`
- Renders: labelled textarea, "Generate" button, character count

#### `AiCodeEditor.vue` [MOLECULE]
- Props: `modelValue: string`, `language: 'vue'`
- Emits: `update:modelValue`
- Renders: `<textarea>` with monospace font (no external editor dependency for now — plain textarea keeps bundle lean; upgrade to Monaco in a later iteration)
- Note: live edit triggers re-compile in parent via watcher

#### `AiPreviewPane.vue` [ORGANISM]
- Props: `code: string`, `mockData?: Record<string, unknown>`
- Internal state: `compiledHtml: string`, `compileError: string | null`
- Watches `code` and recompiles on change (debounced 300ms)
- Renders: an `<iframe>` with `srcdoc` set to the compiled output; `sandbox="allow-scripts"` strictly enforced
- On compile error: shows error message in the preview pane instead of crashing

#### `AiSavePanel.vue` [MOLECULE]
- Props: `type: 'component' | 'template'`, `saving: boolean`, `savedName?: string`, `isActive?: boolean`
- Emits: `save(name: string)`, `setActive`
- Renders: name input, "Save to repo" button, optional "Set as active template" toggle (template type only), last saved indicator

#### `AiGalleryPanel.vue` [ORGANISM]
- Props: `items: AiGeneratedItem[]`, `loading: boolean`
- Emits: `load(item: AiGeneratedItem)`, `delete(id: string)`
- Renders: collapsible panel with a list of cards; each card shows name, instruction excerpt, date, Load and Delete actions

#### `AiGenerationStatus.vue` [ATOM]
- Props: `status: 'idle' | 'loading' | 'success' | 'error'`, `message?: string`
- No emits
- Renders: inline spinner, checkmark, or error badge

---

## Composables

### `useAiStudio(type: 'component' | 'template')`

Encapsulates all AI Studio state and side effects. Used by both builder organisms.

**State:**
```typescript
const prompt = ref<string>('')
const generatedCode = ref<string>('')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMessage = ref<string | null>(null)
const saveName = ref<string>('')
const saving = ref<boolean>(false)
const gallery = ref<AiGeneratedItem[]>([])
const galleryLoading = ref<boolean>(false)
const activeTemplateName = ref<string | null>(null)  // template type only
```

**Actions:**
```typescript
async function generate(): Promise<void>
async function save(): Promise<void>
async function setActiveTemplate(name: string): Promise<void>  // template only
async function fetchGallery(): Promise<void>
async function deleteGalleryItem(id: string): Promise<void>
function loadGalleryItem(item: AiGeneratedItem): void
```

**API calls:** via `adminAxios` to new Lambda endpoints (see API Contracts below).

---

## TypeScript Types

```typescript
// src/types/aiStudio.ts

export type AiStudioItemType = 'component' | 'template'

export interface AiGeneratedItem {
  id: string
  type: AiStudioItemType
  name: string
  instruction: string
  code: string
  filePath: string
  githubCommitSha: string
  createdAt: string
  createdBy: string
}

export interface AiGenerateRequest {
  type: AiStudioItemType
  instruction: string
}

export interface AiGenerateResponse {
  code: string
}

export interface AiSaveRequest {
  type: AiStudioItemType
  name: string
  instruction: string
  code: string
}

export interface AiSaveResponse {
  id: string
  filePath: string
  githubCommitSha: string
  createdAt: string
}

export interface AiTemplateConfig {
  activeTemplateName: string
  updatedAt: string
}
```

---

## Pinia Store

No new store needed. The `useAiStudio` composable is instantiated once per builder organism and does not need to be shared across the app. If cross-component sharing becomes necessary in a future iteration, it can be promoted to a Pinia store.

---

## API Contracts

All endpoints are under the existing admin API Gateway. All require the admin JWT Bearer token via `Authorization` header.

### `POST /admin/ai-studio/generate`

Generate Vue SFC code from a natural language instruction.

**Request:**
```json
{
  "type": "component" | "template",
  "instruction": "Create a pricing card with title, price, and CTA button"
}
```

**Response 200:**
```json
{
  "code": "<script setup lang=\"ts\">...</script>\n<template>...</template>"
}
```

**Response 400:** instruction too short or missing type
**Response 500:** Claude API error

**Lambda logic:**
1. Validate request
2. Call Anthropic Claude API (claude-sonnet-4-6, max_tokens: 4096)
3. System prompt instructs Claude to return a clean, compilable Vue 3 SFC using `<script setup lang="ts">`, Tailwind CSS for styling, and no external imports
4. Extract the code block from the Claude response
5. Return `{ code }`

**System prompt (component):**
```
You are a Vue 3 component generator. Generate a single-file Vue component (SFC) using <script setup lang="ts"> syntax.
Rules:
- Use Tailwind CSS classes only for styling — no custom CSS
- No external imports beyond vue (ref, computed, defineProps, etc.)
- The component must be fully self-contained
- Return ONLY the .vue file content, no explanation, no markdown fences
- The component must compile cleanly with the Vue runtime compiler
```

**System prompt (template):**
```
You are a Vue 3 page template generator for a kennisbank (knowledge base) article page.
The template receives these props: { title: string, body: string, publishedAt: string, readingTimeMinutes: number, category: string }
Rules:
- Use Tailwind CSS classes only for styling — no custom CSS
- Use <script setup lang="ts"> syntax
- Import and use defineProps for the above props
- No router-link or other app-level imports
- The template must be fully self-contained and compilable
- Return ONLY the .vue file content
```

---

### `POST /admin/ai-studio/save`

Write the generated SFC to the GitHub repository and persist metadata to DynamoDB.

**Request:**
```json
{
  "type": "component",
  "name": "PricingCard",
  "instruction": "Create a pricing card...",
  "code": "<script setup lang=\"ts\">...</script>..."
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "filePath": "src/components/ai-generated/PricingCard.vue",
  "githubCommitSha": "abc123",
  "createdAt": "2026-05-07T12:00:00Z"
}
```

**Response 400:** invalid name (not PascalCase, or name already taken), missing fields
**Response 409:** file already exists at that path
**Response 500:** GitHub API error or DynamoDB error

**Lambda logic:**
1. Validate PascalCase name (regex: `/^[A-Z][a-zA-Z0-9]+$/`)
2. Derive `filePath`:
   - `component` → `src/components/ai-generated/{name}.vue`
   - `template` → `src/views/{name}.vue`
3. Call GitHub API: `PUT /repos/{owner}/{repo}/contents/{filePath}` with base64-encoded content and commit message `"feat(ai-studio): add {name}.vue via AI Studio"`
4. On 422 (file exists): return 409
5. Write DynamoDB record with all metadata fields + `githubCommitSha` from response
6. Return `{ id, filePath, githubCommitSha, createdAt }`

**GitHub credentials:** PAT retrieved from AWS Secrets Manager at secret path `/aintern/{alias}/github/pat`. Must have `repo` scope (content write).

---

### `GET /admin/ai-studio/gallery?type=component&limit=20`

Fetch gallery items for the given type.

**Response 200:**
```json
{
  "items": [AiGeneratedItem, ...]
}
```

DynamoDB query: PK `AI_STUDIO#{type}`, sort by `createdAt` descending, limit 20.

---

### `DELETE /admin/ai-studio/gallery/{id}`

Delete a gallery record from DynamoDB. Does NOT delete the file from the repo.

**Response 204:** success
**Response 404:** item not found

---

### `GET /admin/ai-studio/template-config`

Return the currently active Kennisbank template name.

**Response 200:**
```json
{
  "activeTemplateName": "KennisbankArtikelView",
  "updatedAt": "2026-05-07T12:00:00Z"
}
```

DynamoDB: single record at PK `CONFIG#kennisbank-template`.

---

### `PUT /admin/ai-studio/template-config`

Set the active Kennisbank template.

**Request:**
```json
{ "activeTemplateName": "KennisbankArtikelViewMinimal" }
```

**Response 200:**
```json
{ "activeTemplateName": "KennisbankArtikelViewMinimal", "updatedAt": "..." }
```

**Lambda logic:** Validate name is a valid PascalCase Vue component name, then upsert the DynamoDB config record.

---

## DynamoDB Schema

Extends the existing AIntern single-table design.

### Gallery items

| Attribute | Value |
|---|---|
| PK | `AI_STUDIO#component` or `AI_STUDIO#template` |
| SK | `ITEM#{createdAt}#{id}` (sortable by creation time) |
| id | UUID |
| name | PascalCase component name |
| instruction | Full prompt string |
| code | Generated SFC source |
| filePath | Repo path |
| githubCommitSha | Commit SHA |
| createdAt | ISO-8601 |
| createdBy | Admin user ID |

### Template config

| Attribute | Value |
|---|---|
| PK | `CONFIG#kennisbank-template` |
| SK | `LATEST` |
| activeTemplateName | e.g. `KennisbankArtikelView` |
| updatedAt | ISO-8601 |

---

## iframe Preview — Technical Detail

The preview uses the Vue runtime compiler loaded as a dynamic import to keep the admin route lean.

**Compile pipeline:**

```typescript
// Inside AiPreviewPane.vue (simplified)
import { compileToFunction } from '@vue/compiler-dom'
import { createApp, h } from 'vue'

// 1. Extract template block from SFC code string
function extractTemplate(sfc: string): string { ... }

// 2. Compile template to render function
const render = compileToFunction(templateHtml, { ... })

// 3. Build a mini-app and render into a div
const app = createApp({ render })
app.mount(iframeDocument.body)

// 4. The iframe's srcdoc includes:
//    - Tailwind CDN (for styling)
//    - The compiled app mounting code
//    - A minimal Vue CDN shim (if needed)
```

**Sandbox attribute:** `sandbox="allow-scripts"` — this prevents the iframe content from accessing `window.parent`, `document.cookie`, localStorage, or making navigations. The generated component code runs in a fully isolated context.

**Error handling:** A `try/catch` around the compilation step catches all Vue compiler errors. The error message is displayed in the preview pane with a red border and the raw error text.

**Mock data for templates:** When `type === 'template'`, `AiPreviewPane` receives `mockData` with a sample article:
```typescript
const MOCK_ARTICLE = {
  title: 'AI automatisering voor het MKB: zo begin je',
  body: '<p>Dit is een voorbeeldartikel...</p>',
  publishedAt: '2026-05-07',
  readingTimeMinutes: 4,
  category: 'AI Automatisering',
}
```

---

## Active Template — Kennisbank Integration

The `KennisbankArtikelView.vue` route currently hard-codes the article layout inline. After this feature is built, it will dynamically load the active template:

```typescript
// Proposed change to KennisbankArtikelView.vue
const { data: templateConfig } = await adminAxios.get('/admin/ai-studio/template-config')
// Then dynamically import the component by name
const TemplateComponent = defineAsyncComponent(
  () => import(`@/views/${templateConfig.activeTemplateName}.vue`)
)
```

**Note:** Dynamic component import by runtime string requires Vite to know all possible template names at build time (via glob import) OR the templates must be pre-registered. During DESIGN stage, we will resolve the exact mechanism (glob import map is the preferred approach).

This is a **breaking change to `KennisbankArtikelView.vue`** — spec for that file must be updated when this feature is implemented.

---

## File Plan

```
# Design-stage prototype (created in DESIGN stage)
src/
  components/sections/ai-studio/
    AdminAiStudioScreen.vue             [PAGE prototype]
    AiStudioHeader.vue                  [MOLECULE]
    ComponentBuilder.vue                [ORGANISM — handles both component + template tabs]
    AiPromptPanel.vue                   [MOLECULE]
    AiCodeEditor.vue                    [MOLECULE]
    AiPreviewPane.vue                   [ORGANISM]
    AiSavePanel.vue                     [MOLECULE]
    AiGalleryPanel.vue                  [ORGANISM]
    AiGalleryCard.vue                   [MOLECULE]
    index.ts                            [barrel export]
  components/ui/
    AiGenerationStatus.vue              [ATOM] — new reusable atom
  views/sections/
    AiStudioView.vue                    [router view, design prototype]

# Implementation targets (created in IMPLEMENT stage)
src/
  views/admin/
    AdminAiStudioView.vue               [PAGE — replaces prototype]
  components/admin/ai-studio/
    AiStudioHeader.vue                  [MOLECULE]
    ComponentBuilder.vue                [ORGANISM]
    AiPromptPanel.vue                   [MOLECULE]
    AiCodeEditor.vue                    [MOLECULE]
    AiPreviewPane.vue                   [ORGANISM]
    AiSavePanel.vue                     [MOLECULE]
    AiGalleryPanel.vue                  [ORGANISM]
    AiGalleryCard.vue                   [MOLECULE]
  composables/
    useAiStudio.ts                      [composable]
  types/
    aiStudio.ts                         [types]
lambda/
  ai-studio-generate.ts                 [Lambda handler]
  ai-studio-save.ts                     [Lambda handler]
  ai-studio-gallery.ts                  [Lambda handler — GET + DELETE]
  ai-studio-template-config.ts          [Lambda handler — GET + PUT]
product/sections/ai-studio/
  vision.md                             [vision document]
  spec.md                               [this spec document]
  data.json                             [sample data — created in DESIGN stage]
  types.ts                              [TypeScript prop/emit interfaces — created in DESIGN stage]
```

---

## i18n Keys Required

```json
// en.json additions
{
  "admin": {
    "nav": {
      "aiStudio": "AI Studio"
    },
    "aiStudio": {
      "pageTitle": "AI Studio",
      "tabs": {
        "component": "Component Builder",
        "template": "Template Builder"
      },
      "prompt": {
        "label": "Describe what you want to build",
        "placeholder": "e.g. A pricing card with a title, price, and a CTA button",
        "generate": "Generate",
        "regenerate": "Regenerate"
      },
      "preview": {
        "title": "Preview",
        "compileError": "Compile error"
      },
      "save": {
        "nameLabel": "Component name (PascalCase)",
        "saveButton": "Save to repo",
        "setActive": "Set as active Kennisbank template",
        "saving": "Saving...",
        "saved": "Saved as {name}",
        "error": "Save failed"
      },
      "gallery": {
        "title": "Previously generated",
        "empty": "No items yet",
        "load": "Load",
        "delete": "Delete"
      }
    }
  }
}
```

---

## Acceptance Criteria (testable)

### Component Builder
- [ ] Navigating to `/admin/ai-studio` renders the page without error when authenticated
- [ ] Typing a prompt and clicking "Generate" triggers a POST to `/admin/ai-studio/generate` and shows a loading state
- [ ] A valid Claude response populates the code editor and renders in the iframe preview
- [ ] A Claude error shows an error toast and leaves the editor unchanged
- [ ] Editing the code in the code editor updates the preview within 500ms
- [ ] Entering a PascalCase name and clicking "Save to repo" triggers a POST to `/admin/ai-studio/save`
- [ ] A successful save shows a success toast with the component name
- [ ] The gallery panel refreshes after a successful save
- [ ] An invalid name (not PascalCase) shows a validation error before submitting

### Template Builder
- [ ] Switching to the "Template Builder" tab renders the template builder organism
- [ ] Generated template preview uses mock article data
- [ ] "Set as active template" toggle appears only in the Template Builder
- [ ] Clicking "Set as active" calls `PUT /admin/ai-studio/template-config`

### Gallery
- [ ] Gallery items load on mount via `GET /admin/ai-studio/gallery?type=component`
- [ ] Clicking "Load" on a gallery item populates the instruction textarea and code editor
- [ ] Clicking "Delete" removes the item from the gallery (calls DELETE endpoint)

### Security
- [ ] The iframe `sandbox` attribute includes `allow-scripts` and does NOT include `allow-same-origin`
- [ ] Unauthenticated requests to any `/admin/ai-studio/*` endpoint return 401

---

## Open Questions — Resolved in DESIGN stage

### OQ-1: Dynamic template import mechanism — RESOLVED
**Decision: Vite glob import map keyed by template name.**

```typescript
// In KennisbankArtikelView.vue (to be updated at IMPLEMENT stage)
const templateModules = import.meta.glob('@/views/Kennisbank*.vue')

async function loadActiveTemplate(name: string) {
  const key = `/src/views/${name}.vue`
  if (!templateModules[key]) throw new Error(`Template not found: ${name}`)
  return (await templateModules[key]() as { default: Component }).default
}
```

Vite pre-scans the glob pattern at build time. Any `Kennisbank*.vue` in `src/views/` is
automatically included in the bundle. New templates saved via AI Studio become available
after the next build/deploy — no code change needed.

**Why not option (b) or (c):**
- (b) lazy route swap: requires CDK/router redeploy
- (c) static import of all templates: N imports hardcoded in the view file — defeats the purpose

### OQ-2: Code editor DX — RESOLVED
**Decision: Plain `<textarea>` with monospace font (IBM Plex Mono).**

`AiCodeEditor.vue` uses a dark-surface textarea (bg-slate-900 text-slate-100).
No syntax highlighting library added. Rationale: the primary use case is reading the
generated code and making minor edits. Monaco or CodeMirror would add ~500KB+ to the
admin bundle and require dynamic import setup. Upgrade path: swap `AiCodeEditor.vue`
in place at a later iteration without changing the organism/page contracts.

### OQ-3: Tailwind in iframe — RESOLVED
**Decision: Tailwind CDN play CDN injected into srcdoc.**

```html
<script src="https://cdn.tailwindcss.com"></script>
```

Added directly to the srcdoc `<head>`. This is the correct approach for an isolated preview
context. The CDN call adds ~30ms latency on the first preview, which is acceptable.
The alternative (embed scoped CSS bundle) would require extracting Tailwind output at
build time and injecting it as a `<style>` block — significantly more complex.

### OQ-4: GitHub PAT scope — NOT RESOLVED HERE
Flagged for CEO review per Lambda CORS/security gate (see CLAUDE.md).
Fine-grained token with `contents:write` on the target repo is preferred.
Current spec documents `repo` scope as the safe default.

### OQ-5: 409 conflict / overwrite — RESOLVED
**Decision: No overwrite. User must choose a different name.**

`AiSavePanel.vue` shows an inline error when `conflictError` prop is true:
"Een bestand met deze naam bestaat al in de repo — kies een andere naam."

The name input field switches to red styling. The Save button remains disabled until
the name is changed. No "force overwrite" option is provided — prevents accidental
replacement of intentionally saved components.
