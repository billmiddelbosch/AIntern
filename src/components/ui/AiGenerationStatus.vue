<!--
  AiGenerationStatus.vue [ATOM]

  Atomic Level: Atom
  Atomic Rationale: Smallest indivisible status indicator. No project-specific
  logic, no store imports, no composables. Renders a spinner, checkmark, or
  error badge purely from a status prop. Can be embedded in any surface — prompt
  panels, save panels, gallery headers — without carrying context.

  Design tokens: indigo accent (10%), slate neutrals (60-30 rule).
  8pt grid: icon 16px, gap 6px, badge padding 4px 8px.
-->
<script setup lang="ts">
export type AiGenerationStatusValue = 'idle' | 'loading' | 'success' | 'error'

const props = defineProps<{
  status: AiGenerationStatusValue
  message?: string
}>()
</script>

<template>
  <!-- idle: render nothing -->
  <span v-if="props.status === 'idle'" />

  <!-- loading: animated spinner + label -->
  <span
    v-else-if="props.status === 'loading'"
    class="inline-flex items-center gap-1.5 text-sm text-slate-500"
    role="status"
    aria-live="polite"
  >
    <svg
      class="w-4 h-4 animate-spin text-indigo-500 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <span>{{ props.message ?? 'Generating...' }}</span>
  </span>

  <!-- success: green checkmark badge -->
  <span
    v-else-if="props.status === 'success'"
    class="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5"
    role="status"
    aria-live="polite"
  >
    <svg
      class="w-3.5 h-3.5 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clip-rule="evenodd"
      />
    </svg>
    <span>{{ props.message ?? 'Done' }}</span>
  </span>

  <!-- error: red badge -->
  <span
    v-else-if="props.status === 'error'"
    class="inline-flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5"
    role="alert"
    aria-live="assertive"
  >
    <svg
      class="w-3.5 h-3.5 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clip-rule="evenodd"
      />
    </svg>
    <span>{{ props.message ?? 'Error' }}</span>
  </span>
</template>
