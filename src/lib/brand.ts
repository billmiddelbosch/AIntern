export const BRAND_COLORS = {
  dark:  '#0f172a', // slate-950 — primary dark surface
  light: '#f8fafc', // slate-50  — primary light surface
  white: '#ffffff', // pure white
} as const

export type BgColor = keyof typeof BRAND_COLORS
