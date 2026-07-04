import { describe, expect, it } from 'vitest'
import type { Card } from '@/types/poker'
import {
  bestHandScore,
  cardKey,
  cardsEqual,
  compareScores,
  createDeck,
  evaluate5,
  parseShortcut,
  remainingDeck,
  shuffle,
  simulateEquity,
} from '@/utils/poker'

function c(rank: Card['rank'], suit: Card['suit']): Card {
  return { rank, suit }
}

describe('createDeck', () => {
  it('contains exactly 52 unique cards', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(52)
    expect(new Set(deck.map(cardKey)).size).toBe(52)
  })
})

describe('cardKey / cardsEqual', () => {
  it('produces a stable, unique key per card', () => {
    expect(cardKey(c('A', 'hearts'))).toBe('Ah')
    expect(cardKey(c('T', 'spades'))).toBe('Ts')
  })

  it('treats identical rank+suit as equal', () => {
    expect(cardsEqual(c('K', 'clubs'), c('K', 'clubs'))).toBe(true)
    expect(cardsEqual(c('K', 'clubs'), c('K', 'diamonds'))).toBe(false)
  })
})

describe('parseShortcut', () => {
  it('parses valid rank+suit shortcuts case-insensitively', () => {
    expect(parseShortcut('A', 'h')).toEqual(c('A', 'hearts'))
    expect(parseShortcut('a', 'H')).toEqual(c('A', 'hearts'))
    expect(parseShortcut('t', 's')).toEqual(c('T', 'spades'))
    expect(parseShortcut('9', 'd')).toEqual(c('9', 'diamonds'))
  })

  it('returns null for invalid rank or suit characters', () => {
    expect(parseShortcut('x', 'h')).toBeNull()
    expect(parseShortcut('a', 'z')).toBeNull()
  })
})

describe('shuffle', () => {
  it('preserves length and contents without mutating the input', () => {
    const deck = createDeck()
    const original = [...deck]
    const shuffled = shuffle(deck)
    expect(deck).toEqual(original) // input untouched
    expect(shuffled).toHaveLength(52)
    expect(new Set(shuffled.map(cardKey))).toEqual(new Set(deck.map(cardKey)))
  })
})

describe('remainingDeck', () => {
  it('excludes the given cards', () => {
    const excluded = [c('A', 'hearts'), c('K', 'spades')]
    const remaining = remainingDeck(excluded)
    expect(remaining).toHaveLength(50)
    expect(remaining.some((card) => cardsEqual(card, c('A', 'hearts')))).toBe(false)
    expect(remaining.some((card) => cardsEqual(card, c('K', 'spades')))).toBe(false)
  })
})

describe('evaluate5 — hand categories', () => {
  it('recognizes high card', () => {
    const [category] = evaluate5([c('2', 'clubs'), c('5', 'hearts'), c('9', 'spades'), c('J', 'diamonds'), c('K', 'clubs')])
    expect(category).toBe(0)
  })

  it('recognizes a pair', () => {
    const [category] = evaluate5([c('2', 'clubs'), c('2', 'hearts'), c('9', 'spades'), c('J', 'diamonds'), c('K', 'clubs')])
    expect(category).toBe(1)
  })

  it('recognizes two pair', () => {
    const [category] = evaluate5([c('2', 'clubs'), c('2', 'hearts'), c('9', 'spades'), c('9', 'diamonds'), c('K', 'clubs')])
    expect(category).toBe(2)
  })

  it('recognizes trips', () => {
    const [category] = evaluate5([c('2', 'clubs'), c('2', 'hearts'), c('2', 'spades'), c('9', 'diamonds'), c('K', 'clubs')])
    expect(category).toBe(3)
  })

  it('recognizes a straight', () => {
    const [category, high] = evaluate5([c('5', 'clubs'), c('6', 'hearts'), c('7', 'spades'), c('8', 'diamonds'), c('9', 'clubs')])
    expect(category).toBe(4)
    expect(high).toBe(9)
  })

  it('recognizes the wheel straight (A-2-3-4-5) with the ace playing low', () => {
    const [category, high] = evaluate5([c('A', 'clubs'), c('2', 'hearts'), c('3', 'spades'), c('4', 'diamonds'), c('5', 'clubs')])
    expect(category).toBe(4)
    expect(high).toBe(5)
  })

  it('recognizes a flush', () => {
    const [category] = evaluate5([c('2', 'clubs'), c('5', 'clubs'), c('9', 'clubs'), c('J', 'clubs'), c('K', 'clubs')])
    expect(category).toBe(5)
  })

  it('recognizes a full house', () => {
    const [category] = evaluate5([c('2', 'clubs'), c('2', 'hearts'), c('2', 'spades'), c('9', 'diamonds'), c('9', 'clubs')])
    expect(category).toBe(6)
  })

  it('recognizes quads', () => {
    const [category] = evaluate5([c('2', 'clubs'), c('2', 'hearts'), c('2', 'spades'), c('2', 'diamonds'), c('9', 'clubs')])
    expect(category).toBe(7)
  })

  it('recognizes a straight flush', () => {
    const [category, high] = evaluate5([c('5', 'clubs'), c('6', 'clubs'), c('7', 'clubs'), c('8', 'clubs'), c('9', 'clubs')])
    expect(category).toBe(8)
    expect(high).toBe(9)
  })

  it('throws when given anything other than 5 cards', () => {
    expect(() => evaluate5([c('2', 'clubs'), c('3', 'hearts')])).toThrow()
  })
})

describe('compareScores — hand ranking order', () => {
  const highCard = evaluate5([c('2', 'clubs'), c('5', 'hearts'), c('9', 'spades'), c('J', 'diamonds'), c('K', 'clubs')])
  const pair = evaluate5([c('2', 'clubs'), c('2', 'hearts'), c('9', 'spades'), c('J', 'diamonds'), c('K', 'clubs')])
  const straight = evaluate5([c('5', 'clubs'), c('6', 'hearts'), c('7', 'spades'), c('8', 'diamonds'), c('9', 'clubs')])
  const flush = evaluate5([c('2', 'clubs'), c('5', 'clubs'), c('9', 'clubs'), c('J', 'clubs'), c('K', 'clubs')])
  const fullHouse = evaluate5([c('2', 'clubs'), c('2', 'hearts'), c('2', 'spades'), c('9', 'diamonds'), c('9', 'clubs')])
  const quads = evaluate5([c('2', 'clubs'), c('2', 'hearts'), c('2', 'spades'), c('2', 'diamonds'), c('9', 'clubs')])
  const straightFlush = evaluate5([c('5', 'clubs'), c('6', 'clubs'), c('7', 'clubs'), c('8', 'clubs'), c('9', 'clubs')])

  it('orders every category correctly from weakest to strongest', () => {
    expect(compareScores(pair, highCard)).toBeGreaterThan(0)
    expect(compareScores(straight, pair)).toBeGreaterThan(0)
    expect(compareScores(flush, straight)).toBeGreaterThan(0)
    expect(compareScores(fullHouse, flush)).toBeGreaterThan(0)
    expect(compareScores(quads, fullHouse)).toBeGreaterThan(0)
    expect(compareScores(straightFlush, quads)).toBeGreaterThan(0)
  })

  it('returns 0 for identical hand strength', () => {
    const handA = evaluate5([c('2', 'clubs'), c('5', 'hearts'), c('9', 'spades'), c('J', 'diamonds'), c('K', 'clubs')])
    const handB = evaluate5([c('2', 'diamonds'), c('5', 'spades'), c('9', 'hearts'), c('J', 'clubs'), c('K', 'diamonds')])
    expect(compareScores(handA, handB)).toBe(0)
  })

  it('breaks ties within the same category by kicker rank', () => {
    const pairOfAces = evaluate5([c('A', 'clubs'), c('A', 'hearts'), c('4', 'spades'), c('5', 'diamonds'), c('6', 'clubs')])
    const pairOfTwos = evaluate5([c('2', 'clubs'), c('2', 'hearts'), c('9', 'spades'), c('J', 'diamonds'), c('K', 'clubs')])
    expect(compareScores(pairOfAces, pairOfTwos)).toBeGreaterThan(0)
  })
})

describe('bestHandScore — best 5 of 7', () => {
  it('picks the best 5-card combination out of 7 cards', () => {
    // Player has a flush available among 7 cards even though the 2 hole cards alone don't make one.
    const sevenCards = [
      c('2', 'hearts'),
      c('9', 'spades'), // off-suit hole cards
      c('3', 'hearts'),
      c('5', 'hearts'),
      c('7', 'hearts'),
      c('K', 'hearts'),
      c('Q', 'clubs'),
    ]
    const [category] = bestHandScore(sevenCards)
    expect(category).toBe(5) // flush found among the 5 hearts
  })

  it('matches evaluate5 when exactly 5 cards are given', () => {
    const five = [c('2', 'clubs'), c('5', 'hearts'), c('9', 'spades'), c('J', 'diamonds'), c('K', 'clubs')]
    expect(bestHandScore(five)).toEqual(evaluate5(five))
  })

  it('throws when given fewer than 5 cards', () => {
    expect(() => bestHandScore([c('2', 'clubs'), c('3', 'hearts')])).toThrow()
  })
})

describe('simulateEquity', () => {
  it('returns win/tie/lose percentages that sum to ~100 and stay in range', () => {
    const result = simulateEquity([c('A', 'spades'), c('K', 'spades')], [], 1, 1000)
    expect(result.trials).toBe(1000)
    expect(result.win).toBeGreaterThanOrEqual(0)
    expect(result.tie).toBeGreaterThanOrEqual(0)
    expect(result.lose).toBeGreaterThanOrEqual(0)
    expect(result.win + result.tie + result.lose).toBeCloseTo(100, 0)
  })

  it('gives pocket aces a strong (~75-95%) win rate heads-up preflop', () => {
    // Statistical test with a generous tolerance band to avoid flakiness —
    // true equity for AA vs a random hand is ~85%.
    const result = simulateEquity([c('A', 'spades'), c('A', 'hearts')], [], 1, 3000)
    expect(result.win).toBeGreaterThan(75)
    expect(result.win).toBeLessThan(95)
  })

  it('gives a player a 100% win rate when the board already makes an unbeatable hand', () => {
    // Player holds a royal flush using the board; no 1-card draw can beat it.
    const result = simulateEquity(
      [c('A', 'clubs'), c('2', 'diamonds')],
      [c('K', 'clubs'), c('Q', 'clubs'), c('J', 'clubs'), c('T', 'clubs')],
      1,
      300,
    )
    expect(result.win).toBe(100)
    expect(result.lose).toBe(0)
  })

  it('win rate decreases as more opponents are added', () => {
    const vsOne = simulateEquity([c('7', 'hearts'), c('2', 'clubs')], [], 1, 2000)
    const vsFour = simulateEquity([c('7', 'hearts'), c('2', 'clubs')], [], 4, 2000)
    expect(vsFour.win).toBeLessThan(vsOne.win)
  })

  it('throws if not exactly 2 player hole cards are given', () => {
    expect(() => simulateEquity([c('A', 'spades')], [], 1, 100)).toThrow()
  })

  it('throws if more than 5 board cards are given', () => {
    const sixBoard = [c('2', 'clubs'), c('3', 'clubs'), c('4', 'clubs'), c('5', 'clubs'), c('6', 'clubs'), c('7', 'clubs')]
    expect(() => simulateEquity([c('A', 'spades'), c('K', 'spades')], sixBoard, 1, 100)).toThrow()
  })
})
