import type { PropType } from 'vue'

// =============================================================================
// Data Types
// =============================================================================

export interface StepLocale {
  title: string
  description: string
}

export interface Step {
  id: string
  order: number
  /** Lucide icon name (e.g. 'search', 'cpu', 'trending-up') */
  icon: string
  nl: StepLocale
  en: StepLocale
}

// =============================================================================
// Component Props (for use with defineProps)
// =============================================================================

/**
 * Props for HowItWorksSection.vue
 *
 * Usage in component:
 * ```vue
 * <script setup lang="ts">
 * import type { HowItWorksSectionProps } from '@/../product/sections/hoe-werkt-het/types'
 *
 * const props = defineProps<HowItWorksSectionProps>()
 * </script>
 * ```
 */
export interface HowItWorksSectionProps {
  /** De drie processtappen in volgorde */
  steps: Step[]
}

// =============================================================================
// Prop Definitions (for runtime validation)
// =============================================================================

export const howItWorksSectionPropDefs = {
  steps: {
    type: Array as PropType<Step[]>,
    required: true,
  },
} as const
