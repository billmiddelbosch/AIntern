import { computed, nextTick, ref, watch } from 'vue'
import type { Card, EquityResult, Street } from '@/types/poker'
import { cardsEqual, simulateEquity } from '@/utils/poker'

/** Which card slot the user is currently re-selecting (editing), or null. */
type EditingSlot = { row: 'hole' | 'board'; index: number }

const DEFAULT_OPPONENTS = 1
const MIN_OPPONENTS = 1
const MAX_OPPONENTS = 8
const TRIALS = 2000

/**
 * usePokerEquity — reactive state + Monte Carlo equity calculation for the
 * single-player Poker Odds Calculator PoC.
 *
 * Card entry is street-by-street: hole (2) -> flop (3) -> turn (1) -> river (1).
 * A street can only be filled once the previous one is complete. Equity is
 * recalculated automatically each time a street completes, and again if the
 * opponent count changes after the hole cards are set.
 */
export function usePokerEquity() {
  const holeCards = ref<[Card | null, Card | null]>([null, null])
  const flopCards = ref<[Card | null, Card | null, Card | null]>([null, null, null])
  const turnCard = ref<Card | null>(null)
  const riverCard = ref<Card | null>(null)

  const numOpponents = ref(DEFAULT_OPPONENTS)
  const equity = ref<EquityResult | null>(null)
  const isCalculating = ref(false)

  /** The filled slot the user is currently re-selecting, or null when not editing. */
  const editingSlot = ref<EditingSlot | null>(null)
  const isEditing = computed(() => editingSlot.value !== null)

  /** Board cards known as of the last *completed* street (used to re-run on opponent-count change). */
  let knownBoard: Card[] = []

  /** Reads the card currently at a board-row index (0-2 flop, 3 turn, 4 river). */
  function boardCardAt(index: number): Card | null {
    if (index < 3) return flopCards.value[index]
    if (index === 3) return turnCard.value
    return riverCard.value
  }

  /** Writes a card into a board-row index (0-2 flop, 3 turn, 4 river). */
  function writeBoardCard(index: number, card: Card): void {
    if (index < 3) flopCards.value[index] = card
    else if (index === 3) turnCard.value = card
    else riverCard.value = card
  }

  /** The card sitting in the slot currently being edited, or null. */
  function editingCard(): Card | null {
    if (!editingSlot.value) return null
    const { row, index } = editingSlot.value
    return row === 'hole' ? holeCards.value[index] : boardCardAt(index)
  }

  /** All community cards currently filled, as a valid (gap-free) board prefix. */
  function currentBoard(): Card[] {
    return [...flopCards.value, turnCard.value, riverCard.value].filter(
      (c): c is Card => c !== null,
    )
  }

  const activeStreet = computed<Street>(() => {
    if (holeCards.value.some((c) => c === null)) return 'hole'
    if (flopCards.value.some((c) => c === null)) return 'flop'
    if (turnCard.value === null) return 'turn'
    if (riverCard.value === null) return 'river'
    return 'done'
  })

  // The card in the slot being edited is excluded so the picker frees it up —
  // the user can re-pick it (a no-op) or swap in any other card.
  const usedCards = computed<Card[]>(() => {
    const editing = editingCard()
    return [...holeCards.value, ...flopCards.value, turnCard.value, riverCard.value].filter(
      (c): c is Card => c !== null && (editing === null || !cardsEqual(c, editing)),
    )
  })

  /** Index of the next empty slot within the row for the currently active street, or -1. */
  const activeSlotIndex = computed<number>(() => {
    switch (activeStreet.value) {
      case 'hole':
        return holeCards.value.findIndex((c) => c === null)
      case 'flop':
        return flopCards.value.findIndex((c) => c === null)
      case 'turn':
        return 0
      case 'river':
        return 0
      default:
        return -1
    }
  })

  /**
   * Begin re-selecting an already-filled slot. The slot keeps its current card
   * (so a mis-click loses nothing) until the user picks a replacement, which is
   * routed here by `selectCard`. Only filled slots can be edited.
   */
  function beginEdit(row: 'hole' | 'board', index: number): void {
    const card = row === 'hole' ? holeCards.value[index] : boardCardAt(index)
    if (!card) return
    editingSlot.value = { row, index }
  }

  function selectCard(card: Card): void {
    // Re-selection path: route the pick into the slot being edited, then
    // recompute equity directly (activeStreet doesn't change, so its watcher
    // won't fire) once both hole cards are known.
    if (editingSlot.value) {
      const { row, index } = editingSlot.value
      if (row === 'hole') holeCards.value[index] = card
      else writeBoardCard(index, card)
      editingSlot.value = null
      if (holeCards.value.every((c) => c !== null)) {
        knownBoard = currentBoard()
        void recalculate()
      }
      return
    }

    switch (activeStreet.value) {
      case 'hole': {
        const i = holeCards.value.findIndex((c) => c === null)
        if (i === -1) return
        holeCards.value[i] = card
        break
      }
      case 'flop': {
        const i = flopCards.value.findIndex((c) => c === null)
        if (i === -1) return
        flopCards.value[i] = card
        break
      }
      case 'turn':
        turnCard.value = card
        break
      case 'river':
        riverCard.value = card
        break
      case 'done':
        return
    }
  }

  async function recalculate(): Promise<void> {
    isCalculating.value = true
    // Let the "Calculating…" state paint before the synchronous simulation runs.
    await nextTick()
    equity.value = simulateEquity(
      holeCards.value as Card[],
      knownBoard,
      numOpponents.value,
      TRIALS,
    )
    isCalculating.value = false
  }

  // Recalculate whenever a street completes (activeStreet transitions to the next one).
  // A transition *into* 'hole' means resetGame() just ran, not a completed street —
  // hole cards aren't known yet, so recalculating here would crash simulateEquity.
  watch(activeStreet, (newStreet, oldStreet) => {
    if (!oldStreet || newStreet === oldStreet || newStreet === 'hole') return
    knownBoard = [...flopCards.value, turnCard.value, riverCard.value].filter(
      (c): c is Card => c !== null,
    )
    void recalculate()
  })

  // Recalculate if the opponent count changes after hole cards are already set.
  watch(numOpponents, () => {
    if (activeStreet.value === 'hole') return
    void recalculate()
  })

  /** Clamp-and-set the opponent count within [MIN, MAX]. */
  function setOpponents(n: number): void {
    numOpponents.value = Math.min(MAX_OPPONENTS, Math.max(MIN_OPPONENTS, n))
  }

  function incrementOpponents(): void {
    setOpponents(numOpponents.value + 1)
  }

  function decrementOpponents(): void {
    setOpponents(numOpponents.value - 1)
  }

  // New Game intentionally preserves numOpponents — the player is usually at
  // the same table, so the opponent count carries over between hands.
  function resetGame(): void {
    holeCards.value = [null, null]
    flopCards.value = [null, null, null]
    turnCard.value = null
    riverCard.value = null
    editingSlot.value = null
    equity.value = null
    isCalculating.value = false
    knownBoard = []
  }

  return {
    holeCards,
    flopCards,
    turnCard,
    riverCard,
    numOpponents,
    equity,
    isCalculating,
    usedCards,
    activeStreet,
    activeSlotIndex,
    editingSlot,
    isEditing,
    minOpponents: MIN_OPPONENTS,
    maxOpponents: MAX_OPPONENTS,
    selectCard,
    beginEdit,
    incrementOpponents,
    decrementOpponents,
    resetGame,
  }
}
