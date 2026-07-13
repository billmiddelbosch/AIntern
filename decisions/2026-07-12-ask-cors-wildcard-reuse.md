## Decision: Reuse the existing `/mcp` wildcard-CORS (`Access-Control-Allow-Origin: *`) exception for the new `/ask` endpoint
scope: project

## Context
`/ask` is a new public, unauthenticated API Gateway resource on the same
Lambda as `/mcp`. Root `CLAUDE.md`'s Lambda Conventions section pre-approves
a wildcard-CORS exception specifically for `mcp-server.ts`, reasoning: the
public MCP endpoint serves non-browser JSON-RPC clients, carries no
cookies/auth, and only exposes data already world-readable in public S3
buckets. The task instructed reusing this exact exception for `/ask`, with a
referencing comment on the new API Gateway resource — which was done
(`infra/lib/admin-stack.ts`, `askResource` comment references the CEO-gate
exception).

## Alternatives considered
1. Reuse the wildcard exception as instructed (chosen).
2. Apply the project's standard `corsOrigin()` echo pattern (prod/dev
   allowlists) instead, since `/ask` is a materially more discoverable REST
   shape than `/mcp`'s JSON-RPC envelope.

## Reasoning
Confidentiality risk is unchanged from `/mcp` — same read-only public S3
content, same "no cookies/auth" posture. The task's explicit instruction was
to reuse the exact existing exception, and the underlying CEO-gate rationale
(non-browser clients, no auth, already-public data) applies equally to
`/ask`.

## Trade-offs accepted
Security review (2026-07-12, security-reviewer agent) flagged that `/ask`'s
plain GET/POST REST shape is meaningfully easier for generic scanners and
bulk bots to discover and hammer than `/mcp`'s protocol-gated JSON-RPC
surface — an availability/cost-amplification concern (hitting the shared
10rps/20burst throttle from unsophisticated traffic), not a confidentiality
one. The original CEO-gate approval for `/mcp` didn't explicitly weigh this
discoverability delta for a plain-REST sibling endpoint.

**This decision is provisional pending explicit CEO/human sign-off** — per
the task's closure requirements, the human must be asked to confirm the
CORS/public-endpoint reuse is still acceptable given this new
discoverability consideration before `cdk deploy` is run. Two cheap
hardening fixes were applied regardless of that outcome: `query_id` capped
at 200 chars (was unbounded, response-size amplification risk) and CDK CORS
preflight `allowHeaders` aligned with the Lambda's `ASK_HEADERS`.

## Supersedes
None.
