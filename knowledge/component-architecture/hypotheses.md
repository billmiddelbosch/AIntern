# Component Architecture — Hypotheses (unconfirmed patterns)

## `watch()` on a computed state-machine value must guard against reverse/reset transitions
scope: project
[CONFIRMED x1]

When a `watch()` handler is meant to react only to *forward* progress through
a computed state machine (e.g. a `Street` type cycling `hole → flop → turn →
river → done`), it must explicitly exclude transitions *back* to the initial
state caused by a reset function — otherwise a "reset" fires the handler with
incomplete/invalid underlying data.

**Observed in**: `usePokerEquity.ts`'s `watch(activeStreet, ...)` — originally
fired on every transition, including the reverse transition into `'hole'`
caused by `resetGame()` clearing `holeCards`. This called `simulateEquity`
with `[null, null]` forcibly cast to `Card[]`, throwing inside
`remainingDeck`/`cardKey`, and because the throw happened between
`isCalculating.value = true` and `= false`, the UI got stuck permanently on
a loading state after every reset. Fixed by adding an explicit
`newStreet === 'hole'` guard with an explanatory comment.

**Would confirm at x3**: if the same reverse-transition class of bug shows up
in another `watch()`-driven state machine in this project (e.g. a wizard,
multi-step form, or booking flow), promote to `rules.md`.
