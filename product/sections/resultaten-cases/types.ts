export type TagCategory = 'tijdsbesparing' | 'kostenbesparing' | 'groei' | 'kwaliteit'

export interface ResultaatCaseLocale {
  title: string
  description: string
  metricLabel: string
}

export interface ResultaatCase {
  id: string
  order: number
  metric: string
  metricUnit: string
  tag: TagCategory
  icon: string
  nl: ResultaatCaseLocale
  en: ResultaatCaseLocale
}

export interface ResultatenCasesSectionProps {
  cases: ResultaatCase[]
}
