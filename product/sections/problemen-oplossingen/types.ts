import type { PropType } from 'vue'

// =============================================================================
// Data Types
// =============================================================================

export interface PairLocale {
  problemTitle: string
  problemDescription: string
  solutionTitle: string
  solutionDescription: string
}

export interface ProbleemOplossingPair {
  id: string
  order: number
  /** Lucide icon name for the problem card */
  problemIcon: string
  /** Lucide icon name for the solution card */
  solutionIcon: string
  nl: PairLocale
  en: PairLocale
}

// =============================================================================
// Component Props
// =============================================================================

export interface ProbleemOplossingSectionProps {
  pairs: ProbleemOplossingPair[]
}

export interface ProbleemOplossingPairProps {
  pair: ProbleemOplossingPair
  /** Row index — drives alternating layout on desktop */
  index: number
}

export interface CardProps {
  title: string
  description: string
  icon: string
  variant: 'problem' | 'solution'
}

// =============================================================================
// Prop Definitions (runtime validation)
// =============================================================================

export const probleemOplossingSectionPropDefs = {
  pairs: {
    type: Array as PropType<ProbleemOplossingPair[]>,
    required: true,
  },
} as const
