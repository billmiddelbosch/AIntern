# CookieConsentBanner

## Atomic Level
Organism

## Atomic Rationale
Composes multiple atoms (buttons, text, SVG icon) and is tightly coupled to the `useConsentStore` Pinia store. Has its own layout logic (fixed positioning, responsive flex layout), business behaviour (show/hide based on consent decision, delegate accept/decline to store), and cross-cutting concerns (GDPR compliance, ARIA). This makes it an Organism — it cannot be classified as a Molecule because it directly reads and mutates global application state.

## Purpose
A fixed bottom-of-viewport cookie consent banner that appears on first visit (when no consent decision is recorded) and disappears after the user accepts or declines analytics tracking. Consent preference is persisted in localStorage by the store. The banner is bilingual (NL/EN via vue-i18n).

## Props
None. Reads all state from `useConsentStore`.

## Emits
None.

## Slots
None.

## Composables Used
None directly. Uses `useConsentStore` (Pinia).

## State
- **`useConsentStore.hasDecided`** (computed getter) — v-if gate: banner is shown only when `!hasDecided`
- **`useConsentStore.accept()`** — called when Accept button is clicked
- **`useConsentStore.decline()`** — called when Decline button is clicked

## i18n Keys
| Key | EN | NL |
|---|---|---|
| `cookieConsent.message` | "We use analytics…" | "We gebruiken analytics…" |
| `cookieConsent.acceptLabel` | "Accept" | "Accepteren" |
| `cookieConsent.declineLabel` | "Decline" | "Weigeren" |
| `cookieConsent.learnMore` | "Privacy policy" | "Privacybeleid" |

## Acceptance Criteria
- [x] Banner is visible on first load when localStorage has no `aintern_consent` key
- [x] Clicking Accept: banner disappears, `aintern_consent = "accepted"` in localStorage, Plausible script injected
- [x] Clicking Decline: banner disappears, `aintern_consent = "declined"` in localStorage, no Plausible script
- [x] On return visit with `aintern_consent = "accepted"`: banner does not appear
- [x] On return visit with `aintern_consent = "declined"`: banner does not appear
- [x] `role="region"` and `aria-label="Cookie consent"` present for accessibility
- [x] `aria-live="polite"` for screen reader announcements
- [x] Buttons are keyboard-focusable with tab order: Decline first, Accept second
- [x] Renders correctly in NL and EN
- [x] Smooth slide-up enter / fade-out leave transition

## File Path
`src/components/ui/CookieConsentBanner.vue`

## Test File
`src/components/ui/CookieConsentBanner.spec.ts` — 7 unit tests (all passing)

## Last Updated
2026-03-28 — All acceptance criteria verified and passing (unit tests + E2E)
