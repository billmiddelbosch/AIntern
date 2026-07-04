/**
 * Domain types for the Poker Equity Calculator PoC.
 *
 * A "Card" is a rank/suit pair. The deck is the standard 52-card deck
 * (no jokers). Equity is estimated via Monte Carlo simulation — see
 * `src/utils/poker.ts`.
 */

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  rank: Rank
  suit: Suit
}

/** Which street of betting the player is currently filling in. */
export type Street = 'hole' | 'flop' | 'turn' | 'river' | 'done'

/** Result of a Monte Carlo equity simulation, as percentages (0-100). */
export interface EquityResult {
  win: number
  tie: number
  lose: number
  /** Number of simulated hands the percentages are based on. */
  trials: number
}
