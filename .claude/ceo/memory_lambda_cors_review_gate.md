---
name: Lambda CORS Review Gate
description: CEO must verify corsOrigin() mapping whenever a new Lambda handler is created or a new domain/env is introduced
type: feedback
---

The CEO must review and approve the CORS origin mapping whenever:

1. A **new Lambda handler** is created that returns HTTP responses
2. A **new environment or domain** is added (e.g. a new subdomain or staging URL)
3. The `corsOrigin` function is modified in any existing handler

**What to check:**
- The handler uses `corsOrigin(alias, requestOrigin?)` — not a hardcoded origin string
- The `dev` branch allows both `https://test.aintern.nl` and `http://localhost:5173`
- The API Gateway CDK stack (`infra/lib/admin-stack.ts` → `allowOrigins`) includes all allowed origins
- `requestOrigin` is extracted from `event.headers['origin'] ?? event.headers['Origin']` and threaded to every `respond()` call

**Why:** A fixed origin on the `dev` alias blocks whichever caller doesn't match. This broke localhost access in April 2026 and required a hotfix across 4 handlers. The CEO sign-off prevents this class of regression.

**How to apply:** When the CTO or lambda-feature-builder creates or modifies a Lambda handler, block deployment until the CEO has confirmed the CORS mapping matches the above criteria.
