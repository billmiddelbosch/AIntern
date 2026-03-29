# L-07 Analytics Integration & Cookie Consent — Spec

## Overview
GDPR-compliant Plausible Analytics integration for the AIntern landing page. Operates in stub/no-op mode by default; analytics script is only injected after the visitor explicitly gives consent via a cookie consent banner. Consent preference is persisted in localStorage. CTA clicks and page views are tracked.

---

## Components

### 1. CookieConsentBanner [ORGANISM]
**Atomic Level:** Organism
**Atomic Rationale:** Composes multiple atoms (buttons, text, SVG icon) and is tightly coupled to the `useConsentStore` Pinia store. Has its own layout logic (fixed positioning, responsive flex layout), business behaviour (show/hide based on consent decision, delegate accept/decline to store), and cross-cutting concerns (GDPR compliance, ARIA). This makes it an Organism — it cannot be classified as a Molecule because it directly reads and mutates global application state.

**File:** `src/components/ui/CookieConsentBanner.vue`

**Purpose:** Fixed banner at the bottom of the viewport, centred and max-width constrained. Shown only when no consent decision has been recorded (`!consentStore.hasDecided`). Provides Decline (first) and Accept (second) actions. Disappears after decision with a slide-up/fade transition.

**Props:** none (reads from `useConsentStore` directly)

**Emits:** none

**Slots:** none

**Composables used:** none (Pinia store only)

**State:**
- `useConsentStore.hasDecided` — `v-if` gate: banner is shown only when `!hasDecided`
- `useConsentStore.accept()` — called on Accept button click
- `useConsentStore.decline()` — called on Decline button click

**i18n keys:**
| Key | EN | NL |
|---|---|---|
| `cookieConsent.message` | "We use analytics…" | "We gebruiken analytics…" |
| `cookieConsent.acceptLabel` | "Accept" | "Accepteren" |
| `cookieConsent.declineLabel` | "Decline" | "Weigeren" |
| `cookieConsent.learnMore` | "Privacy policy" | "Privacybeleid" (defined in i18n but not rendered in the banner — reserved for L-09 Privacy Policy link) |

**Acceptance Criteria:**
- [x] Banner is visible on first load when localStorage has no `aintern_consent` key
- [x] Clicking Accept: banner disappears, `aintern_consent = "accepted"` in localStorage, Plausible script injected
- [x] Clicking Decline: banner disappears, `aintern_consent = "declined"` in localStorage, no Plausible script
- [x] On return visit with `aintern_consent = "accepted"`: banner does not appear
- [x] On return visit with `aintern_consent = "declined"`: banner does not appear
- [x] `role="region"` and `aria-label="Cookie consent"` present for accessibility
- [x] `aria-live="polite"` for screen reader announcements
- [x] Buttons are keyboard-focusable with tab order: Decline first, Accept second
- [x] Renders correctly in NL and EN
- [x] Smooth slide-up enter / fade-out leave transition (`<Transition name="ccb">`)

---

### 2. useAnalytics [Composable]
**File:** `src/composables/useAnalytics.ts`

**Purpose:** Wraps all Plausible tracking calls. Checks consent before any tracking. Provides `trackEvent(name, props?)` and `trackPageView()`. In no-op/stub mode (no consent or Plausible not loaded), calls are silently dropped without throwing.

**Interface:**
```ts
type EventProps = Record<string, string | number | boolean>

function trackEvent(name: string, props?: EventProps): void
function trackPageView(): void
```

**Consent guard:** Calls `useConsentStore()` on each invocation to get the current consent state. If `!consent.isAccepted`, returns immediately without calling Plausible. If `window.plausible` is not a function (script not yet loaded), also returns silently.

**Acceptance Criteria:**
- [x] `trackEvent` is a no-op when consent is undecided
- [x] `trackEvent` is a no-op when consent is declined
- [x] `trackEvent` calls `window.plausible(name, { props })` when consent is accepted and Plausible is loaded
- [x] `trackPageView` calls `window.plausible('pageview', undefined)` when consent is accepted
- [x] No errors thrown when Plausible script is not present

---

### 3. useConsentStore [Pinia Store]
**File:** `src/stores/useConsentStore.ts`

**Purpose:** Single source of truth for cookie consent state. Reads/writes localStorage. Manages Plausible script injection lifecycle.

**State:**
```ts
type ConsentStatus = 'undecided' | 'accepted' | 'declined'
const status = ref<ConsentStatus>('undecided')
```

**Getters:**
- `hasDecided`: computed — `status !== 'undecided'`
- `isAccepted`: computed — `status === 'accepted'`

**Actions:**
- `init()`: read `localStorage.getItem('aintern_consent')` on app startup; restores status; if `'accepted'`, injects Plausible script
- `accept()`: set `status = 'accepted'`, persist to localStorage, inject Plausible script
- `decline()`: set `status = 'declined'`, persist to localStorage (no script injection)

**Script injection:** `injectPlausibleScript()` — module-private function. Guards against double-injection by checking `document.getElementById('plausible-analytics')`. Reads domain from `import.meta.env.VITE_PLAUSIBLE_DOMAIN` (defaults to `'aintern.nl'`).

**Acceptance Criteria:**
- [x] `init()` restores accepted status from localStorage
- [x] `init()` restores declined status from localStorage
- [x] `init()` remains undecided when localStorage is empty
- [x] `init()` injects Plausible script when consent was previously accepted
- [x] `init()` does NOT inject Plausible script when declined
- [x] `init()` does NOT inject Plausible script when undecided
- [x] `accept()` persists `"accepted"` to `localStorage['aintern_consent']`
- [x] `accept()` injects the Plausible `<script>` tag to `<head>`
- [x] `accept()` does NOT inject a second script if called twice
- [x] `decline()` persists `"declined"` to `localStorage['aintern_consent']`
- [x] `decline()` does NOT inject Plausible script

---

## Plausible Integration

**Script injection strategy:** On accept (or on `init()` when consent is already `"accepted"`), dynamically inject:
```html
<script id="plausible-analytics" defer data-domain="aintern.nl" src="https://plausible.io/js/script.js"></script>
```

`data-domain` is read from `import.meta.env.VITE_PLAUSIBLE_DOMAIN` (defaults to `"aintern.nl"`).

**CTA click tracking (all wired up):**
- Nav CTA button → `trackEvent('cta_click', { location: 'nav' })` — in `MainNav.vue`
- Hero CTA button → `trackEvent('cta_click', { location: 'hero' })` — in `HeroSectionView.vue`
- No-Cure-No-Pay proposition CTA → `trackEvent('cta_click', { location: 'nocurenopay' })` — in `NoCureNoPayProposition.vue`
- Over AIntern contact CTA → `trackEvent('cta_click', { location: 'over_aintern' })` — in `OverAInternContactSection.vue`

**Page view tracking:**
- Called once in `App.vue` via `onMounted` (after consent check in `AppShell.vue`'s `onMounted`).

---

## App Integration

### AppShell.vue
- Imports and renders `<CookieConsentBanner />`
- Calls `consentStore.init()` in `onMounted` to restore consent from localStorage and (re-)inject Plausible if previously accepted

### App.vue
- Calls `trackPageView()` in `onMounted` — no-op if consent not yet given

---

## i18n Keys

### en.json
```json
"cookieConsent": {
  "message": "We use analytics to understand how visitors use this site. No personal data is stored.",
  "acceptLabel": "Accept",
  "declineLabel": "Decline",
  "learnMore": "Privacy policy"
}
```

### nl.json
```json
"cookieConsent": {
  "message": "We gebruiken analytics om te begrijpen hoe bezoekers onze site gebruiken. Er worden geen persoonlijke gegevens opgeslagen.",
  "acceptLabel": "Accepteren",
  "declineLabel": "Weigeren",
  "learnMore": "Privacybeleid"
}
```

---

## File Plan — Implemented

| File | Type | Status |
|---|---|---|
| `src/stores/useConsentStore.ts` | Pinia store | Done |
| `src/composables/useAnalytics.ts` | Composable | Done |
| `src/components/ui/CookieConsentBanner.vue` | Organism | Done |
| `src/components/shell/AppShell.vue` | Modified | Done — adds `<CookieConsentBanner>` and calls `consentStore.init()` |
| `src/App.vue` | Modified | Done — calls `trackPageView()` on mount |
| `src/locales/en.json` | Modified | Done — `cookieConsent` keys added |
| `src/locales/nl.json` | Modified | Done — `cookieConsent` keys added |
| `src/components/shell/MainNav.vue` | Modified | Done — `trackEvent('cta_click', { location: 'nav' })` on CTA |
| `src/views/sections/HeroSectionView.vue` | Modified | Done — `trackEvent('cta_click', { location: 'hero' })` on CTA |
| `src/components/sections/no-cure-no-pay-faq/NoCureNoPayProposition.vue` | Modified | Done — `trackEvent('cta_click', { location: 'nocurenopay' })` on CTA |
| `src/components/sections/over-aintern-contact/OverAInternContactSection.vue` | Modified | Done — `trackEvent('cta_click', { location: 'over_aintern' })` on CTA |
| `src/stores/useConsentStore.spec.ts` | Unit tests | Done — 17 tests all passing |
| `src/composables/useAnalytics.spec.ts` | Unit tests | Done — 7 tests all passing |
| `src/components/ui/CookieConsentBanner.spec.ts` | Unit tests | Done — 7 tests all passing |
| `src/components/ui/CookieConsentBanner.spec.md` | Spec | Done |
| `product/sections/analytics-cookie-consent/spec.md` | Section spec | Done (this file) |
| `e2e/analytics-cookie-consent.spec.ts` | E2E tests | Done — 13 tests all passing |

---

## Test Summary

**Unit tests (Vitest):** 31 tests across 3 files — all passing
**E2E tests (Playwright/Chromium):** 13 tests — all passing

---

## Last Updated
2026-03-28 — Full implementation complete for L-07 Analytics Integration & Cookie Consent
