import { describe, it, expect } from 'vitest'
import {
  amsterdamParts,
  buildWeeks,
  cellKey,
  dayCells,
  dayOption,
  formatDate,
  groupByDay,
  mondayOf,
} from './bookingGrid'

describe('bookingGrid', () => {
  it('converts UTC to Amsterdam date/time across DST', () => {
    expect(amsterdamParts('2026-10-21T07:00:00.000Z')).toEqual({ date: '2026-10-21', time: '09:00' })
    expect(amsterdamParts('2026-11-02T08:00:00.000Z')).toEqual({ date: '2026-11-02', time: '09:00' })
  })

  it('finds the Monday of a week', () => {
    expect(mondayOf('2026-10-21')).toBe('2026-10-19')
    expect(mondayOf('2026-10-19')).toBe('2026-10-19')
    expect(mondayOf('2026-10-25')).toBe('2026-10-19')
  })

  it('groups blocks per week with shared time rows', () => {
    const weeks = buildWeeks([
      '2026-10-21T07:00:00.000Z',
      '2026-10-21T07:30:00.000Z',
      '2026-11-02T08:00:00.000Z',
    ])
    expect(weeks.map((w) => w.monday)).toEqual(['2026-10-19', '2026-11-02'])
    expect(weeks[0].days).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'])
    expect(weeks[0].times).toEqual(['09:00', '09:30'])
    expect(weeks[0].cells[cellKey('2026-10-21', '09:30')]).toBe('2026-10-21T07:30:00.000Z')
    expect(weeks[0].cells[cellKey('2026-10-20', '09:00')]).toBeUndefined()
    expect(weeks[1].cells[cellKey('2026-11-02', '09:00')]).toBe('2026-11-02T08:00:00.000Z')
  })
})

describe('bookingGrid helpers for the mobile views', () => {
  it('groups slots per Amsterdam day, keeping order', () => {
    // 22:30 UTC on the 20th is already the 21st in Amsterdam
    expect(
      groupByDay(['2026-10-20T07:00:00.000Z', '2026-10-20T22:30:00.000Z', '2026-10-21T07:00:00.000Z']),
    ).toEqual([
      { date: '2026-10-20', slots: ['2026-10-20T07:00:00.000Z'] },
      { date: '2026-10-21', slots: ['2026-10-20T22:30:00.000Z', '2026-10-21T07:00:00.000Z'] },
    ])
  })

  it('formats DayChip labels without a time zone shift', () => {
    const option = dayOption('2026-10-21', 'en-GB', true)
    expect(option).toEqual({ key: '2026-10-21', weekday: 'Wed', day: '21', month: 'Oct', marked: true })
    expect(formatDate('2026-10-21', 'en-GB', { weekday: 'long' })).toBe('Wednesday')
  })

  it('lists the rows of one day, including times that are not bookable', () => {
    const [week] = buildWeeks(['2026-10-21T07:00:00.000Z', '2026-10-22T07:30:00.000Z'])
    expect(dayCells(week, '2026-10-21')).toEqual([
      { time: '09:00', iso: '2026-10-21T07:00:00.000Z' },
      { time: '09:30', iso: undefined },
    ])
  })
})
