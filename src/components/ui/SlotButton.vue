<script setup lang="ts">
/**
 * [ATOM] Selectable button with a 44px minimum tap target.
 * Used for time slots and other one-of-many choices.
 */
withDefaults(defineProps<{ selected?: boolean; disabled?: boolean }>(), {
  selected: false,
  disabled: false,
})
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="min-h-11 w-full rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
    :class="
      selected
        ? 'border-indigo-600 bg-indigo-600 text-white'
        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
    "
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>
