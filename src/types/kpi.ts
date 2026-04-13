export type KrType = 'numeric' | 'boolean'

export interface KeyResult {
  id: string
  label: string
  description: string
  targetValue: number
  unit: string
  type: KrType
}

export interface OKRObjective {
  id: string
  ownerLabel: string
  title: string
  keyResults: KeyResult[]
}

export interface WeeklyKpi {
  id: string
  label: string
  description: string
  targetPerWeek: number
  unit: string
}

export interface CLevel {
  role: string
  kpis: WeeklyKpi[]
}
