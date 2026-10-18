// Pure helpers for the savings calculator (SavingsModal).

/** AIntern's "vanaf" price per month, as published on the site. */
export const AINTERN_FROM_PER_MONTH = 99

export const MAX_AMOUNT = 100_000
export const MAX_EXTRA_TOOLS = 5
export const MAX_TOOL_NAME_LENGTH = 60

export interface ToolLine {
  name: string
  amount: number
}

/** Clamp user input to a sane, whole euro amount. Non-numbers become 0. */
export function sanitizeAmount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(Math.round(n), MAX_AMOUNT)
}

/** Trim and shorten a free-text tool name; strips control characters. */
export function sanitizeToolName(value: string): string {
  const printable = Array.from(value, (ch) => {
    const code = ch.charCodeAt(0)
    // Control characters, plus invisible zero-width and text-direction marks
    const invisible =
      (code >= 0x200b && code <= 0x200f) ||
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2066 && code <= 0x2069)
    return code < 32 || code === 127 || invisible ? ' ' : ch
  }).join('')
  return printable.trim().slice(0, MAX_TOOL_NAME_LENGTH)
}

export function monthlyTotal(lines: ToolLine[]): number {
  return lines.reduce((sum, line) => sum + sanitizeAmount(line.amount), 0)
}

/** Indicative monthly saving versus AIntern's starting price (never negative). */
export function monthlySaving(total: number): number {
  return Math.max(total - AINTERN_FROM_PER_MONTH, 0)
}
