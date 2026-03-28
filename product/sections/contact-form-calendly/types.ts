import type { PropType } from 'vue'

// =============================================================================
// Data Types
// =============================================================================

/** Possible states of the contact form submission lifecycle */
export type ContactFormStatus = 'idle' | 'loading' | 'success' | 'error'

/** A single form field descriptor */
export interface ContactFormField {
  id: 'name' | 'email' | 'message'
  type: 'text' | 'email' | 'textarea'
  required: boolean
  maxLength: number
  rows?: number
}

/** Configuration for the Calendly inline embed widget */
export interface CalendlyConfig {
  /** Full Calendly embed URL — driven by VITE_CALENDLY_URL */
  url: string
  /** Minimum pixel width for the embed iframe */
  minWidth: number
  /** Pixel height for the embed iframe */
  height: number
  /** Direct link to Calendly shown when the embed is unavailable */
  placeholderLink: string
  /** Calendly branding: hide event type details */
  hideEventTypeDetails: boolean
  /** Calendly branding: hide landing page details */
  hideLandingPageDetails: boolean
  /** Primary accent colour passed to the Calendly embed (hex without #) */
  primaryColor: string
}

// =============================================================================
// Component Props (for use with defineProps)
// =============================================================================

/**
 * Props for ContactCalendlySection.vue
 *
 * Usage in component:
 * ```vue
 * <script setup lang="ts">
 * import type { ContactCalendlySectionProps } from '@/../product/sections/contact-form-calendly/types'
 *
 * const props = defineProps<ContactCalendlySectionProps>()
 * </script>
 * ```
 */
export interface ContactCalendlySectionProps {
  /** Optional override for the Calendly embed URL (defaults to VITE_CALENDLY_URL) */
  calendlyUrl?: string
}

/**
 * Props for CalendlyWidget.vue (the inline embed atom)
 *
 * Usage:
 * ```vue
 * const props = defineProps<CalendlyWidgetProps>()
 * ```
 */
export interface CalendlyWidgetProps {
  /** Full Calendly embed URL */
  url: string
  /** Height of the embed in pixels */
  height?: number
  /** Primary accent colour (hex without #) */
  primaryColor?: string
}

/**
 * Props for ContactFormInline.vue
 *
 * Usage:
 * ```vue
 * const props = defineProps<ContactFormInlineProps>()
 * ```
 */
export interface ContactFormInlineProps {
  /** Externally controlled submission status (for testing/storybook) */
  initialStatus?: ContactFormStatus
}

// =============================================================================
// Component Events (for use with defineEmits)
// =============================================================================

/**
 * Events emitted by ContactFormInline.vue
 *
 * Usage:
 * ```vue
 * const emit = defineEmits<ContactFormInlineEmits>()
 * emit('submitted')
 * ```
 */
export interface ContactFormInlineEmits {
  /** Emitted when the form has been successfully submitted */
  (e: 'submitted'): void
  /** Emitted when the form submission fails */
  (e: 'error'): void
}

// =============================================================================
// Prop Definitions (for runtime validation)
// =============================================================================

/**
 * Runtime prop definitions for CalendlyWidget.vue
 *
 * Usage:
 * ```vue
 * import { calendlyWidgetPropDefs } from '@/../product/sections/contact-form-calendly/types'
 * const props = defineProps(calendlyWidgetPropDefs)
 * ```
 */
export const calendlyWidgetPropDefs = {
  url: {
    type: String as PropType<string>,
    required: true,
  },
  height: {
    type: Number as PropType<number>,
    default: 630,
  },
  primaryColor: {
    type: String as PropType<string>,
    default: '4f46e5',
  },
} as const
