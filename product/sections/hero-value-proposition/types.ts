import type { PropType } from 'vue'

// =============================================================================
// Data Types
// =============================================================================

export interface HeroLocale {
  headline: string
  subtext: string
  cta: string
  socialProof: string
}

export interface HeroContent {
  nl: HeroLocale
  en: HeroLocale
}

export interface MetricCard {
  id: string
  label: string
  value: string
  /** 'up' = positive result (savings, reduction) */
  trend: 'up' | 'down' | 'neutral'
  description: string
}

export interface AutomatedProcess {
  id: string
  name: string
  status: 'active' | 'inactive'
  tasksPerWeek: number
}

// =============================================================================
// Component Props (for use with defineProps)
// =============================================================================

/**
 * Props for HeroSection.vue
 *
 * Usage in component:
 * ```vue
 * <script setup lang="ts">
 * import type { HeroSectionProps } from '@/../product/sections/hero-value-proposition/types'
 *
 * const props = defineProps<HeroSectionProps>()
 * const emit = defineEmits<HeroSectionEmits>()
 * </script>
 * ```
 */
export interface HeroSectionProps {
  /** Tweetalige kopij voor de hero sectie */
  heroContent: HeroContent
  /** KPI-kaartjes voor de dashboard mockup */
  metricCards: MetricCard[]
  /** Geautomatiseerde processen voor de dashboard mockup */
  automatedProcesses: AutomatedProcess[]
}

// =============================================================================
// Component Events (for use with defineEmits)
// =============================================================================

/**
 * Events emitted by HeroSection.vue
 */
export interface HeroSectionEmits {
  /** Emitted when the user clicks the primary CTA button */
  (e: 'cta-click'): void
}

// =============================================================================
// Prop Definitions (for runtime validation)
// =============================================================================

export const heroSectionPropDefs = {
  heroContent: {
    type: Object as PropType<HeroContent>,
    required: true,
  },
  metricCards: {
    type: Array as PropType<MetricCard[]>,
    required: true,
  },
  automatedProcesses: {
    type: Array as PropType<AutomatedProcess[]>,
    required: true,
  },
} as const
