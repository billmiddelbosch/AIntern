<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/**
 * OpponentCountStepper — small +/- stepper for the number of simulated
 * opponents (1-8). Deliberately compact/secondary — card entry is the
 * primary interaction of this feature.
 */
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
  }>(),
  {
    min: 1,
    max: 8,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const { t } = useI18n()

function decrement() {
  if (props.modelValue > props.min) emit('update:modelValue', props.modelValue - 1)
}

function increment() {
  if (props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1)
}
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <button
      type="button"
      data-testid="opponent-decrement"
      class="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 text-sm font-semibold hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-600"
      :disabled="modelValue <= min"
      :aria-label="t('pokerOdds.opponents.decrease')"
      @click="decrement"
    >
      −
    </button>
    <span
      data-testid="opponent-count"
      class="w-6 text-center text-sm font-semibold text-slate-800 tabular-nums"
      >{{ modelValue }}</span
    >
    <button
      type="button"
      data-testid="opponent-increment"
      class="w-7 h-7 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 text-sm font-semibold hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-600"
      :disabled="modelValue >= max"
      :aria-label="t('pokerOdds.opponents.increase')"
      @click="increment"
    >
      +
    </button>
  </div>
</template>
