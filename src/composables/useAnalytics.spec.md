# useAnalytics

## Atomic Level
Composable (not an atomic design component — utility layer)

## Atomic Rationale
A framework-agnostic composable providing a consent-aware analytics abstraction. It has no UI of its own. It composes with `useConsentStore` to gate all tracking calls behind GDPR consent. Used by page-level views and organisms (HeroSectionView, MainNav, NoCureNoPayProposition, OverAInternContactSection, App.vue).

## Purpose
Wraps all Plausible Analytics tracking calls behind a consent guard. When consent is not accepted, every call is silently dropped (no-op/stub mode). Provides a stable, type-safe interface for event tracking that is ready to be wired to L-09 Cookie Consent Banner without any changes.

## Interface
```ts
type EventProps = Record<string, string | number | boolean>

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProps }) => void
  }
}

function useAnalytics(): {
  trackEvent(name: string, props?: EventProps): void
  trackPageView(): void
}
```

## Composables Used
- `useConsentStore` (Pinia) — checked on every call to determine whether tracking is permitted

## Consent Guard Logic
1. `useConsentStore()` is called inside each tracking function (not at composable setup time) to always read the latest consent state
2. If `!consent.isAccepted` → return immediately (no-op)
3. If `typeof window.plausible !== 'function'` → return immediately (script not loaded yet)
4. Otherwise → call `window.plausible(name, options)`

## Tracking Calls Wired in the App

| Call site | Event name | Props |
|---|---|---|
| `App.vue` — `onMounted` | `'pageview'` | none |
| `MainNav.vue` — CTA click | `'cta_click'` | `{ location: 'nav' }` |
| `HeroSectionView.vue` — CTA click | `'cta_click'` | `{ location: 'hero' }` |
| `NoCureNoPayProposition.vue` — CTA click | `'cta_click'` | `{ location: 'nocurenopay' }` |
| `OverAInternContactSection.vue` — CTA click | `'cta_click'` | `{ location: 'over_aintern' }` |

## Acceptance Criteria
- [x] `trackEvent` is a no-op when consent is undecided
- [x] `trackEvent` is a no-op when consent is declined
- [x] `trackEvent` calls `window.plausible(name, { props })` when consent is accepted and Plausible is loaded
- [x] `trackEvent` calls `window.plausible(name, undefined)` when no props are provided
- [x] No error thrown when `window.plausible` is undefined and consent is accepted
- [x] `trackPageView` is a no-op when consent is undecided
- [x] `trackPageView` calls `window.plausible('pageview', undefined)` when consent is accepted

## File Path
`src/composables/useAnalytics.ts`

## Test File
`src/composables/useAnalytics.spec.ts` — 7 unit tests (all passing)

## Last Updated
2026-03-28 — Full implementation verified for L-07 Analytics Integration & Cookie Consent
