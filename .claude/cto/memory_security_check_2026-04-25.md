---
name: Security Check — Week 17 (2026-04-25)
description: Weekly security review scoped to changes since 2026-04-16. New public ROI calculator page, router update, nav link, and i18n keys.
type: project
---

# Security Check — Week 17 (2026-04-25)

## Status: PASS

---

## Scope

Changes since last check (2026-04-16):

- `src/views/WatKostHandmatigWerkView.vue` — new public ROI calculator page
- `src/router/index.ts` — new public route `/wat-kost-handmatig-werk`
- `src/components/shell/MainNav.vue` — new nav link for the calculator route
- `src/locales/en.json` + `nl.json` — new `gratisToolView` i18n keys
- `src/composables/useHead.ts` — OG/Twitter meta composable (pre-existing, confirmed unchanged)

---

## Per-File Findings

### `src/views/WatKostHandmatigWerkView.vue`

**No issues found.**

- **XSS (OWASP A03):** No `v-html` directive used anywhere in the component. All user-facing values are rendered via Vue text interpolation (`{{ }}`) or bound to typed `ref<number>` reactive state. Vue automatically HTML-escapes text interpolations, eliminating DOM-based XSS risk.
- **User input handling:** All three user inputs (`hoursPerWeek`, `hourlyRate`, `processCount`) are bound with `v-model.number` on `<input type="range">` elements. The `.number` modifier coerces values to `Number` before storing them. Range inputs enforce `min`/`max`/`step` attributes natively in the browser. No free-text fields exist.
- **Computed values:** `weeklySavings`, `monthlySavings`, and `annualSavings` are derived exclusively from the three bounded number refs and compile-time constants. No external data, URL params, or query strings feed into calculations.
- **Dynamic code execution:** No dynamic code execution functions (`Function()`, `setTimeout(string)`, or equivalent patterns) are present. Calculator is purely client-side arithmetic.
- **API exposure:** No API calls are made from this component. No network requests of any kind.
- **Analytics event:** `trackEvent('cta_click', { location: 'gratis-tool' })` passes a hardcoded string literal as the location property — no user-controlled data flows into Plausible analytics.
- **formatCurrency():** Uses `Intl.NumberFormat` which does not accept untrusted input — it formats the already-coerced number ref. No injection vector.

### `src/router/index.ts`

**No issues found.**

- **Route classification:** `/wat-kost-handmatig-werk` is correctly classified as `{ layout: 'public' }` with no `requiresAuth` property. The page is a public marketing/lead-gen tool; public access is intentional and appropriate.
- **Auth guard integrity:** The global `beforeEach` guard in `src/main.ts` redirects any route with `meta.requiresAuth === true` to admin-login when unauthenticated. The new route does not carry this flag and is correctly excluded from auth checks.
- **No admin data leak:** The new route does not import any admin components, stores, or API composables. Lazy-loading via `() => import(...)` is used consistently across all non-home routes.
- **No path traversal or wildcard issues:** The route path is a fixed static string with no dynamic segments.

### `src/components/shell/MainNav.vue`

**No issues found.**

- The new `routeNavItems` entry for `/wat-kost-handmatig-werk` uses `RouterLink` for internal navigation (compliant with CLAUDE.md coding standard — no bare `<a>` tags).
- The `scrollTo(anchor)` helper uses `document.querySelector(anchor)` with values sourced only from the hardcoded `navItems` array (not user input). No open-redirect or DOM clobbering risk.
- Labels are rendered via `t(item.labelKey)` — i18n translation lookup, not user-supplied strings.

### `src/locales/en.json` + `nl.json` (gratisToolView section)

**No issues found.**

- New keys are under `gratisToolView.*`. All values are static, human-authored strings in English and Dutch. No user-controlled data is stored in i18n files.
- Vue i18n's `t()` function does not interpret values as HTML by default (renders as plain text). None of the new strings use the raw-HTML rendering mode.
- No script injection patterns, no `<script>` tags, no event handler attributes embedded in translation strings.

### `src/composables/useHead.ts`

**No issues found.**

- `SITE_URL` is sourced from `import.meta.env.VITE_SITE_URL` with a safe fallback to the hardcoded production domain `'https://aintern.nl'`. This value cannot be supplied by users at runtime.
- `og:url` and `canonical` href are constructed as `${SITE_URL}${route.path}`. `route.path` is controlled by Vue Router (normalized, decoded) and injected into a `<meta>` attribute via unhead — not into innerHTML. No XSS vector.
- OG image URL is a compile-time constant string; no dynamic user input involved.

---

## OWASP Top 10 — New Code Coverage

| # | Category | Result |
|---|---|---|
| A01 | Broken Access Control | PASS — new route correctly public; all admin routes retain `requiresAuth: true`; global guard verified in `main.ts` |
| A02 | Cryptographic Failures | N/A — no credentials, tokens, or sensitive data in new code |
| A03 | Injection (XSS/SQLi) | PASS — no `v-html`, no dynamic code execution, no string-concatenated queries; all inputs are bounded numbers |
| A04 | Insecure Design | PASS — calculator is read-only, no state mutation, no server interaction |
| A05 | Security Misconfiguration | PASS — route meta is explicitly public; no debug flags or default creds introduced |
| A06 | Vulnerable Components | Carry-over from week 16 — vite HIGH + axios/follow-redirects/unhead MODERATEs still pending `npm audit fix` |
| A07 | Auth / Identity Failures | PASS — no auth logic touched in this batch |
| A08 | Software / Data Integrity | PASS — no deserialization of user input; no dynamic imports from user-controlled paths |
| A09 | Logging / Monitoring | PASS — analytics event uses hardcoded strings; no sensitive data logged |
| A10 | SSRF | PASS — no outbound fetches to user-supplied URLs |

---

## Carry-Over Items (from week 16 — not yet resolved)

These findings were raised in `memory_security_check_2026-04-16.md` and remain open:

| Severity | Item | Status |
|---|---|---|
| HIGH | vite <=6.4.1 path traversal / arbitrary file read (dev-only) | Open — `npm audit fix` not yet run |
| HIGH | `lambda/src/calendly-webhook.ts` uses hardcoded CORS origin instead of `corsOrigin()` + `respond()` | Open |
| HIGH | `lambda/src/intake.ts` uses hardcoded CORS origin instead of `corsOrigin()` + `respond()` | Open |
| MODERATE | axios 1.x NO_PROXY bypass + header injection chain | Open |
| MODERATE | follow-redirects auth header leak | Open |
| MODERATE | unhead <2.1.13 `hasDangerousProtocol()` bypass | Open |
| LOW | `KennisbankArtikelView.vue` v-html on CMS content without DOMPurify | Open |

---

## Gecontroleerde categorieën

- [x] Secrets & credentials
- [x] XSS / v-html audit (new files)
- [x] User input validation (slider inputs)
- [x] API / dynamic code execution
- [x] Route auth classification
- [x] Navigation guard integrity
- [x] i18n injection risk
- [x] Analytics data flow
- [x] OG/meta composable

---

## Overall Verdict

**PASS** — No new vulnerabilities introduced in week 17. The ROI calculator is a well-bounded, purely client-side feature with no API interaction, no free-text user inputs, no DOM injection vectors, and no auth surface. The public route classification is appropriate and the global auth guard remains unaffected.

Carry-over HIGH items from week 16 (vite, Lambda CORS) remain the highest-priority open findings and should be addressed before next release.
