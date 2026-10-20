<script setup lang="ts">
/** [ORGANISM] Shown on /afspraak after a successful booking. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BOOKING_TIMEZONE, amsterdamParts } from '@/utils/bookingGrid'
import type { BookingConfirmation } from '@/types/booking'

const props = defineProps<{ confirmation: BookingConfirmation; email: string }>()
const { t, locale } = useI18n()

/** Only show the meeting link when it is a plain https URL (no javascript: or other schemes). */
const meetingUrl = computed(() => {
  const raw = props.confirmation.meetingUrl
  if (!raw) return null
  try {
    return new URL(raw).protocol === 'https:' ? raw : null
  } catch {
    return null
  }
})

const when = computed(() => {
  const day = new Intl.DateTimeFormat(locale.value === 'nl' ? 'nl-NL' : 'en-GB', {
    timeZone: BOOKING_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(props.confirmation.start))
  return `${day} · ${amsterdamParts(props.confirmation.start).time}–${amsterdamParts(props.confirmation.end).time}`
})
</script>

<template>
  <div
    class="mx-auto max-w-xl rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm sm:p-8"
    data-testid="booking-confirmation"
  >
    <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <h1 class="mb-3 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">{{ t('booking.confirmed.title') }}</h1>
    <p class="mb-2 text-lg text-slate-700">{{ when }}</p>
    <p class="mb-6 break-words text-slate-500">
      {{ confirmation.emailSent ? t('booking.confirmed.emailSent', { email }) : t('booking.confirmed.emailFailed') }}
    </p>
    <p v-if="meetingUrl" class="mb-6 text-slate-600">
      {{ t('booking.confirmed.video') }}
      <a
        :href="meetingUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="break-all font-medium text-indigo-600 underline hover:text-indigo-500"
        >{{ meetingUrl }}</a
      >
    </p>
    <p v-else class="mb-6 text-slate-600">{{ t('booking.confirmed.videoLater') }}</p>
    <RouterLink
      :to="{ name: 'home' }"
      class="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-500"
    >
      {{ t('booking.confirmed.backHome') }}
    </RouterLink>
  </div>
</template>
