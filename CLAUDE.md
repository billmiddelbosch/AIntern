# CLAUDE.md — AIntern

## Project Overview

AIntern is a Vue 3 application scaffolded with Vite, TypeScript, and a full plugin suite including routing, state management, testing, and internationalisation.

## Tech Stack

- **Framework**: Vue 3 (latest) with Composition API
- **Language**: TypeScript ~5.7
- **Build Tool**: Vite 6.x
- **Package Manager**: npm
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` — no tailwind.config.ts needed)
- **HTTP Client**: Axios (configured instance at `src/lib/axios.ts`)
- **Composition Utilities**: VueUse (`@vueuse/core`)
- **i18n**: vue-i18n v11 (Composition API mode, `legacy: false`), EN + NL
- **Unit Testing**: Vitest 3 + @vue/test-utils + jsdom
- **E2E Testing**: Playwright

## Project Structure

```
src/
├── assets/          # Static assets; main.css imports Tailwind via @import "tailwindcss"
├── components/      # Reusable components (PascalCase .vue files)
│   └── ui/          # Base UI primitives
├── composables/     # Composables — useXxx.ts pattern
├── layouts/         # Layout wrapper components
├── lib/             # Third-party configurations
│   ├── axios.ts     # Configured axios instance with interceptors
│   └── i18n.ts      # vue-i18n setup with typed message schema
├── locales/         # Translation JSON files (en.json, nl.json)
├── router/          # Vue Router — src/router/index.ts
├── stores/          # Pinia stores — useXxxStore.ts pattern
├── test/            # Vitest global setup (setup.ts)
├── types/           # Shared TypeScript interfaces and types
├── utils/           # Pure utility functions
├── views/           # Page-level components mapped to routes
├── App.vue
└── main.ts
e2e/                 # Playwright E2E tests (excluded from Vitest)
```

## Coding Standards

- Use the **Composition API** with `<script setup>` syntax exclusively — never Options API
- TypeScript everywhere; avoid `any` types
- Name components in PascalCase (e.g., `UserProfile.vue`)
- Name composables with `use` prefix (e.g., `useAuth.ts`)
- Name Pinia stores with `use` prefix and `Store` suffix (e.g., `useAuthStore`)
- Use `defineProps` and `defineEmits` with TypeScript generics
- Use `RouterLink` for internal navigation — never bare `<a>` tags
- API calls go through `src/lib/axios.ts` — wrap in composables under `src/composables/`
- Global state lives in Pinia stores; local state uses `ref` / `reactive`

## Path Alias

`@/` maps to `src/` — configured in both `vite.config.ts` and `tsconfig.app.json`.

## i18n

- Add all user-facing strings to `src/locales/en.json` and `src/locales/nl.json`
- Access in components: `const { t } = useI18n()`
- The message schema is typed via `MessageSchema` in `src/lib/i18n.ts`

## Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Unit tests (Vitest)
npm run test:unit

# E2E tests (Playwright)
npm run test:e2e

# Lint and auto-fix
npm run lint

# Lint check only (no fix)
npm run lint:check

# Format source files
npm run format

# Type check
npm run type-check
```

## Decision Rules

These rules fire automatically based on the type of work being done. No need to invoke them manually.

| Trigger                                                                      | Action                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working with an external library (Vue, Pinia, VueUse, Axios, vue-i18n, Vite) | Fetch live docs via **Context7** MCP before writing code — never rely on training-data API knowledge                                                                                                          |
| A `.vue` or `.ts` file is modified                                           | Run `npm run build` before marking the task complete — this runs `vue-tsc -b` (stricter than `--noEmit`, catches template type errors) followed by the full Vite build. Fix all errors before reporting done. |
| Any `.vue`, `.ts`, or `.js` file under `src/` or `lambda/` is modified       | Invoke **security-auditor** agent before the task is closed                                                                                                                                                   |
| Any outreach, lead-send, LinkedIn message, or email action                   | Require **explicit user approval** before executing — never auto-send                                                                                                                                         |

## Lambda Conventions

### CORS Origin — mandatory pattern for every Lambda handler

Every Lambda handler that returns HTTP responses **must** use this exact `corsOrigin` + `respond` pattern. Do not deviate.

```typescript
const PROD_ORIGINS = new Set(['https://aintern.nl', 'https://www.aintern.nl'])

function corsOrigin(alias: string, requestOrigin?: string): string {
  if (alias === 'prod') {
    if (requestOrigin && PROD_ORIGINS.has(requestOrigin)) return requestOrigin
    return 'https://aintern.nl'
  }
  if (alias === 'dev') {
    if (requestOrigin === 'http://localhost:5173') return requestOrigin
    return 'https://test.aintern.nl'
  }
  return 'http://localhost:5173'
}

function respond(
  statusCode: number,
  body: unknown,
  alias: string,
  requestOrigin?: string,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin(alias, requestOrigin),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  }
}
```

- Extract the alias from the function ARN: `context.invokedFunctionArn.split(':').pop() ?? 'dev'`
- Extract the request origin at the top of every handler: `const requestOrigin = event.headers['origin'] ?? event.headers['Origin']`
- Pass `requestOrigin` as the 4th argument to every `respond()` call site
- Sub-handlers without `event` access must receive `requestOrigin?: string` as a parameter

**Why:** Both `dev` and `prod` serve multiple origins (`www.aintern.nl` + `aintern.nl` for prod; `test.aintern.nl` + `localhost:5173` for dev). Returning a hardcoded single origin blocks the other caller. The handler must echo the validated request origin.

**CEO review gate:** The CEO must verify this mapping whenever a new Lambda handler is created, a new environment/domain is added, or `corsOrigin` is modified. The API Gateway CDK preflight list (`infra/lib/admin-stack.ts` → `allowOrigins`) must also include all allowed origins.

**Approved exception — `mcp-server.ts`:** the public MCP endpoint (`POST /mcp`) intentionally uses `Access-Control-Allow-Origin: *` instead of the `corsOrigin` echo pattern. It serves non-browser JSON-RPC clients (Claude, ChatGPT, MCP Inspector), carries no cookies or auth, and only exposes data that is already world-readable in the public S3 buckets. Its `/mcp` API Gateway resource has its own wildcard preflight override. Do not "fix" this back to the echo pattern; any change to this handler still goes through the CEO review gate.

## Important Notes

- Tailwind CSS v4: do **not** create a `tailwind.config.ts` — all config is done via CSS theme variables if needed
- ESLint uses flat config (`eslint.config.ts`, ESLint 9+) — no `.eslintrc` files
- Vitest config explicitly excludes `e2e/**` to prevent Playwright specs being picked up
- The `src/test/setup.ts` registers i18n globally for all Vue Test Utils component tests
- `VITE_API_BASE_URL` env var controls the axios base URL (defaults to `/api`)

## Subagents

Spawn subagents to isolate context, parallelize independent work, or offload bulk mechanical tasks. Don't spawn when the parent needs the reasoning, when synthesis requires holding things together, or when spawn overhead dominates.

Pick the cheapest model that can do the subtask well:

- Haiku: bulk mechanical work, no judgment
- Sonnet: scoped research, code exploration, in-scope synthesis
- Opus: subtasks needing real planning or tradeoffs

If a subagent realizes it needs a higher tier than itself, return to the parent.

Parent owns final output and cross-spawn synthesis. User instructions override.

## Preferred Tools

### Data Fetching

1. **WebFetch**: free, text-only, works on public pages that don't block bots.
2. **agent-browser CLI**: free, local Rust CLI + Chrome via CDP. For dynamic pages or auth walls that WebFetch can't handle. Returns the accessibility tree with element refs (@e1, @e2). ~82% fewer tokens than screenshot-based tools. Install: `npm i -g agent-browser && agent-browser install`. Use `snapshot` for AI-friendly DOM state, element refs for interaction.
3. **Notice recurring fetch patterns and propose wrapping them as dedicated tools.** When the same fetch/parse logic comes up more than once, suggest wrapping it as a named tool (e.g. a skill file or a .py script that calls `agent-browser` with the snapshot and extraction steps baked in for that source). Add the entry to `## Dedicated Tools` below and reference it by name on future calls.

### PDF Files

Use 'pdftotext', not the 'Read' tool. Use 'Read' only when the user directly asks to analyze images or charts inside the document. Read loads PDFs as images.
