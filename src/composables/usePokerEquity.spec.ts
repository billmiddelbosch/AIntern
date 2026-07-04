import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { usePokerEquity } from './usePokerEquity'
import type { Card } from '@/types/poker'

const AS: Card = { rank: 'A', suit: 'spades' }
const KS: Card = { rank: 'K', suit: 'spades' }
const TWO_C: Card = { rank: '2', suit: 'clubs' }
const THREE_C: Card = { rank: '3', suit: 'clubs' }
const FOUR_C: Card = { rank: '4', suit: 'clubs' }
const FIVE_D: Card = { rank: '5', suit: 'diamonds' }
const SIX_D: Card = { rank: '6', suit: 'diamonds' }

/** Polls nextTick until the equity calculation (fire-and-forget in the composable) settles. */
async function waitForCalculation(state: ReturnType<typeof usePokerEquity>) {
  for (let i = 0; i < 25 && state.isCalculating.value; i++) {
    await nextTick()
  }
  await nextTick()
}

describe('usePokerEquity', () => {
  it('starts in the "hole" street with no equity yet', () => {
    const state = usePokerEquity()
    expect(state.activeStreet.value).toBe('hole')
    expect(state.equity.value).toBeNull()
    expect(state.usedCards.value).toEqual([])
  })

  it('fills hole card slots in order and advances the active slot index', () => {
    const state = usePokerEquity()
    expect(state.activeSlotIndex.value).toBe(0)
    state.selectCard(AS)
    expect(state.holeCards.value[0]).toEqual(AS)
    expect(state.activeSlotIndex.value).toBe(1)
    state.selectCard(KS)
    expect(state.holeCards.value[1]).toEqual(KS)
  })

  it('advances to the flop street once both hole cards are filled, and recalculates equity', async () => {
    const state = usePokerEquity()
    state.selectCard(AS)
    state.selectCard(KS)
    expect(state.activeStreet.value).toBe('flop')
    await waitForCalculation(state)
    expect(state.equity.value).not.toBeNull()
    expect(state.equity.value!.win + state.equity.value!.tie + state.equity.value!.lose).toBeCloseTo(100, 0)
  })

  it('progresses through flop -> turn -> river, recalculating equity after each street', async () => {
    const state = usePokerEquity()
    state.selectCard(AS)
    state.selectCard(KS)
    await waitForCalculation(state)

    state.selectCard(TWO_C)
    state.selectCard(THREE_C)
    state.selectCard(FOUR_C)
    expect(state.activeStreet.value).toBe('turn')
    await waitForCalculation(state)
    const equityAfterFlop = state.equity.value
    expect(equityAfterFlop).not.toBeNull()

    state.selectCard(FIVE_D)
    expect(state.activeStreet.value).toBe('river')
    await waitForCalculation(state)

    state.selectCard(SIX_D)
    expect(state.activeStreet.value).toBe('done')
    await waitForCalculation(state)
    expect(state.equity.value).not.toBeNull()
  })

  it('tracks used cards across all streets', () => {
    const state = usePokerEquity()
    state.selectCard(AS)
    state.selectCard(KS)
    expect(state.usedCards.value).toEqual([AS, KS])
  })

  it('ignores selectCard calls once the hand is done', async () => {
    const state = usePokerEquity()
    state.selectCard(AS)
    state.selectCard(KS)
    state.selectCard(TWO_C)
    state.selectCard(THREE_C)
    state.selectCard(FOUR_C)
    state.selectCard(FIVE_D)
    state.selectCard(SIX_D)
    await waitForCalculation(state)
    expect(state.activeStreet.value).toBe('done')

    const usedBefore = state.usedCards.value
    state.selectCard({ rank: '9', suit: 'hearts' })
    expect(state.usedCards.value).toEqual(usedBefore)
  })

  it('resetGame clears all cards and equity but preserves the opponent count', async () => {
    const state = usePokerEquity()
    state.numOpponents.value = 5
    state.selectCard(AS)
    state.selectCard(KS)
    await waitForCalculation(state)
    expect(state.equity.value).not.toBeNull()

    state.resetGame()

    expect(state.holeCards.value).toEqual([null, null])
    expect(state.flopCards.value).toEqual([null, null, null])
    expect(state.turnCard.value).toBeNull()
    expect(state.riverCard.value).toBeNull()
    // Opponent count carries over between hands — the player is at the same table.
    expect(state.numOpponents.value).toBe(5)
    expect(state.equity.value).toBeNull()
    expect(state.activeStreet.value).toBe('hole')
  })

  it('re-selects an already-filled hole card and recalculates equity', async () => {
    const state = usePokerEquity()
    state.selectCard(AS)
    state.selectCard(KS)
    await waitForCalculation(state)
    const equityBefore = state.equity.value!.win

    // Edit the first hole card. Its current card frees up in the picker, and
    // the card stays until a replacement is chosen.
    state.beginEdit('hole', 0)
    expect(state.isEditing.value).toBe(true)
    expect(state.usedCards.value).toEqual([KS])
    expect(state.holeCards.value[0]).toEqual(AS)

    state.selectCard(TWO_C)
    expect(state.isEditing.value).toBe(false)
    expect(state.holeCards.value[0]).toEqual(TWO_C)
    expect(state.activeStreet.value).toBe('flop')
    await waitForCalculation(state)
    // A much weaker hand (2c Ks vs Ac Ks) should change the computed equity.
    expect(state.equity.value!.win).not.toBe(equityBefore)
  })

  it('re-selects a board card without changing which street is active', async () => {
    const state = usePokerEquity()
    state.selectCard(AS)
    state.selectCard(KS)
    state.selectCard(TWO_C)
    state.selectCard(THREE_C)
    state.selectCard(FOUR_C)
    await waitForCalculation(state)
    expect(state.activeStreet.value).toBe('turn')

    // Edit the first flop card (board index 0) mid-hand.
    state.beginEdit('board', 0)
    expect(state.isEditing.value).toBe(true)
    state.selectCard(FIVE_D)
    expect(state.isEditing.value).toBe(false)
    expect(state.flopCards.value[0]).toEqual(FIVE_D)
    // Still on the turn — editing a filled slot doesn't advance the street.
    expect(state.activeStreet.value).toBe('turn')
    await waitForCalculation(state)
    expect(state.equity.value).not.toBeNull()
  })

  it('ignores beginEdit on an empty slot', () => {
    const state = usePokerEquity()
    state.selectCard(AS)
    // hole[1] is still empty — cannot be edited.
    state.beginEdit('hole', 1)
    expect(state.isEditing.value).toBe(false)
  })

  it('increments and decrements the opponent count, clamped to [1, 8]', () => {
    const state = usePokerEquity()
    expect(state.numOpponents.value).toBe(1)

    // Cannot go below the minimum.
    state.decrementOpponents()
    expect(state.numOpponents.value).toBe(1)

    state.incrementOpponents()
    expect(state.numOpponents.value).toBe(2)

    // Climb to and stay at the maximum.
    for (let i = 0; i < 10; i++) state.incrementOpponents()
    expect(state.numOpponents.value).toBe(8)

    state.decrementOpponents()
    expect(state.numOpponents.value).toBe(7)
  })

  it('recalculates when opponent count changes after hole cards are set', async () => {
    const state = usePokerEquity()
    state.selectCard(AS)
    state.selectCard(KS)
    await waitForCalculation(state)
    const equityWithOneOpponent = state.equity.value!.win

    state.numOpponents.value = 6
    await waitForCalculation(state)
    expect(state.equity.value!.win).not.toBe(equityWithOneOpponent)
  })

  it('does not recalculate on opponent count change before hole cards are set', () => {
    const state = usePokerEquity()
    state.numOpponents.value = 4
    expect(state.equity.value).toBeNull()
    expect(state.isCalculating.value).toBe(false)
  })
})
