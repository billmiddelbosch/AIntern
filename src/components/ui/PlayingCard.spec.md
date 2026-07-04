# PlayingCard

## Atomic Level
Atom

## Atomic Rationale
Pure presentational primitive — renders a single card face (or an empty placeholder slot) from props alone. No store, composable, or route/project-specific imports beyond shared `Card` type and pure `SUIT_SYMBOL` lookup util. Reused across the poker feature as: a static display in `CardSlotRow`, and an interactive picker cell (52×, via `interactive` prop) in `CardPickerGrid`.

## Purpose
Displays a playing card's rank and suit symbol with suit-appropriate coloring (red for hearts/diamonds, slate/black for spades/clubs), or a dashed empty-slot placeholder when `card` is `null`. Optionally interactive (clickable picker cell), disableable (already-in-play), and highlightable (marks the "next slot to fill").

## Props
| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `card` | `Card \| null` | yes | — | The card to render, or `null` for an empty placeholder |
| `size` | `'sm' \| 'md' \| 'lg'` | no | `'md'` | Visual size — `sm` used in the picker grid, `md`/`lg` in hand/board rows |
| `interactive` | `boolean` | no | `false` | Renders as a clickable button and emits `click` |
| `disabled` | `boolean` | no | `false` | Greys out and blocks clicks (used for already-selected cards in the picker) |
| `highlight` | `boolean` | no | `false` | Adds a ring to indicate this is the active/next slot |

## Emits
| Event | Payload | Description |
|---|---|---|
| `click` | none | Fired when an interactive, non-disabled card is clicked |

## Slots
None.

## Composables Used
None. Pure props/computed only.

## State
None — fully controlled via props.

## Acceptance Criteria
- [x] Renders rank + suit symbol when `card` is provided
- [x] Renders a dashed empty placeholder when `card` is `null`
- [x] Hearts/diamonds render in red (`text-rose-600`); spades/clubs in slate/black
- [x] `interactive=true` renders an enabled `<button>` that emits `click` on click
- [x] `interactive=false` (default) never emits `click`
- [x] `disabled=true` blocks clicks and visually greys out the card, and is reflected in `aria-label`
- [x] `highlight=true` adds a visible focus ring
- [x] `aria-label` describes the card for screen readers (or "Empty card slot")

## File Path
`src/components/ui/PlayingCard.vue`

## Test File
`src/components/ui/PlayingCard.spec.ts`

## Last Updated
2026-07-02 — Initial implementation for the Poker Odds Calculator PoC.
