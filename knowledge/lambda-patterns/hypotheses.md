# Lambda Patterns — Hypotheses

## `vi.resetModules()` + dynamic re-import to isolate module-level caches in Vitest

**[CONFIRMED x1]** — 2026-07-12, `lambda/src/mcp-server.test.ts`.

Handlers with a module-level in-memory cache (e.g. `mcp-server.ts`'s `qaCache`,
10-min TTL, warmed on first `loadQaItems()` call) leak cache state across
`describe` blocks in the same test file when the file statically imports the
handler once at the top. A later `describe` block's own `fetch` stub is never
actually consulted if an earlier block already warmed the cache — tests can
pass by coincidence (fixture data happens to overlap) and fail unpredictably
when it doesn't.

Fix used: inside the affected `describe` block's `beforeEach`, call
`vi.resetModules()` then `await import('./mcp-server')` to get a fresh module
instance (fresh cache) scoped to just that block, and use that dynamically
imported handler instead of the statically imported one for every test in
the block.

Alternative considered and rejected: adding a test-only cache-reset export to
the production handler. Rejected to avoid adding test-only surface area to
shipped code.

**Would this generalize to other handlers with module-level caches in this
repo?** Likely yes — worth re-confirming next time a handler with a similar
cache pattern gets test coverage added or extended, then promote to rules.md.

scope: project
