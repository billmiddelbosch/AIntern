## Decision: Local composable state (`usePokerEquity`) instead of a Pinia store
scope: project

## Context
CLAUDE.md directs "Global state lives in Pinia stores; local state uses ref/
reactive." The Poker Odds Calculator is a single organism tree
(`PokerOddsCalculatorView` -> `PokerOddsCalculator` -> its children) with no
sibling routes, nav widgets, or other components needing access to hand/
equity state.

## Alternatives considered
- **Pinia store** (`usePokerStore`): would match the letter of the
  house-style Pinia-for-shared-state rule, but nothing outside this one
  organism subtree ever needs this state.
- **Local composable (`usePokerEquity`), instantiated once in the organism
  and passed down via props/emits within a 2-level-deep tree**: chosen.

## Reasoning
The state has exactly one consumer tree, is not needed across route
navigations (a page reload or route change is an acceptable full reset for
this PoC), and prop-drilling never exceeds the project's own "avoid prop
drilling beyond 2 levels" guidance (`PokerOddsCalculator` owns the
composable and passes only the specific refs each child needs). Pinia would
add indirection with no corresponding benefit at this scope.

## Trade-offs accepted
- If a future iteration needs the poker state to survive navigation, be
  shared with another view, or be persisted, this should be revisited and
  migrated to a Pinia store at that point — not preemptively now.

## Supersedes
None.
