<script setup lang="ts">
/** [PAGE] Admin: planned appointments + availability planner. */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AvailabilityPlanner from '@/components/booking/AvailabilityPlanner.vue'
import BookingCard from '@/components/booking/BookingCard.vue'
import { useAdminBookings } from '@/composables/useAdminBookings'
import { BOOKING_TIMEZONE, amsterdamParts } from '@/utils/bookingGrid'
import type { AdminBooking, AdminBookingsResponse, AvailabilityChange } from '@/types/booking'

const { t, locale } = useI18n()
const router = useRouter()
const { fetchBookings, updateAvailability } = useAdminBookings()

const data = ref<AdminBookingsResponse | null>(null)
const loading = ref(false)
const saving = ref(false)
const saved = ref(false)
const error = ref<string | null>(null)
const now = ref(Date.now())

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    data.value = await fetchBookings()
    now.value = Date.now()
  } catch {
    error.value = t('admin.bookings.loadError')
  } finally {
    loading.value = false
  }
}

async function save(change: AvailabilityChange): Promise<void> {
  saving.value = true
  saved.value = false
  error.value = null
  try {
    data.value = await updateAvailability(change)
    now.value = Date.now()
    saved.value = true
  } catch {
    error.value = t('admin.bookings.saveError')
  } finally {
    saving.value = false
  }
}

const upcoming = computed(() =>
  (data.value?.bookings ?? []).filter((b) => Date.parse(b.end) >= now.value),
)
const past = computed(() =>
  (data.value?.bookings ?? []).filter((b) => Date.parse(b.end) < now.value).reverse(),
)

const dateLocale = computed(() => (locale.value === 'nl' ? 'nl-NL' : 'en-GB'))

function formatBookingTime(b: AdminBooking): string {
  const day = new Intl.DateTimeFormat(dateLocale.value, {
    timeZone: BOOKING_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(b.start))
  return `${day} · ${amsterdamParts(b.start).time}–${amsterdamParts(b.end).time}`
}

function openLead(b: AdminBooking): void {
  if (!b.leadWebsite) return
  router.push({ name: 'admin-lead-detail', params: { id: encodeURIComponent(b.leadWebsite) } })
}

onMounted(load)
</script>

<template>
  <div class="flex min-w-0 flex-col gap-8">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('admin.bookings.heading') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t('admin.bookings.subheading') }}</p>
      </div>
      <button
        type="button"
        class="min-h-11 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50 md:min-h-8 md:px-3 md:text-xs"
        :disabled="loading || saving"
        @click="load"
      >
        {{ loading ? t('admin.bookings.loading') : t('admin.bookings.refresh') }}
      </button>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
      {{ error }}
    </div>

    <div v-if="loading && !data" class="space-y-2">
      <div v-for="n in 4" :key="n" class="h-12 animate-pulse rounded-lg bg-slate-100" />
    </div>

    <template v-else-if="data">
      <section class="min-w-0">
        <h3 class="mb-3 text-lg font-semibold text-slate-800">{{ t('admin.bookings.upcoming') }}</h3>
        <p v-if="upcoming.length === 0" class="text-sm text-slate-400">
          {{ t('admin.bookings.emptyUpcoming') }}
        </p>
        <ul v-else class="grid gap-3 md:grid-cols-2" data-testid="upcoming-bookings">
          <BookingCard
            v-for="b in upcoming"
            :key="b.bookingId || b.start"
            :booking="b"
            :when="formatBookingTime(b)"
            @view-lead="openLead(b)"
          />
        </ul>

        <details v-if="past.length > 0" class="mt-4">
          <summary class="flex min-h-11 cursor-pointer items-center text-sm font-medium text-slate-500">
            {{ t('admin.bookings.past', { count: past.length }) }}
          </summary>
          <ul class="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            <li
              v-for="b in past"
              :key="b.bookingId || b.start"
              class="flex flex-col gap-1 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4"
            >
              <span class="text-slate-400">{{ formatBookingTime(b) }}</span>
              <span class="font-medium text-slate-700">{{ b.companyName }}</span>
              <span>{{ b.contactName }}</span>
              <a :href="`mailto:${b.email}`" class="break-all text-indigo-600 hover:underline">{{ b.email }}</a>
              <button
                v-if="b.leadWebsite"
                type="button"
                class="inline-flex min-h-11 items-center text-xs font-medium text-indigo-600 hover:underline sm:min-h-0"
                @click="openLead(b)"
              >
                {{ t('admin.bookings.viewLead') }} →
              </button>
            </li>
          </ul>
        </details>
      </section>

      <AvailabilityPlanner
        :grid="data.grid"
        :open="data.open"
        :bookings="data.bookings"
        :saving="saving"
        :saved="saved"
        @save="save"
      />
    </template>
  </div>
</template>
