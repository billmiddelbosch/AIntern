# Security Check - 2026-04-11

**OKR 3.6 / B-01 | Branch: feature/board-2026-04-11**

---

## Critical (fix immediately)

No critical issues found.

---

## High (fix this sprint)

### H-01 - Calendly webhook: no signature verification
File: lambda/src/calendly-webhook.ts

The handler accepts any POST request without verifying the Calendly-Webhook-Signature HMAC header. An attacker who discovers the endpoint URL can send forged payloads, causing arbitrary DynamoDB intake records to be mutated.

Fix: Retrieve the Calendly signing secret from SSM and compare it against the HMAC-SHA256 of the raw request body before processing.

---

### H-02 - JWT stored in localStorage (XSS-accessible)
File: src/stores/useAuthStore.ts line 26

Admin JWT tokens are persisted to localStorage under key aintern_token. Any JavaScript on the page (including third-party embeds) can exfiltrate the token.

Fix: Store the JWT in an httpOnly Secure SameSite=Strict cookie.

---

### H-03 - adminAxios.ts has no Authorization interceptor
File: src/lib/adminAxios.ts

adminAxios lacks the Authorization: Bearer interceptor present in src/lib/axios.ts. Any future protected admin endpoint routed through this client will silently send unauthenticated requests - a logic auth-bypass footgun.

Fix: Add the same request interceptor from axios.ts to adminAxios.ts, or consolidate both clients.

---

## Medium (fix next sprint)

### M-01 - v-html with un-sanitized S3 HTML content
File: src/views/KennisbankArtikelView.vue line 157

HTML from aintern-kennisbank S3 is injected verbatim without sanitization. If the bucket ACL is misconfigured or an agent pipeline is compromised, this is a stored XSS vector.

Fix: Add DOMPurify.sanitize() before rendering (npm i dompurify @types/dompurify).

---

### M-02 - Intake handler: unvalidated ...data spread to DynamoDB
File: lambda/src/intake.ts line 49

The entire request body is spread into the DynamoDB PutCommand with no field whitelist, size enforcement, or type validation beyond email presence.

Fix: Replace the spread with an explicit field list and validate/truncate each field.

---

### M-03 - CORS wildcard on public-facing intake endpoint
File: lambda/src/intake.ts line 9

Access-Control-Allow-Origin: * on a browser-called endpoint allows cross-origin submissions from any domain.

Fix: Restrict to production domain via alias resolution, mirroring admin-auth.ts.

---

### M-04 - Admin register route publicly accessible
File: src/router/index.ts line 41

/admin/register has no requiresAuth guard. Backend correctly blocks re-registration, but the open route leaks admin surface area.

---

## Low / Informational

### L-01 - .env.bak contains live APIFY_TOKEN (gitignored, not committed)
Both .env and .env.bak contain the APIFY_TOKEN. Both are gitignored (confirmed: not tracked by git). The .bak copy is redundant.
Recommendation: Delete .env.bak. Rotate the Apify token as a precaution.

---

### L-02 - v-html in icon components - safe (informational)
ProbleemOplossingCard.vue, HowItWorksSection.vue, ResultaatCard.vue use v-html only for hardcoded SVG fragments from a fixed dictionary. No user input reaches these bindings. Not a vulnerability.

---

### L-03 - Frontend dependency audit - not run (approval required)
npm audit was blocked during this check. Manual audit recommended: npm audit (root) and cd lambda && npm audit.
Key packages to watch: axios@^1.7.9, vite@^6.0.11, jsonwebtoken@^9, bcryptjs@^2. All appear current with no known CVEs in these version ranges.

---

### L-04 - JWT algorithm pinned to HS256 - acceptable
algorithm: HS256 explicitly set in admin-auth.ts line 92 - prevents algorithm confusion attacks. Token expiry at 8h is appropriate.

---

## Summary: PASS WITH WARNINGS

| Severity | Count | Items |
|---|---|---|
| Critical | 0 | - |
| High | 3 | H-01, H-02, H-03 |
| Medium | 4 | M-01, M-02, M-03, M-04 |
| Low / Info | 4 | L-01, L-02, L-03, L-04 |

Status: PASS WITH WARNINGS - No critical vulnerabilities. Most exploitable: H-01 (Calendly webhook accepts unauthenticated requests, enables DynamoDB mutation). H-02 (JWT in localStorage) and H-03 (missing auth interceptor on adminAxios) are next priorities this sprint.
