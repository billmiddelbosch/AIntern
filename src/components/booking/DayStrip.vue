<script setup lang="ts">
/**
 * [MOLECULE] Horizontally scrolling row of DayChips. Scrolls inside its own box,
 * so it never makes the page wider than the screen.
 */
import DayChip from '@/components/ui/DayChip.vue'
import type { DayOption } from '@/types/booking'

defineProps<{ days: DayOption[]; label: string }>()
const selected = defineModel<string | null>({ required: true })
</script>

<template>
  <div class="min-w-0">
    <div
      class="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2"
      role="listbox"
      :aria-label="label"
      data-testid="day-strip"
    >
      <DayChip
        v-for="day in days"
        :key="day.key"
        class="snap-start"
        role="option"
        :aria-selected="day.key === selected"
        :weekday="day.weekday"
        :day="day.day"
        :month="day.month"
        :marked="day.marked"
        :selected="day.key === selected"
        @click="selected = day.key"
      />
    </div>
  </div>
</template>
