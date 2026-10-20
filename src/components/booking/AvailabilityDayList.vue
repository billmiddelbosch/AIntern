<script setup lang="ts">
/**
 * [ORGANISM] Phone/tablet view of the availability planner: pick a day in a
 * DayStrip, then tap full-width rows to open or close each block.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DayStrip from '@/components/booking/DayStrip.vue'
import { dayCells, dayOption, formatDate, type GridWeek } from '@/utils/bookingGrid'
import type { AdminBooking } from '@/types/booking'

const props = defineProps<{
  week: GridWeek
  open: ReadonlySet<string>
  changed: ReadonlySet<string>
  booked: ReadonlyMap<string, AdminBooking>
}>()
const emit = defineEmits<{ toggle: [isos: string[]] }>()
const { t, locale } = useI18n()

const intlLocale = computed(() => (locale.value === 'nl' ? 'nl-NL' : 'en-GB'))

/** First day of the week that has bookable blocks */
function firstUsableDay(week: GridWeek): string {
  return week.days.find((d) => dayCells(week, d).some((c) => c.iso)) ?? week.days[0]
}

const selectedDay = ref<string | null>(firstUsableDay(props.week))
watch(
  () => props.week.monday,
  () => (selectedDay.value = firstUsableDay(props.week)),
)

const days = computed(() =>
  props.week.days.map((d) =>
    dayOption(
      d,
      intlLocale.value,
      dayCells(props.week, d).some((c) => c.iso && props.open.has(c.iso)),
    ),
  ),
)

const rows = computed(() => (selectedDay.value ? dayCells(props.week, selectedDay.value) : []))
const editable = computed(() =>
  rows.value.map((r) => r.iso).filter((iso): iso is string => !!iso && !props.booked.has(iso)),
)
const dayAllOpen = computed(
  () => editable.value.length > 0 && editable.value.every((iso) => props.open.has(iso)),
)
const dayTitle = computed(() =>
  selectedDay.value
    ? formatDate(selectedDay.value, intlLocale.value, { weekday: 'long', day: 'numeric', month: 'long' })
    : '',
)
</script>

<template>
  <div class="space-y-4 p-4">
    <DayStrip v-model="selectedDay" :days="days" :label="t('admin.bookings.pickDay')" />

    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold capitalize text-slate-800">{{ dayTitle }}</p>
      <button
        type="button"
        class="min-h-11 shrink-0 rounded-lg bg-emerald-50 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
        :disabled="editable.length === 0"
        data-testid="day-toggle"
        @click="emit('toggle', editable)"
      >
        {{ dayAllOpen ? t('admin.bookings.closeDay') : t('admin.bookings.openDay') }}
      </button>
    </div>

    <ul class="space-y-2" data-testid="day-blocks">
      <template v-for="row in rows" :key="row.time">
        <li v-if="!row.iso" />
        <li
          v-else-if="booked.has(row.iso)"
          class="flex min-h-12 items-center gap-3 rounded-lg bg-indigo-50 px-4 text-sm text-indigo-700"
        >
          <span class="w-12 shrink-0 font-medium tabular-nums">{{ row.time }}</span>
          <span class="truncate">{{ t('admin.bookings.bookedBy', { company: booked.get(row.iso)?.companyName }) }}</span>
        </li>
        <li v-else>
          <button
            type="button"
            class="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-4 text-sm transition-colors"
            :class="[
              open.has(row.iso)
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50',
              changed.has(row.iso) ? 'ring-2 ring-amber-400 ring-offset-1' : '',
            ]"
            :aria-pressed="open.has(row.iso)"
            @click="emit('toggle', [row.iso])"
          >
            <span class="font-medium tabular-nums">{{ row.time }}</span>
            <span class="text-xs font-medium">
              {{ open.has(row.iso) ? t('admin.bookings.legendOpen') : t('admin.bookings.legendClosed') }}
            </span>
          </button>
        </li>
      </template>
    </ul>
  </div>
</template>
