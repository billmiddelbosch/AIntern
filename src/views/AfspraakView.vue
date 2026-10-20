<script setup lang="ts">
/** [PAGE] /afspraak — public booking page: SlotPicker + BookingForm, then a confirmation. */
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { AppShell } from '@/components/shell'
import BookingConfirmationCard from '@/components/booking/BookingConfirmationCard.vue'
import BookingForm from '@/components/booking/BookingForm.vue'
import SlotPicker from '@/components/booking/SlotPicker.vue'
import { useBooking } from '@/composables/useBooking'
import { useBookingPage } from '@/composables/useBookingPage'
import { useAnalytics } from '@/composables/useAnalytics'
import { BOOKING_TIMEZONE, amsterdamParts } from '@/utils/bookingGrid'
import type { BookingConfirmation, BookingFormValues } from '@/types/booking'

const { t, locale } = useI18n()
const route = useRoute()
const { trackEvent } = useAnalytics()
const { consumeNote } = useBookingPage()
const { slots, durationMinutes, loadingSlots, slotsError, submitting, loadSlots, submitBooking } =
  useBooking()

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'

useHead({
  title: computed(() => t('booking.meta.title')),
  meta: [
    { name: 'description', content: computed(() => t('booking.meta.description')) },
    { property: 'og:title', content: computed(() => t('booking.meta.title')) },
    { property: 'og:description', content: computed(() => t('booking.meta.description')) },
    { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
  ],
  link: [{ rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) }],
})

const initialNote = consumeNote()
const selectedSlot = ref<string | null>(null)
const slotTaken = ref(false)
const slotPicker = ref<HTMLElement | null>(null)
const submitError = ref<'invalid' | 'too_many' | 'error' | null>(null)
const confirmation = ref<BookingConfirmation | null>(null)
const confirmedEmail = ref('')

watch(selectedSlot, (slot) => {
  if (!slot) return
  slotTaken.value = false
  trackEvent('booking_slot_selected', { day: amsterdamParts(slot).date })
})

const selectedLabel = computed(() => {
  if (!selectedSlot.value) return ''
  const day = new Intl.DateTimeFormat(locale.value === 'nl' ? 'nl-NL' : 'en-GB', {
    timeZone: BOOKING_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(selectedSlot.value))
  return `${day} · ${amsterdamParts(selectedSlot.value).time}`
})

async function handleSubmit(values: BookingFormValues): Promise<void> {
  submitError.value = null
  if (!selectedSlot.value) return
  const result = await submitBooking({
    ...values,
    start: selectedSlot.value,
    locale: locale.value === 'en' ? 'en' : 'nl',
  })
  if (result.ok) {
    confirmedEmail.value = values.email
    confirmation.value = result.booking
    trackEvent('booking_confirmed', { day: amsterdamParts(result.booking.start).date })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  if (result.reason === 'slot_unavailable') {
    selectedSlot.value = null
    slotTaken.value = true
    await loadSlots()
    slotPicker.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  submitError.value = result.reason
}

onMounted(() => void loadSlots())
</script>

<template>
  <AppShell>
    <section class="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 pt-28 pb-20 sm:px-6">
      <div class="mx-auto max-w-5xl">
        <BookingConfirmationCard v-if="confirmation" :confirmation="confirmation" :email="confirmedEmail" />

        <template v-else>
          <header class="mb-10 text-center">
            <span
              class="mb-4 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600"
            >
              {{ t('booking.eyebrow') }}
            </span>
            <h1 class="mb-4 font-heading text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
              {{ t('booking.heading') }}
            </h1>
            <p class="mx-auto max-w-2xl text-lg text-slate-500">
              {{ t('booking.sub', { minutes: durationMinutes }) }}
            </p>
          </header>

          <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
            <div ref="slotPicker" class="min-w-0 scroll-mt-24 lg:col-span-3">
              <SlotPicker
                v-model="selectedSlot"
                :slots="slots"
                :loading="loadingSlots"
                :error="!!slotsError"
                :taken="slotTaken"
                @retry="loadSlots"
              />
            </div>
            <BookingForm
              class="lg:col-span-2"
              :has-slot="!!selectedSlot"
              :selected-label="selectedLabel"
              :submitting="submitting"
              :submit-error="submitError"
              :initial-note="initialNote"
              @submit="handleSubmit"
            />
          </div>
        </template>
      </div>
    </section>
  </AppShell>
</template>
