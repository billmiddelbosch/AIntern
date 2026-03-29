# useConsentStore

## Atomic Level
Pinia Store (not an atomic design component — global state layer)

## Atomic Rationale
A Pinia store that manages the single source of truth for cookie consent status across the entire application. It encapsulates localStorage persistence, Plausible script injection, and the consent state machine. Consumed by `CookieConsentBanner` (Organism) and `useAnalytics` (Composable).

## Purpose
Tracks whether the visitor has accepted, declined, or not yet decided on analytics tracking. On accept, injects the Plausible analytics `<script>` tag into `<head>` exactly once. Persists the decision to localStorage under the key `aintern_consent` so the banner does not reappear on return visits. Designed as the single integration point for L-09 Cookie Consent Banner.

## State Shape
```ts
type ConsentStatus = 'undecided' | 'accepted' | 'declined'

const status = ref<ConsentStatus>('undecided')
```

## Getters (computed)
| Name | Type | Description |
|---|---|---|
| `hasDecided` | `boolean` | `true` when status is `'accepted'` or `'declined'` |
| `isAccepted` | `boolean` | `true` only when status is `'accepted'` |

## Actions
| Name | Description |
|---|---|
| `init()` | Called once in `AppShell.vue` `onMounted`. Reads `localStorage['aintern_consent']`. Restores status and re-injects Plausible if accepted. |
| `accept()` | Sets status to `'accepted'`, persists to localStorage, injects Plausible script. |
| `decline()` | Sets status to `'declined'`, persists to localStorage. Does NOT inject script. |

## localStorage Key
`aintern_consent` — values: `'accepted'` | `'declined'` (absent = undecided)

## Plausible Script Tag
```html
<script
  id="plausible-analytics"
  defer
  data-domain="${VITE_PLAUSIBLE_DOMAIN}"
  src="https://plausible.io/js/script.js"
></script>
```
Domain defaults to `'aintern.nl'` if `VITE_PLAUSIBLE_DOMAIN` is not set.
Double-injection is prevented by checking `document.getElementById('plausible-analytics')`.

## L-09 Readiness
The store is fully consent-aware. L-09 (Cookie Consent Banner) only needs to call `accept()` and `decline()` — no store changes required.

## Acceptance Criteria
- [x] Initial `status` is `'undecided'`
- [x] `hasDecided` is `false` when undecided
- [x] `isAccepted` is `false` when undecided
- [x] `init()` restores `'accepted'` status from localStorage
- [x] `init()` restores `'declined'` status from localStorage
- [x] `init()` remains undecided when localStorage is empty
- [x] `init()` injects Plausible script when consent was previously accepted
- [x] `init()` does NOT inject Plausible script when consent was declined
- [x] `init()` does NOT inject Plausible script when undecided
- [x] `accept()` sets `status` to `'accepted'`
- [x] `accept()` sets `hasDecided` to `true`
- [x] `accept()` sets `isAccepted` to `true`
- [x] `accept()` persists `'accepted'` to localStorage
- [x] `accept()` injects the Plausible script tag
- [x] `accept()` does NOT inject a second script if called twice
- [x] `decline()` sets `status` to `'declined'`
- [x] `decline()` sets `hasDecided` to `true`
- [x] `decline()` leaves `isAccepted` as `false`
- [x] `decline()` persists `'declined'` to localStorage
- [x] `decline()` does NOT inject Plausible script

## File Path
`src/stores/useConsentStore.ts`

## Test File
`src/stores/useConsentStore.spec.ts` — 17 unit tests (all passing)

## Last Updated
2026-03-28 — Full implementation verified for L-07 Analytics Integration & Cookie Consent
