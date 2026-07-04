<script setup lang="ts">
import { useEventListener, useTimeoutFn } from '@vueuse/core'
import type { Card } from '@/types/poker'
import { RANKS, SUITS, cardKey, cardsEqual, parseShortcut } from '@/utils/poker'
import PlayingCard from '@/components/ui/PlayingCard.vue'

/**
 * CardPickerGrid — 13x4 rank/suit picker for fast card entry.
 *
 * Supports two entry methods:
 * 1. Click/tap a cell directly.
 * 2. Type a two-character shortcut anywhere on the page while this grid is
 *    active (e.g. "Ah" for Ace of hearts) — buffered for ~1.2s between the
 *    two keystrokes.
 *
 * Already-selected cards (`usedCards`) are disabled so duplicates can't be
 * picked. When `active` is false, the grid is fully disabled (used once the
 * hand is complete) and stops listening for keyboard shortcuts.
 */
const props = withDefaults(
  defineProps<{
    usedCards: Card[]
    active?: boolean
  }>(),
  {
    active: true,
  },
)

const emit = defineEmits<{
  pick: [card: Card]
}>()

function isUsed(card: Card): boolean {
  return props.usedCards.some((used) => cardsEqual(used, card))
}

function selectCard(card: Card) {
  if (!props.active || isUsed(card)) return
  emit('pick', card)
}

// ---------------------------------------------------------------------------
// Keyboard shortcut entry: type rank char then suit char, e.g. "A" then "h".
// ---------------------------------------------------------------------------

let pendingRankChar: string | null = null

const { start: startBufferReset, stop: stopBufferReset } = useTimeoutFn(() => {
  pendingRankChar = null
}, 1200)

const RANK_CHARS = new Set('123456789tjqka0'.split(''))
const SUIT_CHARS = new Set('shdc'.split(''))

// No explicit `window` target: referencing the bare `window` identifier throws
// during SSR (vite-ssg renders this page server-side, where `window` doesn't
// exist as a global). Omitting the target lets useEventListener resolve it
// lazily via VueUse's SSR-safe `defaultWindow`.
useEventListener('keydown', (event: KeyboardEvent) => {
  if (!props.active) return
  // Ignore shortcuts while the user is typing in a real form field.
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (event.metaKey || event.ctrlKey || event.altKey) return

  const key = event.key.toLowerCase()

  if (pendingRankChar === null) {
    if (RANK_CHARS.has(key)) {
      pendingRankChar = key
      startBufferReset()
    }
    return
  }

  if (SUIT_CHARS.has(key)) {
    const card = parseShortcut(pendingRankChar, key)
    stopBufferReset()
    pendingRankChar = null
    if (card) selectCard(card)
  } else if (RANK_CHARS.has(key)) {
    // Treat as the start of a new shortcut rather than an invalid suit.
    pendingRankChar = key
    startBufferReset()
  } else {
    pendingRankChar = null
    stopBufferReset()
  }
})
</script>

<template>
  <div>
    <div class="grid gap-1" style="grid-template-columns: repeat(13, minmax(0, 1fr))">
      <template v-for="suit in SUITS" :key="suit">
        <PlayingCard
          v-for="rank in RANKS"
          :key="`${rank}-${suit}`"
          size="sm"
          interactive
          :disabled="!active || isUsed({ rank, suit })"
          :card="{ rank, suit }"
          :shortcut="cardKey({ rank, suit })"
          :data-testid="`card-picker-${rank}-${suit}`"
          @click="selectCard({ rank, suit })"
        />
      </template>
    </div>
  </div>
</template>
