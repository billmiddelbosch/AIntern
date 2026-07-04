# Testing Rules (confirmed ≥3x — apply by default)

## Never hardcode translated copy in test assertions
scope: project

The app's default runtime locale is Dutch (`src/lib/i18n.ts`: `locale: 'nl',
fallbackLocale: 'en'`). Both unit tests (via `src/test/setup.ts` installing
the real i18n instance) and E2E tests (via the live dev server) render Dutch
by default. Asserting against hardcoded English (or Dutch) strings makes
tests locale-fragile and duplicates translation content into test code.

**Confirmed in**: `CookieConsentBanner.spec.ts` (unit), `home.spec.ts`,
`seo-meta-tags.spec.ts`, `analytics-cookie-consent.spec.ts` (E2E) — all
predate this feature. Also applied in `e2e/poker-odds-calculator.spec.ts`
[CONFIRMED x5].

**How to apply**: Use structural/role-based/attribute-based/regex checks
instead (element counts, `data-testid`, disabled state, numeric patterns via
regex like `/^\d{1,3}%$/`), or import and reference the real locale JSON
directly when copy content genuinely must be checked.

## `data-testid` is a narrow, justified exception — not a default convention
scope: project

No other part of this codebase uses `data-testid`. It was introduced
specifically for the poker feature's `CardPickerGrid` (52 near-identical,
Dutch-localized buttons) where role/text-based Playwright selectors are
impractical. Vue attribute fallthrough lands a `data-testid` passed to a
single-root child component directly on that root element (used for
`CardSlotRow` and `PlayingCard` cells inside `CardPickerGrid`).

**How to apply**: Default to role/label/structural selectors first (per the
rule above). Only reach for `data-testid` when a component renders many
near-identical, locale-labeled interactive elements where no other selector
is robust and locale-independent. See `/decisions/2026-07-02-data-testid-exception.md`.
