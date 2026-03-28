# L-07 Analytics Integration & Cookie Consent — Spec

## Overview
GDPR-compliant Plausible Analytics integration for the AIntern landing page. Operates in stub/no-op mode by default; analytics script is only injected after the visitor explicitly gives consent via a cookie consent banner. Consent preference is persisted in localStorage. CTA clicks and page views are tracked.

---

## Components

### 1. CookieConsentBanner [ORGANISM]
**Atomic Level:** Organism
**Atomic Rationale:** Composes multiple atoms (buttons, text) and connects to a Pinia store. Has its own layout, business logic, and interacts with global consent state.

**Purpose:** Fixed banner at the bottom of the viewport. Shown only when no consent decision has been recorded. Provides Accept and Decline actions. Disappears after decision.

**Props:** none (reads from `useConsentStore` directly)

**Emits:** none

**Slots:** none

**Composables used:** none (store only)

**State:**
- `useConsentStore.hasDecided` — hides the banner when true
- `useConsentStore.accept()` — called on accept button click
- `useConsentStore.decline()` — called on decline button click

**i18n keys:**
- `cookieConsent.message`
- `cookieConsent.acceptLabel`
- `cookieConsent.declineLabel`
- `cookieConsent.privacyLink` (optional: "Learn more")

**Acceptance Criteria:**
- [ ] Banner is visible on first load when localStorage has no `consent` key
- [ ] Clicking Accept: banner disappears, `consent` = `"accepted"` in localStorage, analytics script injected
- [ ] Clicking Decline: banner disappears, `consent` = `"declined"` in localStorage, no analytics
- [ ] On return visit with `consent = "accepted"`: banner does not appear, analytics fires immediately
- [ ] On return visit with `consent = "declined"`: banner does not appear, no analytics
- [ ] Banner is accessible (ARIA role, keyboard focusable buttons)
- [ ] Renders correctly in NL and EN

---

### 2. useAnalytics [Composable]
**Purpose:** Wraps all Plausible tracking calls. Checks consent before any tracking. Provides `trackEvent(name, props?)` and `trackPageView()`. In no-op/stub mode (no consent or Plausible not loaded), calls are silently dropped.

**File:** `src/composables/useAnalytics.ts`

**Interface:**
```ts
interface AnalyticsEvent {
  name: string
  props?: Record<string, string | number | boolean>
}

function trackEvent(name: string, props?: Record<string, string | number | boolean>): void
function trackPageView(): void
```

**Acceptance Criteria:**
- [ ] `trackEvent` is a no-op when consent is not accepted
- [ ] `trackEvent` calls `window.plausible(name, { props })` when consent is accepted and Plausible is loaded
- [ ] `trackPageView` calls `window.plausible('pageview')` when consent is accepted
- [ ] No errors thrown when Plausible script is not present

---

### 3. useConsentStore [Pinia Store]
**Purpose:** Single source of truth for cookie consent state. Reads/writes localStorage. Manages Plausible script injection lifecycle.

**File:** `src/stores/useConsentStore.ts`

**State:**
```ts
interface ConsentState {
  status: 'undecided' | 'accepted' | 'declined'
}
```

**Getters:**
- `hasDecided`: `status !== 'undecided'`
- `isAccepted`: `status === 'accepted'`

**Actions:**
- `init()`: read localStorage `aintern_consent` on app startup; if `accepted`, inject Plausible script
- `accept()`: set `status = 'accepted'`, persist to localStorage, inject Plausible script
- `decline()`: set `status = 'declined'`, persist to localStorage

**Acceptance Criteria:**
- [ ] `init()` restores state from localStorage on app mount
- [ ] `accept()` persists `"accepted"` to `localStorage.aintern_consent`
- [ ] `decline()` persists `"declined"` to `localStorage.aintern_consent`
- [ ] Plausible script tag is injected to `<head>` exactly once when accepted
- [ ] Plausible script is NOT injected when declined or undecided

---

## Plausible Integration

**Script injection strategy:** On accept (or on `init()` when consent is already recorded as accepted), dynamically inject:
```html
<script defer data-domain="aintern.nl" src="https://plausible.io/js/script.js"></script>
```

`data-domain` is read from `import.meta.env.VITE_PLAUSIBLE_DOMAIN` (defaults to `"aintern.nl"`).

**CTA click tracking:**
- Nav CTA button ("Free consultation") → `trackEvent('cta_click', { location: 'nav' })`
- Hero CTA button → `trackEvent('cta_click', { location: 'hero' })`
- No-Cure-No-Pay proposition CTA → `trackEvent('cta_click', { location: 'nocurenopay' })`
- Over AIntern contact CTA → `trackEvent('cta_click', { location: 'over_aintern' })`

**Page view tracking:**
- Called once in `App.vue` via `onMounted` hook (after consent check).

---

## i18n Keys Required

### en.json additions
```json
"cookieConsent": {
  "message": "We use analytics to understand how visitors use this site. No personal data is stored.",
  "acceptLabel": "Accept",
  "declineLabel": "Decline",
  "learnMore": "Privacy policy"
}
```

### nl.json additions
```json
"cookieConsent": {
  "message": "We gebruiken analytics om te begrijpen hoe bezoekers onze site gebruiken. Er worden geen persoonlijke gegevens opgeslagen.",
  "acceptLabel": "Accepteren",
  "declineLabel": "Weigeren",
  "learnMore": "Privacybeleid"
}
```

---

## File Plan

| File | Type | Notes |
|---|---|---|
| `src/stores/useConsentStore.ts` | Pinia store | Consent state, localStorage, script injection |
| `src/composables/useAnalytics.ts` | Composable | Plausible wrapper, no-op guard |
| `src/components/ui/CookieConsentBanner.vue` | Organism | Fixed bottom banner |
| `src/components/shell/AppShell.vue` | Modified | Add `<CookieConsentBanner>` and call `consentStore.init()` |
| `src/App.vue` | Modified | Call `trackPageView()` on mount |
| `src/locales/en.json` | Modified | Add `cookieConsent` keys |
| `src/locales/nl.json` | Modified | Add `cookieConsent` keys |
| `src/components/ui/CookieConsentBanner.spec.md` | Spec | Component spec |
| `e2e/analytics-cookie-consent.spec.ts` | E2E test | Playwright tests |

---

## Last Updated
2026-03-28 — Initial spec for L-07 Analytics Integration & Cookie Consent
