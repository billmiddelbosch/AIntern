<script setup lang="ts">
/** [ATOM] Small colour swatch with a label, for chart and grid legends. */
defineProps<{ variant: 'open' | 'closed' | 'booked' | 'pending'; label: string }>()

const swatch: Record<'open' | 'closed' | 'booked' | 'pending', string> = {
  open: 'rounded-sm bg-emerald-500',
  closed: 'rounded-sm border border-slate-300 bg-white',
  booked: 'rounded-full bg-indigo-500',
  pending: 'rounded-sm ring-2 ring-amber-400',
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-xs text-slate-500">
    <span class="inline-block h-3 w-3 shrink-0" :class="swatch[variant]" aria-hidden="true" />
    {{ label }}
  </span>
</template>
