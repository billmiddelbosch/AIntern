/**
 * Groups the admin booking grid (UTC ISO block starts) into Amsterdam weeks,
 * so the admin can show a Mon–Fri × time table per week.
 */

export const BOOKING_TIMEZONE = 'Europe/Amsterdam'

export interface GridWeek {
  /** Monday of the week, YYYY-MM-DD (Amsterdam) */
  monday: string
  /** Mon–Fri dates, YYYY-MM-DD */
  days: string[]
  /** Row times, HH:MM (Amsterdam) */
  times: string[]
  /** cellKey(date, time) → block start (UTC ISO); missing = not bookable */
  cells: Record<string, string>
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BOOKING_TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

/** Amsterdam date (YYYY-MM-DD) and time (HH:MM) of a UTC ISO instant. */
export function amsterdamParts(iso: string): { date: string; time: string } {
  const p: Record<string, string> = {}
  for (const part of partsFormatter.formatToParts(new Date(iso))) p[part.type] = part.value
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` }
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function mondayOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const weekday = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7 // Monday = 0
  return addDays(date, -weekday)
}

export function cellKey(date: string, time: string): string {
  return `${date} ${time}`
}

export function buildWeeks(grid: readonly string[]): GridWeek[] {
  const times = new Set<string>()
  const byWeek = new Map<string, Record<string, string>>()
  for (const iso of grid) {
    const { date, time } = amsterdamParts(iso)
    times.add(time)
    const monday = mondayOf(date)
    const cells = byWeek.get(monday) ?? {}
    cells[cellKey(date, time)] = iso
    byWeek.set(monday, cells)
  }
  const sortedTimes = [...times].sort()
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monday, cells]) => ({
      monday,
      days: [0, 1, 2, 3, 4].map((i) => addDays(monday, i)),
      times: sortedTimes,
      cells,
    }))
}
