## Decision: Introduce `data-testid` attributes for the Poker Odds Calculator feature only
scope: project

## Context
This project has no existing `data-testid` convention — E2E specs elsewhere
(`home.spec.ts`, `seo-meta-tags.spec.ts`, `analytics-cookie-consent.spec.ts`)
rely on role/text/structural Playwright selectors, deliberately avoiding
hardcoded translated copy since the app's default runtime locale is Dutch.
The Poker Odds Calculator's `CardPickerGrid` renders 52 near-identical,
Dutch-localized picker buttons (13 ranks x 4 suits), where role/text
selectors cannot distinguish one card from another without depending on
locale-specific label text.

## Alternatives considered
- **Pure role/text selectors** (project default): impossible to reliably
  target "Ace of spades" vs. "Ace of hearts" without parsing localized
  `aria-label` text, which reintroduces the locale-fragility this project's
  testing convention exists to avoid.
- **CSS nth-child/structural selectors**: brittle against layout/markup
  changes, and don't self-document intent the way a `data-testid` does.
- **`data-testid` scoped to just this feature**: chosen.

## Reasoning
The picker grid's scale (52 near-identical controls) and locale-dependent
labeling make `data-testid` the only selector strategy that is both robust
and does not duplicate translated copy into test code. Confined to the
poker feature's own components (`CardPickerGrid`, `PokerOddsCalculator`,
`OpponentCountStepper`, `EquityResultBar`, plus attribute-fallthrough onto
`CardSlotRow`/`PlayingCard` cells) rather than adopted project-wide.

## Trade-offs accepted
- Introduces a second selector convention alongside the project's existing
  role/text-based one — acceptable since it's scoped and documented (see
  `/knowledge/testing/rules.md` and `product/features/poker-odds-calculator/SPEC.md`),
  not silently inconsistent.

## Supersedes
None — first `data-testid` usage in this repo.
