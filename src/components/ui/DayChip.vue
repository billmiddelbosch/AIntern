<script setup lang="ts">
/**
 * [ATOM] Compact day button: weekday, day number and month stacked.
 * Labels are passed in already formatted, so the atom has no date logic.
 */
withDefaults(
  defineProps<{
    weekday: string
    day: string
    month: string
    selected?: boolean
    /** Small dot under the date, e.g. "has open blocks" */
    marked?: boolean
  }>(),
  { selected: false, marked: false },
)
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="relative flex min-h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:w-20"
    :class="
      selected
        ? 'border-indigo-600 bg-indigo-600 text-white'
        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
    "
    @click="$emit('click')"
  >
    <span class="block text-xs uppercase tracking-wide opacity-80">{{ weekday }}</span>
    <span class="block text-xl font-bold leading-tight">{{ day }}</span>
    <span class="block text-xs opacity-80">{{ month }}</span>
    <span
      v-if="marked"
      class="absolute bottom-1 h-1.5 w-1.5 rounded-full"
      :class="selected ? 'bg-white' : 'bg-emerald-500'"
      aria-hidden="true"
    />
  </button>
</template>
