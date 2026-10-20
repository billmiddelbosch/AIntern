/**
 * Pure slot logic for the public booking page (replaces Calendly).
 *
 * The grid is working hours in Europe/Amsterdam, returned as UTC ISO strings.
 * Only grid blocks that Bill opened in the admin (BOOKING_OPEN items) are bookable.
 * No AWS calls here so it is easy to unit test.
 */

export const BOOKING_TIMEZONE = 'Europe/Amsterdam'

export interface BookingConfig {
  /** ISO weekdays that are bookable: 1 = Monday … 7 = Sunday */
  weekdays: number[]
  /** First slot start, local time, minutes after midnight */
  dayStartMinutes: number
  /** Last slot must END at or before this, local time, minutes after midnight */
  dayEndMinutes: number
  slotMinutes: number
  /** First bookable day = today + this many days (1 = tomorrow) */
  minDaysAhead: number
  /** Last bookable day = today + this many days */
  maxDaysAhead: number
}

export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  weekdays: [1, 2, 3, 4, 5],
  dayStartMinutes: 9 * 60,
  dayEndMinutes: 17 * 60,
  slotMinutes: 30,
  minDaysAhead: 1,
  // Bill opens blocks himself, so he can plan up to 8 weeks ahead
  maxDaysAhead: 56,
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BOOKING_TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function zonedParts(utcMs: number): Record<string, number> {
  const out: Record<string, number> = {}
  for (const p of partsFormatter.formatToParts(new Date(utcMs))) {
    if (p.type !== 'literal') out[p.type] = Number(p.value)
  }
  return out
}

/** Offset of Amsterdam vs UTC in ms at the given instant (e.g. +2h in summer). */
function offsetMs(utcMs: number): number {
  const p = zonedParts(utcMs)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(utcMs / 1000) * 1000
}

/** Convert an Amsterdam wall-clock time to a UTC timestamp (ms). */
export function amsterdamToUtc(year: number, month: number, day: number, minutes: number): number {
  const guess = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60)
  let result = guess - offsetMs(guess)
  const second = offsetMs(result)
  if (guess - second !== result) result = guess - second
  return result
}

/** Amsterdam calendar date (YYYY-MM-DD) for a UTC instant. */
export function amsterdamDate(utcMs: number): string {
  const p = zonedParts(utcMs)
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`
}

/**
 * All slot starts (UTC ISO) between minDaysAhead and maxDaysAhead,
 * excluding blocked dates (YYYY-MM-DD, Amsterdam) and already booked starts.
 */
export function generateSlots(
  nowMs: number,
  config: BookingConfig = DEFAULT_BOOKING_CONFIG,
  blockedDates: ReadonlySet<string> = new Set(),
  bookedStarts: ReadonlySet<string> = new Set(),
): string[] {
  const [ty, tm, td] = amsterdamDate(nowMs).split('-').map(Number)
  const slots: string[] = []

  for (let offset = config.minDaysAhead; offset <= config.maxDaysAhead; offset++) {
    // Calendar arithmetic in UTC on a date-only value avoids DST drift
    const d = new Date(Date.UTC(ty, tm - 1, td + offset))
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth() + 1
    const day = d.getUTCDate()
    const isoWeekday = d.getUTCDay() === 0 ? 7 : d.getUTCDay()
    const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    if (!config.weekdays.includes(isoWeekday)) continue
    if (blockedDates.has(dateKey)) continue

    for (
      let start = config.dayStartMinutes;
      start + config.slotMinutes <= config.dayEndMinutes;
      start += config.slotMinutes
    ) {
      const utcMs = amsterdamToUtc(y, m, day, start)
      if (utcMs <= nowMs) continue
      const iso = new Date(utcMs).toISOString()
      if (bookedStarts.has(iso)) continue
      slots.push(iso)
    }
  }

  return slots
}

/** Parse "2026-12-24, 2026-12-25" into a set of valid YYYY-MM-DD strings. */
export function parseBlockedDates(raw: string | undefined | null): Set<string> {
  const set = new Set<string>()
  for (const part of (raw ?? '').split(/[\s,;]+/)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) set.add(part)
  }
  return set
}

/** Human-readable Dutch/English label, e.g. "dinsdag 21 oktober 2026 om 09:00". */
export function formatSlotLabel(iso: string, locale: 'nl' | 'en'): string {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
    timeZone: BOOKING_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  const time = new Intl.DateTimeFormat('nl-NL', {
    timeZone: BOOKING_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return locale === 'nl' ? `${day} om ${time}` : `${day} at ${time} (Amsterdam time)`
}
