---
name: Lambda CORS Origin Convention
description: Mandatory corsOrigin() + respond() pattern for all Lambda handlers; dev alias must echo request origin, not return a fixed value
type: feedback
---

Every Lambda handler uses `corsOrigin(alias, requestOrigin?)` — not `corsOrigin(alias)`. The `dev` alias must serve **both** `https://test.aintern.nl` and `http://localhost:5173`.

```typescript
function corsOrigin(alias: string, requestOrigin?: string): string {
  if (alias === 'prod') return 'https://aintern.nl'
  if (alias === 'dev') {
    if (requestOrigin === 'http://localhost:5173') return requestOrigin
    return 'https://test.aintern.nl'
  }
  return 'http://localhost:5173'
}
```

`respond()` takes a 4th optional `requestOrigin?: string` param and passes it to `corsOrigin`.

At the top of every `handler()`:
```typescript
const requestOrigin = event.headers['origin'] ?? event.headers['Origin']
```

Pass `requestOrigin` through to every `respond()` call site (inline and sub-handlers).
Sub-handlers without `event` receive `requestOrigin?: string` as an extra parameter.

**Why:** Returning a fixed origin for `dev` blocks whichever caller doesn't match. Discovered 2026-04-13 when localhost was blocked by a `test.aintern.nl`-only response.

**How to apply:** Copy this pattern verbatim into every new Lambda handler. After creating or modifying any handler's CORS logic, flag it for CEO review before deploying.
