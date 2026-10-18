import { describe, it, expect } from 'vitest'
import {
  AINTERN_FROM_PER_MONTH,
  MAX_AMOUNT,
  MAX_TOOL_NAME_LENGTH,
  monthlySaving,
  monthlyTotal,
  sanitizeAmount,
  sanitizeToolName,
} from './savings'

describe('sanitizeAmount', () => {
  it('rounds to whole euros', () => {
    expect(sanitizeAmount(49.6)).toBe(50)
    expect(sanitizeAmount('120')).toBe(120)
  })

  it('turns invalid or negative input into 0', () => {
    for (const value of [null, undefined, '', 'abc', -10, NaN, Infinity]) {
      expect(sanitizeAmount(value)).toBe(0)
    }
  })

  it('caps very large amounts', () => {
    expect(sanitizeAmount(10_000_000)).toBe(MAX_AMOUNT)
  })
})

describe('sanitizeToolName', () => {
  it('trims, strips control characters and shortens', () => {
    expect(sanitizeToolName('  Exact\n')).toBe('Exact')
    expect(sanitizeToolName('a\u0000b')).toBe('a b')
    expect(sanitizeToolName(`a${String.fromCharCode(0x202e)}b`)).toBe('a b')
    expect(sanitizeToolName('x'.repeat(100))).toHaveLength(MAX_TOOL_NAME_LENGTH)
  })
})

describe('totals', () => {
  it('sums sanitized amounts', () => {
    expect(
      monthlyTotal([
        { name: 'CRM', amount: 120 },
        { name: 'Planning', amount: -5 },
        { name: 'Facturatie', amount: 30.4 },
      ]),
    ).toBe(150)
  })

  it('saving is total minus the starting price, never negative', () => {
    expect(monthlySaving(400)).toBe(400 - AINTERN_FROM_PER_MONTH)
    expect(monthlySaving(50)).toBe(0)
  })
})
