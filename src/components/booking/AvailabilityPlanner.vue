<script setup lang="ts">
/**
 * [ORGANISM] Lets the admin open or close bookable blocks, week by week.
 * Phone/tablet: day picker + list of blocks. From lg: the full week table.
 * Emits only the diff (open/close) on save.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AvailabilityDayList from '@/components/booking/AvailabilityDayList.vue'
import AvailabilityLegend from '@/components/booking/AvailabilityLegend.vue'
import AvailabilityWeekTable from '@/components/booking/AvailabilityWeekTable.vue'
import SaveBar from '@/components/booking/SaveBar.vue'
import { useAvailabilityDraft } from '@/composables/useAvailabilityDraft'
import { buildWeeks, dayCells, formatDate } from '@/utils/bookingGrid'
import type { AdminBooking, AvailabilityChange } from '@/types/booking'

const props = defineProps<{
  grid: string[]
  open: string[]
  bookings: AdminBooking[]
  saving: boolean
  saved: boolean
}>()
const emit = defineEmits<{ save: [change: AvailabilityChange] }>()
const { t, locale } = useI18n()

const { draft, reset, allOpen, toggle, discard, changes, changed, pendingCount } =
  useAvailabilityDraft()
watch(() => props.open, reset, { immediate: true })

const weeks = computed(() => buildWeeks(props.grid))
const weekIndex = ref(0)
watch(weeks, (w) => (weekIndex.value = Math.min(weekIndex.value, Math.max(w.length - 1, 0))))
const week = computed(() => weeks.value[weekIndex.value] ?? null)

const booked = computed(() => {
  const map = new Map<string, AdminBooking>()
  for (const b of props.bookings) map.set(b.start, b)
  return map
})

const weekIsos = computed(() =>
  week.value
    ? week.value.days.flatMap((d) =>
        dayCells(week.value!, d)
          .map((c) => c.iso)
          .filter((iso): iso is string => !!iso && !booked.value.has(iso)),
      )
    : [],
)

const intlLocale = computed(() => (locale.value === 'nl' ? 'nl-NL' : 'en-GB'))
const weekTitle = computed(() =>
  week.value
    ? t('admin.bookings.weekOf', {
        date: formatDate(week.value.monday, intlLocale.value, { weekday: 'short', day: 'numeric', month: 'short' }),
      })
    : '',
)

const navClass =
  'flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 md:min-h-8 md:min-w-8'
</script>

<template>
  <section class="min-w-0" data-testid="availability-planner">
    <div class="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-slate-800">{{ t('admin.bookings.availability') }}</h3>
        <p class="text-sm text-slate-500">{{ t('admin.bookings.availabilityHint') }}</p>
      </div>
      <AvailabilityLegend />
    </div>

    <p v-if="!week" class="text-sm text-slate-400">{{ t('admin.bookings.noGrid') }}</p>

    <div v-else class="rounded-xl border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            :class="navClass"
            :disabled="weekIndex === 0"
            :aria-label="t('admin.bookings.prevWeek')"
            @click="weekIndex--"
          >
            ←
          </button>
          <span class="text-sm font-medium text-slate-700">{{ weekTitle }}</span>
          <button
            type="button"
            :class="navClass"
            :disabled="weekIndex >= weeks.length - 1"
            :aria-label="t('admin.bookings.nextWeek')"
            @click="weekIndex++"
          >
            →
          </button>
        </div>
        <button
          type="button"
          class="min-h-11 rounded-lg bg-emerald-50 px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 md:min-h-8 md:text-xs"
          :disabled="weekIsos.length === 0"
          @click="toggle(weekIsos)"
        >
          {{ allOpen(weekIsos) ? t('admin.bookings.closeWeek') : t('admin.bookings.openWeek') }}
        </button>
      </div>

      <AvailabilityDayList
        class="lg:hidden"
        :week="week"
        :open="draft"
        :changed="changed"
        :booked="booked"
        @toggle="toggle"
      />
      <AvailabilityWeekTable
        class="hidden lg:block"
        :week="week"
        :open="draft"
        :changed="changed"
        :booked="booked"
        @toggle="toggle"
      />

      <SaveBar
        :pending-count="pendingCount"
        :saving="saving"
        :saved="saved"
        @save="emit('save', changes)"
        @discard="discard"
      />
    </div>
  </section>
</template>
