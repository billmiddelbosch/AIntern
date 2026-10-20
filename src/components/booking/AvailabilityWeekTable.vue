<script setup lang="ts">
/**
 * [MOLECULE] Desktop view of the availability planner: Mon–Fri × time table.
 * Only shown from lg up; phones use AvailabilityDayList.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { dayCells, formatDate, type GridWeek } from '@/utils/bookingGrid'
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

function dayLabel(date: string): string {
  return formatDate(date, intlLocale.value, { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Toggleable blocks of a day (bookable and not booked) */
const editableByDay = computed(() => {
  const map = new Map<string, string[]>()
  for (const date of props.week.days) {
    map.set(
      date,
      dayCells(props.week, date)
        .map((c) => c.iso)
        .filter((iso): iso is string => !!iso && !props.booked.has(iso)),
    )
  }
  return map
})

function dayAllOpen(date: string): boolean {
  const isos = editableByDay.value.get(date) ?? []
  return isos.length > 0 && isos.every((iso) => props.open.has(iso))
}

function cellIso(date: string, time: string): string | undefined {
  return props.week.cells[`${date} ${time}`]
}

function cellLabel(date: string, time: string, iso: string): string {
  const booking = props.booked.get(iso)
  const state = booking
    ? t('admin.bookings.bookedBy', { company: booking.companyName })
    : props.open.has(iso)
      ? t('admin.bookings.legendOpen')
      : t('admin.bookings.legendClosed')
  return `${dayLabel(date)} ${time} — ${state}`
}
</script>

<template>
  <div class="overflow-x-auto p-4">
    <table class="w-full min-w-[560px] table-fixed border-separate border-spacing-1 text-xs">
      <thead>
        <tr>
          <th class="w-14" />
          <th v-for="date in week.days" :key="date" class="font-medium text-slate-600">
            <div>{{ dayLabel(date) }}</div>
            <button
              type="button"
              class="mt-1 text-[11px] font-normal text-emerald-700 hover:underline disabled:text-slate-300 disabled:no-underline"
              :disabled="(editableByDay.get(date) ?? []).length === 0"
              @click="emit('toggle', editableByDay.get(date) ?? [])"
            >
              {{ dayAllOpen(date) ? t('admin.bookings.closeDay') : t('admin.bookings.openDay') }}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="time in week.times" :key="time">
          <th class="pr-2 text-right font-normal text-slate-400">{{ time }}</th>
          <td v-for="date in week.days" :key="date" class="p-0">
            <template v-for="iso in [cellIso(date, time)]" :key="iso ?? 'none'">
              <div v-if="!iso" class="h-8 rounded-md bg-slate-50" />
              <div
                v-else-if="booked.has(iso)"
                class="flex h-8 items-center gap-1 truncate rounded-md bg-indigo-50 px-2 text-indigo-700"
                :title="cellLabel(date, time, iso)"
              >
                <span aria-hidden="true">●</span>
                <span class="truncate">{{ booked.get(iso)?.companyName }}</span>
              </div>
              <button
                v-else
                type="button"
                class="block h-8 w-full rounded-md transition-colors"
                :class="[
                  open.has(iso)
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'border border-slate-200 bg-white hover:bg-emerald-50',
                  changed.has(iso) ? 'ring-2 ring-amber-400' : '',
                ]"
                :aria-pressed="open.has(iso)"
                :aria-label="cellLabel(date, time, iso)"
                :title="cellLabel(date, time, iso)"
                @click="emit('toggle', [iso])"
              />
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
