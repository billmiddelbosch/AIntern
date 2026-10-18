# Lambda Patterns — Knowledge

## Multi-route-per-Lambda dispatch via `event.resource`

**[CONFIRMED x2]** — `admin-auth.ts` (`/admin/login` vs other admin routes) and
`mcp-server.ts` (`/mcp` vs `/ask`, added 2026-07-12) both use the same pattern:
one Lambda function backs multiple API Gateway resources, and the handler
dispatches on `event.resource === '<path>'` before falling through to the
default route's logic.

This works reliably in this project because every API Gateway integration is
`AWS_PROXY` (Lambda proxy) with concrete resource paths — no `{proxy+}`
greedy wildcard resources are in use, so `event.resource` is always an exact,
predictable string rather than something requiring parsing.

**When to reach for this instead of a new Lambda function:** when the new
route shares config, caching, or a data-access layer with an existing
handler and doesn't need different IAM permissions, memory, or timeout. Saves
cold-start duplication and avoids a second `bundle:<name>` script for
near-identical logic. If the new route needs materially different IAM scope
or resource limits, prefer a separate handler instead.

scope: project
