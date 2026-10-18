## Decision: Serve the new NLWeb `/ask` REST endpoint from the existing `mcpServerFn` Lambda, not a new function
scope: project

## Context
Adding an NLWeb-protocol-compatible `/ask` search endpoint so AI clients and
NLWeb-aware crawlers can query Kennisbank + NewsFlow Q&A content without
speaking full MCP JSON-RPC. The task explicitly required reusing the existing
Lambda rather than creating a second one.

## Alternatives considered
1. New dedicated `aintern-ask` Lambda with its own bundle script, IAM role,
   and API Gateway resource.
2. Reuse `mcpServerFn`, dispatch on `event.resource` inside the existing
   handler (chosen).

## Reasoning
`/ask` needs the exact same data-access layer as `/mcp`'s `search_answers`
tool: same S3-backed Q&A cache (`loadQaItems()`, `qaCache` with 10-min TTL),
same env vars (`KENNISBANK_BASE_URL`/`NEWSFLOW_BASE_URL`), same IAM scope
(none beyond default CloudWatch Logs role), same memory/timeout profile. A
second Lambda would duplicate the cache (double the S3 reads, double the
cold-start cost) for zero isolation benefit — there's no different
trust boundary, permission scope, or resource-limit need between the two
routes. Precedent already exists in this codebase (`admin-auth.ts` dispatches
multiple admin routes off one Lambda via `event.resource`).

## Trade-offs accepted
- The two routes are coupled: a bug or resource-limit issue in one can
  affect the other (shared memory/timeout budget, shared cache).
- Slightly larger single bundle (22.4kb total for `mcp-server.js`) instead of
  two smaller ones — negligible at this size.
- API Gateway throttling is configured per-method (`/mcp/POST`, `/ask/GET`,
  `/ask/POST` each get independent 10rps/20burst buckets), not a shared
  stage-level cap — flagged by security-reviewer as a real increase in
  achievable aggregate load against the shared Lambda, accepted as a
  cost/availability tradeoff rather than a security bug (see companion
  decision on CORS reuse for the related discoverability point).

## Supersedes
None — first decision recorded for this project.
