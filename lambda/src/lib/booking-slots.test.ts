import { describe, it, expect } from 'vitest'
import {
  amsterdamToUtc,
  amsterdamDate,
  generateSlots,
  parseBlockedDates,
  formatSlotLabel,
  DEFAULT_BOOKING_CONFIG,
} from './booking-slots'

describe('amsterdamToUtc', () => {
  it('handles summer time (UTC+2)', () => {
    expect(new Date(amsterdamToUtc(2026, 7, 1, 9 * 60)).toISOString()).toBe('2026-07-01T07:00:00.000Z')
  })
  it('handles winter time (UTC+1)', () => {
    expect(new Date(amsterdamToUtc(2026, 12, 1, 9 * 60)).toISOString()).toBe('2026-12-01T08:00:00.000Z')
  })
  it('handles both sides of the DST switch (25 Oct 2026)', () => {
    expect(new Date(amsterdamToUtc(2026, 10, 23, 9 * 60)).toISOString()).toBe('2026-10-23T07:00:00.000Z')
    expect(new Date(amsterdamToUtc(2026, 10, 26, 9 * 60)).toISOString()).toBe('2026-10-26T08:00:00.000Z')
  })
})

describe('amsterdamDate', () => {
  it('uses the Amsterdam calendar day', () => {
    expect(amsterdamDate(Date.parse('2026-10-20T22:30:00Z'))).toBe('2026-10-21')
  })
})

describe('generateSlots', () => {
  // Tuesday 20 Oct 2026, 10:00 Amsterdam
  const now = Date.parse('2026-10-20T08:00:00Z')

  it('starts tomorrow, skips weekends, 16 slots per day 09:00-17:00', () => {
    const slots = generateSlots(now)
    expect(slots[0]).toBe('2026-10-21T07:00:00.000Z')
    const perDay = slots.filter((s) => s.startsWith('2026-10-21'))
    expect(perDay).toHaveLength(16)
    expect(perDay.at(-1)).toBe('2026-10-21T14:30:00.000Z') // 16:30 local
    expect(slots.some((s) => s.startsWith('2026-10-24') || s.startsWith('2026-10-25'))).toBe(false)
  })

  it('offers 21 days ahead at most (15 weekdays here)', () => {
    const slots = generateSlots(now)
    expect(slots).toHaveLength(15 * 16)
    expect(slots.at(-1)!.startsWith('2026-11-10')).toBe(true)
    expect(DEFAULT_BOOKING_CONFIG.maxDaysAhead).toBe(21)
  })

  it('excludes blocked dates and booked starts', () => {
    const slots = generateSlots(
      now,
      DEFAULT_BOOKING_CONFIG,
      new Set(['2026-10-22']),
      new Set(['2026-10-21T07:00:00.000Z']),
    )
    expect(slots).not.toContain('2026-10-21T07:00:00.000Z')
    expect(slots.some((s) => s.startsWith('2026-10-22'))).toBe(false)
    expect(slots).toContain('2026-10-21T07:30:00.000Z')
  })

  it('uses winter offset after the DST switch', () => {
    expect(generateSlots(now)).toContain('2026-10-26T08:00:00.000Z')
  })
})

describe('parseBlockedDates', () => {
  it('parses comma/space separated dates and drops junk', () => {
    expect([...parseBlockedDates('2026-12-24, 2026-12-25;oops 2026-1-1')]).toEqual(['2026-12-24', '2026-12-25'])
    expect(parseBlockedDates(undefined).size).toBe(0)
  })
})

describe('formatSlotLabel', () => {
  it('formats in Dutch with Amsterdam time', () => {
    expect(formatSlotLabel('2026-10-21T07:00:00.000Z', 'nl')).toBe('woensdag 21 oktober 2026 om 09:00')
  })
  it('formats in English', () => {
    expect(formatSlotLabel('2026-10-21T07:00:00.000Z', 'en')).toContain('21 October 2026 at 09:00')
  })
})
