# Poker Odds Calculator (PoC)

## Status
Implemented — PoC scope. Route live at `/poker-odds-calculator`.

## Atomic Level
Organism (`PokerOddsCalculator.vue`) composed into a Page (`PokerOddsCalculatorView.vue`).

## Atomic Rationale
- `PlayingCard.vue` (`src/components/ui/PlayingCard.vue`) — **Atom**. Pure presentational card face/placeholder, no store/composable imports. See its own `PlayingCard.spec.md`.
- `CardSlotRow.vue`, `OpponentCountStepper.vue` — **Molecules**. Each composes one or more atoms/native elements around a single, narrow piece of local state (a row of `PlayingCard`s; a +/- counter), with no knowledge of the wider feature.
- `CardPickerGrid.vue`, `EquityResultBar.vue` — **Molecules** bordering on organism complexity (keyboard-shortcut handling, i18n-driven result states) but still single-purpose and reusable in isolation given their props.
- `PokerOddsCalculator.vue` — **Organism**. Composes all of the above, owns no state itself (delegates to `usePokerEquity`), and represents a complete, self-contained feature area.
- `PokerOddsCalculatorView.vue` — **Page**. Route-level component; owns SEO/meta tags (`useHead`) and page chrome (`AppShell`, hero copy), renders the organism.

## Purpose
Single-page, single-player poker equity/odds calculator. The player enters their own hole cards and the community cards as each betting street is revealed; after every completed street the app recomputes and displays the player's estimated win probability against N random opponent hands via Monte Carlo simulation. No persistence, no backend/API calls — everything is client-side, in-memory, reset on page reload or via "New Game".

## User Flow
1. Player lands on `/poker-odds-calculator`. Empty state: two empty hole-card slots, empty board row, opponent count defaulted to 1, equity panel shows an empty-state message.
2. Player fills both hole-card slots via the picker grid (click or type e.g. `Ah`). On the 2nd card, equity is calculated and displayed (win / tie / lose %, plus a probability bar).
3. Picker grid now targets the flop (3 slots). Once all 3 are filled, equity recalculates automatically.
4. Picker grid targets the turn (1 slot), then the river (1 slot) — same pattern: fill → auto-recalculate.
5. Once all 7 cards are set (`activeStreet === 'done'`), the picker grid is hidden and replaced with a "hand complete" message.
6. Player may adjust "Number of opponents" (1-8) at any point after hole cards are set; equity recalculates automatically on change. Besides the +/- stepper, the keyboard shortcuts **`/`** (lower by 1) and **`°`** (raise by 1) adjust the count, clamped to 1-8.
7. Player may **re-select any already-filled card** by clicking its slot (in either the hole row or the board row). The slot keeps its current card (a mis-click loses nothing) and the picker grid opens — re-opening even if the hand was already complete — with the slot's current card freed up as selectable. Picking a replacement writes it into that slot and recomputes equity. See "Re-selection (editing)" below.
8. "New Game" resets all cards and the equity result back to the empty state but **preserves the opponent count** (the player is usually at the same table across hands).

## Component Contracts

### `PlayingCard.vue`
See `src/components/ui/PlayingCard.spec.md` (unchanged in this feature beyond initial authorship).

### `CardSlotRow.vue`
| | |
|---|---|
| Props | `label: string`, `cards: (Card \| null)[]`, `activeIndex?: number` (default -1 = none highlighted), `editingIndex?: number` (default -1 = none being edited), `size?: 'sm' \| 'md' \| 'lg'` (default `'md'`) |
| Emits | `select: [index: number]` — emitted when a **filled** slot is clicked, so the parent can begin re-selecting (editing) that card |
| Slots | none |
| Composables | none |
| State | none — fully controlled. A filled slot is `interactive` and highlighted when its index matches `activeIndex` or `editingIndex` |

### `CardPickerGrid.vue`
| | |
|---|---|
| Props | `usedCards: Card[]`, `active?: boolean` (default `true`) |
| Emits | `pick: [card: Card]` |
| Slots | none |
| Composables | `useEventListener`, `useTimeoutFn` (VueUse) — global `keydown` listener for the 2-char shortcut buffer (rank char, then suit char, 1.2s window); target argument intentionally omitted for SSR safety under `vite-ssg` (see Knowledge below) |
| State | local `pendingRankChar` (plain variable, not reactive — doesn't need to trigger re-render) |
| Notes | Each picker cell shows its own keyboard shortcut (`cardKey({rank, suit})`, e.g. `As`) via `PlayingCard`'s `shortcut` prop, so players can discover what to type without a legend. |

### `OpponentCountStepper.vue`
| | |
|---|---|
| Props | `modelValue: number`, `min?: number` (default 1), `max?: number` (default 8) |
| Emits | `update:modelValue: [value: number]` |
| Slots | none |
| Composables | none |
| State | none — `v-model` controlled |

### `EquityResultBar.vue`
| | |
|---|---|
| Props | `equity: EquityResult \| null`, `isCalculating: boolean` |
| Emits | none |
| Slots | none |
| Composables | `useI18n` |
| State | none — fully controlled; derives `winPct`/`tiePct`/`losePct` via `computed` |

### `PokerOddsCalculator.vue`
| | |
|---|---|
| Props | none |
| Emits | none |
| Slots | none |
| Composables | `usePokerEquity`, `useI18n` |
| State | delegates entirely to `usePokerEquity()`; derives `boardCards`, `boardActiveIndex`, `isHandComplete` via local `computed` |

### `PokerOddsCalculatorView.vue`
| | |
|---|---|
| Props | none (route component) |
| Emits | none |
| Slots | none |
| Composables | `useI18n`, `useHead` (`@unhead/vue`), `useRoute` |
| State | none — page chrome + SEO meta only |

## Composable: `usePokerEquity`
`src/composables/usePokerEquity.ts`

Owns all reactive state for the feature:
- `holeCards: Ref<[Card|null, Card|null]>`, `flopCards: Ref<[Card|null, Card|null, Card|null]>`, `turnCard: Ref<Card|null>`, `riverCard: Ref<Card|null>`
- `numOpponents: Ref<number>` (default 1, bounds 1-8)
- `equity: Ref<EquityResult|null>`, `isCalculating: Ref<boolean>`
- `activeStreet: ComputedRef<Street>` (`'hole' | 'flop' | 'turn' | 'river' | 'done'`)
- `usedCards: ComputedRef<Card[]>` — flattened, non-null cards across all slots, for picker-grid duplicate prevention
- `activeSlotIndex: ComputedRef<number>` — next empty slot index within the current street
- `editingSlot: Ref<{ row: 'hole' | 'board'; index: number } | null>` — which filled slot (if any) is currently being re-selected; `null` when not editing
- `isEditing: ComputedRef<boolean>` — `editingSlot !== null`
- `beginEdit(row: 'hole' | 'board', index: number): void` — starts re-selection of a filled slot; no-op on an empty slot. The slot keeps its card and it is excluded from `usedCards` (freed in the picker) until a replacement is chosen
- `incrementOpponents(): void` / `decrementOpponents(): void` — adjust `numOpponents` by ±1, clamped to `[minOpponents, maxOpponents]`. Bound to the `°` / `/` keyboard shortcuts by `PokerOddsCalculator.vue` via a global `keydown` listener
- `selectCard(card: Card): void` — while editing, writes into the slot being edited (and recomputes if the hole is complete); otherwise routes the picked card into the next empty slot for `activeStreet`
- `resetGame(): void` — clears all cards, equity and any in-progress edit back to defaults, but **preserves `numOpponents`** (same table across hands)
- Internal (non-exposed) `knownBoard` mutable variable — snapshot of board cards as of the last *completed* street, used to re-run simulation on opponent-count changes without re-deriving from refs
- `watch(activeStreet, ...)` — recalculates equity whenever a street completes; **must** exclude the `newStreet === 'hole'` transition (which only occurs via `resetGame()`, not a completed street) to avoid crashing `simulateEquity` with incomplete hole cards (see Known Issues / Fixed Bugs below)
- `watch(numOpponents, ...)` — recalculates equity on opponent-count change, but only once hole cards are already set

## Utilities: `src/utils/poker.ts`
Pure functions, no Vue reactivity:
- `createDeck()`, `remainingDeck(exclude)`, `shuffle()`, `cardKey()`, `cardsEqual()`, `parseShortcut(rankChar, suitChar)`
- `evaluate5(cards: Card[]): number[]` — 5-card hand evaluator, returns `[category, ...tiebreakers]`; handles the wheel straight (A-2-3-4-5)
- `compareScores(a, b): number` — lexicographic comparison of two hand scores
- `bestHandScore(cards: Card[]): number[]` — best 5-of-N (N=6 or 7) via recursive combination search, pruned
- `simulateEquity(playerHole, board, numOpponents, trials = 2000): EquityResult` — Monte Carlo simulation; deals random opponent hole cards + remaining board cards each trial, compares best hands, tallies win/tie/lose

## State Shape
```ts
type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'T'|'J'|'Q'|'K'|'A'
interface Card { rank: Rank; suit: Suit }
type Street = 'hole' | 'flop' | 'turn' | 'river' | 'done'
interface EquityResult { win: number; tie: number; lose: number; trials: number }
```
All local to the composable — no Pinia store (single-page, single-session, no cross-component sharing needed beyond the one organism tree).

## i18n
All user-facing strings added under the `pokerOdds` namespace in `src/locales/en.json` and `src/locales/nl.json` (headline, subtext, eyebrow, hand/community labels, opponents label + aria increase/decrease, picker heading/hint, results win/tie/lose/calculating/emptyState/simulatedHands, newGame, handComplete, meta title/description). App defaults to `nl` at runtime (`src/lib/i18n.ts`).

## Route
`src/router/index.ts`:
```ts
{
  path: '/poker-odds-calculator',
  name: 'poker-odds-calculator',
  component: () => import('@/views/PokerOddsCalculatorView.vue'),
}
```
Direct route only — no nav-menu entry added (PoC scope, per user decision).

## Acceptance Criteria
- [x] Player can enter 2 hole cards via the picker grid (click or `<rank><suit>` keyboard shortcut, e.g. `Ah`)
- [x] Win probability displays immediately after the 2nd hole card is picked
- [x] Player can then enter 3 flop cards; win probability recalculates once all 3 are filled
- [x] Player can then enter 1 turn card; win probability recalculates
- [x] Player can then enter 1 river card; win probability recalculates
- [x] A card already in play cannot be picked again (picker cell disabled)
- [x] "Number of opponents" stepper ranges 1-8, defaults to 1, disables at bounds
- [x] Changing opponent count after hole cards are set recalculates equity
- [x] "New Game" resets all cards and equity to the empty state but preserves the opponent count
- [x] Player can re-select any already-filled hole or board card by clicking its slot; the picker reopens (even after the hand is complete) with the freed card selectable, and picking a replacement recomputes equity
- [x] Equity is computed via Monte Carlo simulation (2000 trials) against N random opponent hands
- [x] No backend/API calls — fully client-side
- [x] All user-facing copy is localized (EN + NL)

## Known Issues / Fixed Bugs (retained for institutional memory)
- **Trailing-space bug in win %**: Vue's whitespace-condense compiler collapses (not fully strips) whitespace in text nodes mixing interpolation with static text across multiple template lines. `EquityResultBar.vue`'s win-percentage `<p>` had to be written as `>{{ winPct }}%</p>` on a single line to avoid a stray trailing space in the rendered text. See `/knowledge/component-architecture/knowledge.md`.
- **`resetGame()` crash-and-stall**: the `watch(activeStreet, ...)` handler originally had no guard against the reverse transition into `'hole'` (which happens when `resetGame()` clears `holeCards`). This caused `simulateEquity` to be called with `[null, null]` cast as `Card[]`, throwing inside `remainingDeck`/`cardKey`. Because the throw happened after `isCalculating.value = true` but before it was reset to `false`, the UI got stuck permanently on the "Calculating…" state after every New Game click. Fixed by adding `newStreet === 'hole'` to the watcher's early-return guard. See `/knowledge/component-architecture/hypotheses.md`.
- **Untranslated suit in screen-reader label (fixed post-review)**: `PlayingCard.vue`'s `ariaLabel` originally interpolated the raw internal `Suit` type value (`card.suit`, e.g. `'hearts'`) directly instead of a localized string, so NL-locale screen readers announced "K van hearts" instead of "K van harten." Fixed by adding a `pokerOdds.suits.{spades,hearts,diamonds,clubs}` key to both locale files and looking it up via `t()`. Caught by the `code-reviewer` agent (MEDIUM finding), not by the E2E/unit suites — no test asserted the exact suit text in the label.

## Known Limitation (documented, not fixed — PoC scope)
- **"Calculating…" state may not always paint before the simulation blocks the main thread.** `usePokerEquity.ts`'s `recalculate()` does `await nextTick()` before running `simulateEquity` synchronously; `nextTick()` awaits Vue's reactivity flush (a microtask) but not an actual browser paint. At higher opponent counts the main thread can be busy long enough that the loading state never visibly renders before the result appears. Flagged by the `code-reviewer` agent (MEDIUM). Acceptable for this PoC's trial count (2000) and opponent range (1-8); a production version should use a double-`requestAnimationFrame` wait or move the simulation to a Web Worker.

## Test Coverage
- Unit (Vitest): `src/utils/poker.spec.ts`, `src/composables/usePokerEquity.spec.ts`, `src/components/ui/PlayingCard.spec.ts` (part of the project's full 164/164-passing unit suite). Composable tests now also cover re-selection (editing) of hole/board cards, New Game preserving the opponent count, and clamped increment/decrement of the opponent count.
- E2E (Playwright): `e2e/poker-odds-calculator.spec.ts` — 10/10 passing. Covers: page load + full 52-card grid render, empty state, hole-card selection + win % display, duplicate-card prevention, full street progression (flop/turn/river) with recalculation at each step, opponent-count stepper bounds, `/` and `°` keyboard shortcuts for the opponent count (clamped), New Game reset, New Game preserving the opponent count, and re-selecting an already-picked card. Uses `data-testid` selectors throughout (see Deviations below) rather than translated copy, per this project's established E2E convention of not hardcoding locale strings.
- Full production build (`vue-tsc -b && vite-ssg build`) passes, including SSR pre-rendering of `poker-odds-calculator.html` alongside all other routes.

## Review Results
- **security-reviewer agent**: 0 CRITICAL, 0 HIGH, 0 MEDIUM. One LOW (defense-in-depth note on `SUIT_BY_SHORT`/`RANK_BY_SHORT` lookups in `poker.ts` — not currently exploitable, as the only call site pre-filters to a fixed single-char set before lookup) and a few INFO notes (recursive hand-search is bounded by call-site guards; no `v-html`/`eval`/raw globals; pre-existing unrelated `npm audit` advisories in the dependency tree).
- **code-reviewer agent**: 0 CRITICAL, 0 HIGH. Two MEDIUM findings — both resolved/documented, see "Known Issues" and "Known Limitation" above. LOW/INFO notes (a `best as unknown as number[]` cast in `bestHandScore` that's provably safe but could be a plain `best!`; `:key="index"` in `CardSlotRow` confirmed safe since board/hand arrays are fixed-length positional slots, never reordered/spliced) accepted as-is for PoC scope.
- **ui-designer skill (visual audit)**: Score 8/10. No Critical findings. Important: `CardPickerGrid`'s fixed 13-column layout isn't responsive below ~640px (cells shrink under the 44x44px touch-target guideline on mobile); `OpponentCountStepper`'s 28x28px buttons are likewise under the touch-target guideline (acceptable per its own "deliberately compact/secondary" design intent, but worth revisiting if mobile use becomes a priority). Polish notes: border-radius varies across components (`rounded-2xl` cards / `rounded-lg` buttons / `rounded-md` stepper) without a single documented scale, though each choice is locally consistent with the rest of the site. Strengths: correct semantic color use (emerald/amber/rose for win/tie/lose), consistent 4px-based spacing throughout, solid accessibility groundwork (`aria-label` on every card, `aria-live`/`role="status"` on the equity panel), and visual language consistent with the rest of the site (indigo accent, slate neutrals, `rounded-2xl` cards).

## Deviations from Project Norms (documented, justified)
- **`data-testid` attributes** were added across this feature's components (`CardPickerGrid`, `PokerOddsCalculator`, `OpponentCountStepper`, `EquityResultBar`, and via attribute fallthrough on `CardSlotRow`/`PlayingCard` cells) even though no other part of the codebase uses this convention. Justified narrowly: the picker grid alone renders 52 near-identical, Dutch-localized buttons, making locale-independent, robust E2E selection impractical via role/text queries alone.

## Out of Scope (confirmed pre-existing, unrelated to this feature)
A full-suite E2E run surfaced 20 pre-existing failures unrelated to any file this feature touched:
- `problemen-oplossingen.spec.ts` (8 tests) + 1 cascading `resultaten-cases.spec.ts` failure — caused by `<ProbleemOplossingSectionView bg="dark" />` being commented out in `src/views/HomeView.vue` (line 22), unrelated to the poker feature.
- `contact-form-calendly.spec.ts` (12 tests) — `src/components/sections/over-aintern-contact/OverAInternContactSection.vue` has been redesigned (now a two-column "story + CTA card" layout using `.oac-*` classes, an `IntakeModal` trigger button, and a `mailto:` link) and no longer contains the Calendly widget, form fields, or `.cc-*` classes the spec asserts against — spec/implementation drift that predates this feature's work.

Neither was introduced by, nor is fixed by, this feature. Flagged here for visibility; not remediated (out of scope for this PoC).

## Last Updated
2026-07-04 — Refinement pass: (1) smaller header/subheader (View) and smaller default card size (`CardSlotRow` now defaults to `md`); (2) New Game preserves the opponent count (removed `numOpponents` reset); (3) re-selection — any filled hole/board card can be clicked to reopen the picker and swap it (`editingSlot` state, `beginEdit`); (4) each picker cell now shows its keyboard shortcut (e.g. `As`) via `PlayingCard`'s new `shortcut` prop; (5) `/` and `°` keyboard shortcuts lower/raise the opponent count (clamped 1-8). Build passing (`vue-tsc -b && vite-ssg build`), 164/164 project unit tests passing, 10/10 feature E2E tests passing. `security-reviewer` agent re-run on the delta.

2026-07-02 — Initial implementation and full spec write-up for the Poker Odds Calculator PoC. Build passing (`vue-tsc -b && vite-ssg build`), 160/160 project unit tests passing, 7/7 feature E2E tests passing. `security-reviewer` and `code-reviewer` agents run (0 CRITICAL/HIGH from either); the one contained MEDIUM finding (untranslated suit in `aria-label`) fixed same-day. `ui-designer` visual audit completed (8/10, no Critical findings).
