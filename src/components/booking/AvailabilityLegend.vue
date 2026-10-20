<script setup lang="ts">
/** [MOLECULE] Legend for the availability planner. Wraps on small screens. */
import { useI18n } from 'vue-i18n'
import LegendDot from '@/components/ui/LegendDot.vue'

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <LegendDot variant="open" :label="t('admin.bookings.legendOpen')" />
    <LegendDot variant="closed" :label="t('admin.bookings.legendClosed')" />
    <LegendDot variant="booked" :label="t('admin.bookings.legendBooked')" />
    <LegendDot variant="pending" :label="t('admin.bookings.legendPending')" />
  </div>
</template>
