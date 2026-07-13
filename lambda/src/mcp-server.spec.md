# MCP Server Lambda — Spec

**Last Updated:** 2026-07-12 — added NLWeb-protocol-compatible `/ask` REST endpoint alongside the existing `/mcp` JSON-RPC endpoint (same Lambda, same handler file, dispatched by `event.resource`). Hardened per security-reviewer pass: `query_id` capped at 200 chars (was unbounded) to prevent response-size amplification; CDK CORS preflight `allowHeaders` aligned with `ASK_HEADERS`.

## Function Purpose

Public, stateless, unauthenticated Lambda that serves AIntern's Kennisbank + NewsFlow Q&A content to AI clients over two protocols on the same function:

- **`POST /mcp`** — Model Context Protocol, Streamable HTTP stateless JSON mode (JSON-RPC 2.0). Full tool surface: `search_answers`, `list_questions`, `get_article`, plus ChatGPT-connector aliases `search`/`fetch`.
- **`GET|POST /ask`** — [NLWeb protocol](https://github.com/nlweb-ai/NLWeb)-compatible REST search endpoint, `list` mode only, for AI clients and NLWeb-aware crawlers that don't want to speak full MCP JSON-RPC.

Both routes share one Lambda (`aintern-mcp-server`) so the S3-backed Q&A cache, config, and cold-start cost are not duplicated.

## Handler Name

`mcp-server.handler`

## Runtime

- Node.js 22.x
- No external dependencies bundled — `esbuild --bundle` with `--external:@aws-sdk/*` (this Lambda makes zero AWS SDK calls; it only does plain `fetch()` against public S3 HTTP URLs)
- Bundle script: `npm run bundle:mcp-server` (in `lambda/`)

## Event Source

API Gateway (REST API, `AWS_PROXY` / Lambda proxy integration), two resources on the same `aintern-admin` API:

| Resource | Methods | Auth |
|---|---|---|
| `/mcp` | `POST`, `GET`, `DELETE`, `OPTIONS` | None (public) |
| `/ask` | `GET`, `POST`, `OPTIONS` | None (public) |

Routing inside the handler: `event.resource === '/ask'` dispatches to `handleAsk()`; everything else falls through to the existing `/mcp` JSON-RPC logic. Same dispatch pattern already used in `admin-auth.ts`.

## Handler Signature

```typescript
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult>
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `KENNISBANK_BASE_URL` | `https://aintern-kennisbank.s3.eu-west-2.amazonaws.com` | Public S3 base for Kennisbank `qa.json` + `posts/{slug}.json` |
| `NEWSFLOW_BASE_URL` | `https://aintern-newsflow.s3.eu-west-2.amazonaws.com` | Public S3 base for NewsFlow `qa.json` + `posts/{slug}.json` |

No secrets, no SSM parameters — this Lambda only reads world-readable public JSON over HTTPS.

## IAM Permissions

None beyond the default CloudWatch Logs role. No `dynamodb:*`, no `s3:*` (S3 buckets are fetched via public HTTPS URL, not the SDK). Unchanged by the `/ask` addition — same Lambda, same permissions.

## `/mcp` — JSON-RPC Contract (unchanged by this feature)

See existing tool definitions (`search_answers`, `list_questions`, `get_article`, `search`, `fetch`) in `mcp-server.ts`. Not repeated here — this spec's net-new content is `/ask`.

## `/ask` — NLWeb REST Contract

### Request

GET query params or POST JSON body (both supported — NLWeb callers commonly use simple GET):

| Param | Type | Required | Behavior |
|---|---|---|---|
| `query` | string | required unless `decontextualized_query` given | Search text, Dutch works best |
| `site` | string | no | Filters to `kennisbank` or `newsflow`; invalid/unrecognized values are ignored (no filter applied) — same permissive behavior as the MCP `search_answers` tool's `source` arg |
| `prev` | string (comma-separated) | no | **Accepted but ignored.** No LLM-based decontextualization in this pass — see Scope Cuts |
| `decontextualized_query` | string | no | If present, used as the actual search query instead of `query` (caller already decontextualized; no LLM call needed here) |
| `mode` | `list` \| `summarize` \| `generate` | no | **Only `list` behavior is implemented.** Any value still returns the list-shaped result — see Scope Cuts |
| `streaming` | boolean | no | **Always ignored.** Always a single complete JSON response — see Scope Cuts |
| `query_id` | string | no | Echoed back if provided (capped at 200 chars — security hardening, prevents response-size amplification via an unbounded echoed value); otherwise generated via `randomUUID()` |

### Response — `200 application/json`

```json
{
  "query_id": "string",
  "results": [
    {
      "url": "https://aintern.nl/kennisbank/ai-agent-kosten",
      "name": "Wat kost een AI-agent?",
      "site": "kennisbank",
      "score": 7,
      "description": "Vanaf enkele honderden euro per maand.",
      "schema_object": {
        "@type": "Question",
        "name": "Wat kost een AI-agent?",
        "text": "Wat kost een AI-agent?",
        "dateCreated": "2026-06-01",
        "url": "https://aintern.nl/kennisbank/ai-agent-kosten",
        "acceptedAnswer": { "@type": "Answer", "text": "Vanaf enkele honderden euro per maand." }
      }
    }
  ]
}
```

No matches → `200` with `results: []` (not an error — matches NLWeb convention, unlike the MCP tool's Dutch "no results" text message).

Missing `query` (and no `decontextualized_query`) → `400 { "error": "query is required" }`.

Result count is capped at `ASK_DEFAULT_LIMIT = 10` (no `limit`/`top_n` param defined in the NLWeb contract as scoped for this pass — fixed server-side default, consistent with other tools' defaults in this file).

### Scope Cuts (deliberate — documented in code comments too)

| Cut | Reason |
|---|---|
| `mode=summarize`/`generate` not implemented | Would require an LLM call; out of scope for this pass. Falls back to `list` behavior rather than erroring. |
| `streaming` always ignored | API Gateway REST API + Lambda proxy integration (`APIGatewayProxyResult`) cannot do SSE/chunked streaming. True streaming would need a Function URL with response streaming — a separate infra shape not justified for this endpoint. |
| `prev` accepted but ignored | No LLM-based decontextualization in this pass; `decontextualized_query` is the supported override path when the caller has already resolved context. |
| No article-fetch route on `/ask` | NLWeb's spec only defines `/ask` for search. Full-article fetching stays MCP-only (`get_article`/`fetch` tools). |

## DynamoDB Integration

None. This Lambda has no DynamoDB access.

## CORS

Both `/mcp` and `/ask` use `Access-Control-Allow-Origin: *` — an approved, CEO-gate-reviewed exception to the project's `corsOrigin()` echo pattern (see root `CLAUDE.md`, Lambda Conventions → "Approved exception — mcp-server.ts"). Rationale: non-browser JSON clients (Claude, ChatGPT, NLWeb crawlers, MCP Inspector), no cookies/auth, read-only public content already world-readable in S3. `/ask` uses its own header builder (`ASK_HEADERS`/`askResponse()`) separate from `/mcp`'s JSON-RPC `BASE_HEADERS`/`httpResponse()`, since it's plain JSON REST rather than JSON-RPC, but the CORS policy and security headers are identical in substance.

**CEO review gate applies**: this is a new public API Gateway resource with wildcard CORS — must be reviewed before `cdk deploy`, per the same gate that covers `/mcp`.

## Error Handling

| Scenario | `/ask` behavior |
|---|---|
| Missing `query` and `decontextualized_query` | `400 { error: "query is required" }` |
| Malformed JSON body on POST | Falls through to empty params object → treated as missing `query` → `400` |
| Method other than GET/POST/OPTIONS | `405` with `Allow: GET, POST` |
| No search matches | `200` with `results: []` (not an error) |
| Invalid `site` value | Ignored — no source filter applied, not an error |
| S3 fetch failure (Kennisbank or NewsFlow) | `loadQaItems()` degrades gracefully per source (logs a `WARN`, returns `[]` for that source) — unchanged from `/mcp` behavior; `/ask` search just runs against whatever loaded successfully |

## Performance

- **Memory:** 256 MB (existing `mcpServerFn` allocation, unchanged)
- **Timeout:** 15 seconds (existing, unchanged)
- **Cold start:** Q&A cache is module-level with a 10-minute TTL, shared between `/mcp` and `/ask` — a warm `/mcp` request also warms `/ask` and vice versa
- **Throttling:** `askThrottle` mirrors `mcpThrottle` — `throttlingRateLimit: 10`, `throttlingBurstLimit: 20` per stage, applied to both `/ask/GET` and `/ask/POST`

## Monitoring

Reuses the existing structured JSON console logs from `loadQaItems()`/`fetchSourceQa()` (`level: WARN` on per-source S3 fetch failure). No new log lines added specifically for `/ask` — request-level detail is visible via API Gateway access logs (method, resource, status) same as `/mcp`.

## Acceptance Criteria

- [x] `GET /ask?query=...` returns `200` with `results[]`, each with `url`, `name`, `site`, `score`, `description`, `schema_object`
- [x] `POST /ask` with JSON body `{ "query": "..." }` returns the same response shape as GET
- [x] `site` param filters results to the matching source; invalid values are ignored, not errors
- [x] No matches → `200` with `results: []`, not an error
- [x] `decontextualized_query` overrides `query` when both are present
- [x] `mode` and `streaming` params are accepted without erroring and never change the response shape (always list-mode, always non-streaming)
- [x] Missing `query` (and no `decontextualized_query`) → `400`
- [x] `query_id` is echoed back when supplied, otherwise generated
- [x] `OPTIONS /ask` returns `204` with wildcard CORS headers
- [x] `searchQa()`'s existing signature and behavior are unchanged (covered by pre-existing tests) — new `searchQaScored()` shares its filter/score/sort core
- [x] No new IAM permissions introduced; same Lambda, same role
- [x] `/mcp` behavior and all its existing tests are unaffected by the `/ask` addition
