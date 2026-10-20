<script setup lang="ts">
/**
 * [ORGANISM] Step 1 of /afspraak: pick a day, then a time.
 * Handles the loading, error and empty states of the slot list.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DayStrip from '@/components/booking/DayStrip.vue'
import SlotList from '@/components/booking/SlotList.vue'
import { amsterdamParts, dayOption, groupByDay } from '@/utils/bookingGrid'

const props = defineProps<{ slots: string[]; loading: boolean; error: boolean; taken: boolean }>()
defineEmits<{ retry: [] }>()
const selectedSlot = defineModel<string | null>({ required: true })
const { t, locale } = useI18n()

const intlLocale = computed(() => (locale.value === 'nl' ? 'nl-NL' : 'en-GB'))
const groups = computed(() => groupByDay(props.slots))
const days = computed(() => groups.value.map((g) => dayOption(g.date, intlLocale.value)))

const selectedDay = ref<string | null>(null)
watch(
  groups,
  (list) => {
    if (!list.some((g) => g.date === selectedDay.value)) selectedDay.value = list[0]?.date ?? null
  },
  { immediate: true },
)
watch(selectedDay, (day, prev) => {
  if (prev !== null && day !== prev) selectedSlot.value = null
})

const times = computed(() =>
  (groups.value.find((g) => g.date === selectedDay.value)?.slots ?? []).map((iso) => ({
    value: iso,
    label: amsterdamParts(iso).time,
  })),
)
</script>

<template>
  <div class="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-8">
    <h2 class="mb-1 font-heading text-xl font-semibold text-slate-900">{{ t('booking.step1.title') }}</h2>
    <p class="mb-6 text-sm text-slate-500">{{ t('booking.step1.timezone') }}</p>

    <div v-if="loading" class="flex justify-center py-16" role="status">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      <span class="sr-only">{{ t('booking.step1.loading') }}</span>
    </div>

    <div v-else-if="error" class="py-10 text-center">
      <p class="mb-4 text-slate-600">{{ t('booking.step1.error') }}</p>
      <button
        type="button"
        class="min-h-11 rounded-xl border border-indigo-200 px-5 font-medium text-indigo-700 hover:bg-indigo-50"
        @click="$emit('retry')"
      >
        {{ t('booking.step1.retry') }}
      </button>
    </div>

    <p v-else-if="days.length === 0" class="py-10 text-center text-slate-600">{{ t('booking.step1.empty') }}</p>

    <template v-else>
      <p
        v-if="taken"
        class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        role="alert"
      >
        {{ t('booking.step1.taken') }}
      </p>
      <DayStrip v-model="selectedDay" :days="days" :label="t('booking.step1.dayLabel')" />
      <SlotList v-model="selectedSlot" class="mt-6" :slots="times" :label="t('booking.step1.timeLabel')" />
    </template>
  </div>
</template>
