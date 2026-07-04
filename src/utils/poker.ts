import type { Card, EquityResult, Rank, Suit } from '@/types/poker'

/**
 * Poker deck, hand-evaluation and Monte Carlo equity utilities.
 *
 * Pure functions only — no Vue reactivity here. `usePokerEquity` wraps
 * these for the calculator's reactive state.
 */

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']

/** Numeric value used for comparisons/straights (2=2 ... A=14). */
export const RANK_VALUE: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

/** Single-character shorthand used for the keyboard-entry picker (e.g. "Ah"). */
export const SUIT_SHORT: Record<Suit, string> = {
  spades: 's',
  hearts: 'h',
  diamonds: 'd',
  clubs: 'c',
}

const SUIT_BY_SHORT: Record<string, Suit> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
}

const RANK_BY_SHORT: Record<string, Rank> = {
  '1': 'A', // some players type "1h" for ace out of habit — treat as ace
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '0': 'T',
  t: 'T',
  j: 'J',
  q: 'Q',
  k: 'K',
  a: 'A',
}

/** Builds the standard 52-card deck in a fixed order. */
export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit })
    }
  }
  return deck
}

/** Stable string identity for a card, e.g. "Ah", "Td" — used for equality/lookup. */
export function cardKey(card: Card): string {
  return `${card.rank}${SUIT_SHORT[card.suit]}`
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit
}

/** Parses a two-character keyboard shortcut (rank char + suit char) into a Card, or null if invalid. */
export function parseShortcut(rankChar: string, suitChar: string): Card | null {
  const rank = RANK_BY_SHORT[rankChar.toLowerCase()]
  const suit = SUIT_BY_SHORT[suitChar.toLowerCase()]
  if (!rank || !suit) return null
  return { rank, suit }
}

/** Fisher-Yates shuffle — returns a new array, does not mutate the input. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Returns the deck with the given cards removed. */
export function remainingDeck(exclude: Card[]): Card[] {
  const excluded = new Set(exclude.map(cardKey))
  return createDeck().filter((c) => !excluded.has(cardKey(c)))
}

// ---------------------------------------------------------------------------
// Hand evaluation
// ---------------------------------------------------------------------------

/**
 * Hand category, highest first. The evaluator returns a score array of
 * `[category, ...tiebreakers]` (all descending by strength) so two scores
 * can be compared lexicographically via `compareScores`.
 */
const CATEGORY = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  TRIPS: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  QUADS: 7,
  STRAIGHT_FLUSH: 8,
} as const

/** Evaluates the best 5-card poker hand from exactly 5 cards. Returns a comparable score array. */
export function evaluate5(cards: Card[]): number[] {
  if (cards.length !== 5) {
    throw new Error(`evaluate5 requires exactly 5 cards, got ${cards.length}`)
  }

  const ranksDesc = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a)
  const isFlush = cards.every((c) => c.suit === cards[0].suit)

  // Count occurrences per rank, then sort groups by [count desc, rank desc].
  const counts = new Map<number, number>()
  for (const r of ranksDesc) counts.set(r, (counts.get(r) ?? 0) + 1)
  const groups = [...counts.entries()].sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : b[0] - a[0]))

  // Straight check, including the wheel (A-2-3-4-5, where the Ace plays low).
  const uniqueDesc = [...new Set(ranksDesc)]
  let straightHigh = 0
  if (uniqueDesc.length === 5) {
    if (uniqueDesc[0] - uniqueDesc[4] === 4) {
      straightHigh = uniqueDesc[0]
    } else if (uniqueDesc.join(',') === '14,5,4,3,2') {
      straightHigh = 5
    }
  }
  const isStraight = straightHigh > 0

  if (isStraight && isFlush) return [CATEGORY.STRAIGHT_FLUSH, straightHigh]
  if (groups[0][1] === 4) return [CATEGORY.QUADS, groups[0][0], groups[1][0]]
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return [CATEGORY.FULL_HOUSE, groups[0][0], groups[1][0]]
  }
  if (isFlush) return [CATEGORY.FLUSH, ...ranksDesc]
  if (isStraight) return [CATEGORY.STRAIGHT, straightHigh]
  if (groups[0][1] === 3) {
    return [CATEGORY.TRIPS, groups[0][0], ...groups.slice(1).map((g) => g[0])]
  }
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const [highPair, lowPair] = [groups[0][0], groups[1][0]].sort((a, b) => b - a)
    return [CATEGORY.TWO_PAIR, highPair, lowPair, groups[2][0]]
  }
  if (groups[0][1] === 2) {
    return [CATEGORY.PAIR, groups[0][0], ...groups.slice(1).map((g) => g[0])]
  }
  return [CATEGORY.HIGH_CARD, ...ranksDesc]
}

/** Lexicographically compares two hand scores. Positive = a wins, negative = b wins, 0 = tie. */
export function compareScores(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/** Finds the best 5-card score among all C(n,5) combinations of the given cards (n=6 or 7). */
export function bestHandScore(cards: Card[]): number[] {
  if (cards.length < 5) {
    throw new Error(`bestHandScore requires at least 5 cards, got ${cards.length}`)
  }
  if (cards.length === 5) return evaluate5(cards)

  let best: number[] | null = null
  const combo: Card[] = []

  function pick(start: number): void {
    if (combo.length === 5) {
      const score = evaluate5(combo)
      if (!best || compareScores(score, best) > 0) best = score
      return
    }
    // Prune: not enough cards left to complete a 5-card combo.
    for (let i = start; i < cards.length; i++) {
      if (combo.length + (cards.length - i) < 5) break
      combo.push(cards[i])
      pick(i + 1)
      combo.pop()
    }
  }

  pick(0)
  return best as unknown as number[]
}

// ---------------------------------------------------------------------------
// Monte Carlo equity simulation
// ---------------------------------------------------------------------------

const DEFAULT_TRIALS = 2000

/**
 * Estimates the player's win/tie/lose probability against `numOpponents`
 * random unknown hands, via Monte Carlo simulation.
 *
 * @param playerHole  Exactly 2 known player hole cards.
 * @param board       0-5 known community cards.
 * @param numOpponents Number of opponents (1-8) to simulate random hole cards for.
 * @param trials      Number of random deals to simulate.
 */
export function simulateEquity(
  playerHole: Card[],
  board: Card[],
  numOpponents: number,
  trials: number = DEFAULT_TRIALS,
): EquityResult {
  if (playerHole.length !== 2) {
    throw new Error(`simulateEquity requires exactly 2 player hole cards, got ${playerHole.length}`)
  }
  if (board.length > 5) {
    throw new Error(`simulateEquity requires 0-5 board cards, got ${board.length}`)
  }
  if (numOpponents < 1) {
    throw new Error('simulateEquity requires at least 1 opponent')
  }

  const known = [...playerHole, ...board]
  const baseDeck = remainingDeck(known)
  const boardCardsNeeded = 5 - board.length
  const cardsNeededPerTrial = numOpponents * 2 + boardCardsNeeded

  if (cardsNeededPerTrial > baseDeck.length) {
    throw new Error('Not enough cards left in the deck for this many opponents')
  }

  let wins = 0
  let ties = 0
  let losses = 0

  for (let t = 0; t < trials; t++) {
    const drawn = shuffle(baseDeck).slice(0, cardsNeededPerTrial)

    const opponentHoles: Card[][] = []
    let cursor = 0
    for (let o = 0; o < numOpponents; o++) {
      opponentHoles.push([drawn[cursor], drawn[cursor + 1]])
      cursor += 2
    }
    const fullBoard = [...board, ...drawn.slice(cursor, cursor + boardCardsNeeded)]

    const playerScore = bestHandScore([...playerHole, ...fullBoard])

    let beaten = false
    let tied = false
    for (const hole of opponentHoles) {
      const opponentScore = bestHandScore([...hole, ...fullBoard])
      const cmp = compareScores(playerScore, opponentScore)
      if (cmp < 0) {
        beaten = true
        break
      }
      if (cmp === 0) tied = true
    }

    if (beaten) losses++
    else if (tied) ties++
    else wins++
  }

  return {
    win: (wins / trials) * 100,
    tie: (ties / trials) * 100,
    lose: (losses / trials) * 100,
    trials,
  }
}
