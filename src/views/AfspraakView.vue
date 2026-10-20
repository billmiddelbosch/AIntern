<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { AppShell } from '@/components/shell'
import { useBooking } from '@/composables/useBooking'
import { useBookingPage } from '@/composables/useBookingPage'
import { useAnalytics } from '@/composables/useAnalytics'
import type { BookingConfirmation } from '@/types/booking'

const { t, locale } = useI18n()
const route = useRoute()
const { trackEvent } = useAnalytics()
const { consumeNote } = useBookingPage()
const { slots, durationMinutes, loadingSlots, slotsError, submitting, loadSlots, submitBooking } =
  useBooking()

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'
const TIMEZONE = 'Europe/Amsterdam'

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

// ── Slot selection ───────────────────────────────────────────────────────────

const intlLocale = computed(() => (locale.value === 'nl' ? 'nl-NL' : 'en-GB'))

function dayKey(iso: string): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date(iso))
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatDay(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(intlLocale.value, { timeZone: TIMEZONE, ...opts }).format(
    new Date(iso),
  )
}

const days = computed(() => {
  const map = new Map<string, string[]>()
  for (const slot of slots.value) {
    const key = dayKey(slot)
    const list = map.get(key)
    if (list) list.push(slot)
    else map.set(key, [slot])
  }
  return [...map.entries()].map(([key, daySlots]) => ({ key, first: daySlots[0], slots: daySlots }))
})

const selectedDay = ref<string | null>(null)
const selectedSlot = ref<string | null>(null)
const slotTaken = ref(false)
const slotPicker = ref<HTMLElement | null>(null)

const selectedDaySlots = computed(
  () => days.value.find((d) => d.key === selectedDay.value)?.slots ?? [],
)

watch(days, (list) => {
  if (!list.some((d) => d.key === selectedDay.value)) selectedDay.value = list[0]?.key ?? null
})

function selectDay(key: string) {
  selectedDay.value = key
  selectedSlot.value = null
}

function selectSlot(slot: string) {
  selectedSlot.value = slot
  slotTaken.value = false
  trackEvent('booking_slot_selected', { day: dayKey(slot) })
}

const selectedLabel = computed(() =>
  selectedSlot.value
    ? `${formatDay(selectedSlot.value, { weekday: 'long', day: 'numeric', month: 'long' })} · ${formatTime(selectedSlot.value)}`
    : '',
)

// ── Form ─────────────────────────────────────────────────────────────────────

const form = reactive({
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  note: '',
  fax: '', // honeypot
})
const consent = ref(false)
const submitError = ref<'invalid' | 'too_many' | 'error' | null>(null)
const submitErrorText = computed(() => {
  if (submitError.value === 'invalid') return t('booking.form.invalid')
  if (submitError.value === 'too_many') return t('booking.form.too_many')
  return t('booking.form.error')
})
const touched = ref(false)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const errors = computed(() => ({
  companyName: !form.companyName.trim(),
  contactName: !form.contactName.trim(),
  email: !EMAIL_RE.test(form.email.trim()),
  phone: form.phone.trim() !== '' && !/^[0-9+()\-.\s]{6,30}$/.test(form.phone.trim()),
  consent: !consent.value,
}))
const formValid = computed(() => !Object.values(errors.value).some(Boolean))

const confirmation = ref<BookingConfirmation | null>(null)

async function handleSubmit() {
  touched.value = true
  submitError.value = null
  if (!selectedSlot.value || !formValid.value) return

  const result = await submitBooking({
    start: selectedSlot.value,
    companyName: form.companyName.trim(),
    contactName: form.contactName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || undefined,
    website: form.website.trim() || undefined,
    note: form.note.trim() || undefined,
    locale: locale.value === 'en' ? 'en' : 'nl',
    fax: form.fax,
  })

  if (result.ok) {
    confirmation.value = result.booking
    trackEvent('booking_confirmed', { day: dayKey(result.booking.start) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  if (result.reason === 'slot_unavailable') {
    slotTaken.value = true
    selectedSlot.value = null
    await loadSlots()
    slotPicker.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  submitError.value = result.reason
}

onMounted(() => {
  form.note = consumeNote()
  void loadSlots()
})

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
const errorInputClass = 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
</script>

<template>
  <AppShell>
    <section class="bg-slate-50 pt-28 pb-20 px-4 sm:px-6 min-h-[calc(100vh-4rem)]">
      <div class="max-w-5xl mx-auto">
        <!-- ── Confirmation ─────────────────────────────────────────────── -->
        <div
          v-if="confirmation"
          class="max-w-xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center"
          data-testid="booking-confirmation"
        >
          <div
            class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h1 class="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            {{ t('booking.confirmed.title') }}
          </h1>
          <p class="text-lg text-slate-700 mb-2">
            {{ formatDay(confirmation.start, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}
            · {{ formatTime(confirmation.start) }}–{{ formatTime(confirmation.end) }}
          </p>
          <p class="text-slate-500 mb-6">
            {{
              confirmation.emailSent
                ? t('booking.confirmed.emailSent', { email: form.email.trim() })
                : t('booking.confirmed.emailFailed')
            }}
          </p>
          <p v-if="confirmation.meetingUrl" class="text-slate-600 mb-6">
            {{ t('booking.confirmed.video') }}
            <a
              :href="confirmation.meetingUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-indigo-600 hover:text-indigo-500 underline break-all"
              >{{ confirmation.meetingUrl }}</a
            >
          </p>
          <p v-else class="text-slate-600 mb-6">{{ t('booking.confirmed.videoLater') }}</p>
          <RouterLink
            :to="{ name: 'home' }"
            class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500"
          >
            {{ t('booking.confirmed.backHome') }}
          </RouterLink>
        </div>

        <!-- ── Booking flow ─────────────────────────────────────────────── -->
        <template v-else>
          <header class="text-center mb-10">
            <span
              class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 mb-4"
            >
              {{ t('booking.eyebrow') }}
            </span>
            <h1 class="font-heading text-3xl sm:text-5xl font-bold leading-tight text-slate-900 mb-4">
              {{ t('booking.heading') }}
            </h1>
            <p class="text-lg text-slate-500 max-w-2xl mx-auto">
              {{ t('booking.sub', { minutes: durationMinutes }) }}
            </p>
          </header>

          <div class="grid lg:grid-cols-5 gap-6 items-start">
            <!-- Step 1: pick a moment -->
            <div ref="slotPicker" class="scroll-mt-24 lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <h2 class="font-heading text-xl font-semibold text-slate-900 mb-1">
                {{ t('booking.step1.title') }}
              </h2>
              <p class="text-sm text-slate-500 mb-6">{{ t('booking.step1.timezone') }}</p>

              <div v-if="loadingSlots" class="flex justify-center py-16" role="status">
                <div
                  class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"
                />
                <span class="sr-only">{{ t('booking.step1.loading') }}</span>
              </div>

              <div v-else-if="slotsError" class="py-10 text-center">
                <p class="text-slate-600 mb-4">{{ t('booking.step1.error') }}</p>
                <button
                  type="button"
                  class="rounded-xl border border-indigo-200 px-5 py-2.5 font-medium text-indigo-700 hover:bg-indigo-50"
                  @click="loadSlots"
                >
                  {{ t('booking.step1.retry') }}
                </button>
              </div>

              <p v-else-if="days.length === 0" class="py-10 text-center text-slate-600">
                {{ t('booking.step1.empty') }}
              </p>

              <template v-else>
                <p
                  v-if="slotTaken"
                  class="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800"
                  role="alert"
                >
                  {{ t('booking.step1.taken') }}
                </p>

                <!-- Days -->
                <div
                  class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1"
                  role="listbox"
                  :aria-label="t('booking.step1.dayLabel')"
                >
                  <button
                    v-for="day in days"
                    :key="day.key"
                    type="button"
                    role="option"
                    :aria-selected="day.key === selectedDay"
                    class="flex-shrink-0 w-20 rounded-xl border px-2 py-3 text-center transition-colors"
                    :class="
                      day.key === selectedDay
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                    "
                    @click="selectDay(day.key)"
                  >
                    <span class="block text-xs uppercase tracking-wide opacity-80">
                      {{ formatDay(day.first, { weekday: 'short' }) }}
                    </span>
                    <span class="block text-xl font-bold leading-tight">
                      {{ formatDay(day.first, { day: 'numeric' }) }}
                    </span>
                    <span class="block text-xs opacity-80">
                      {{ formatDay(day.first, { month: 'short' }) }}
                    </span>
                  </button>
                </div>

                <!-- Times -->
                <div
                  class="mt-6 grid grid-cols-3 sm:grid-cols-4 gap-2"
                  role="listbox"
                  :aria-label="t('booking.step1.timeLabel')"
                >
                  <button
                    v-for="slot in selectedDaySlots"
                    :key="slot"
                    type="button"
                    role="option"
                    :aria-selected="slot === selectedSlot"
                    class="rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors"
                    :class="
                      slot === selectedSlot
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                    "
                    @click="selectSlot(slot)"
                  >
                    {{ formatTime(slot) }}
                  </button>
                </div>
              </template>
            </div>

            <!-- Step 2: details -->
            <form
              class="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-4"
              novalidate
              @submit.prevent="handleSubmit"
            >
              <h2 class="font-heading text-xl font-semibold text-slate-900">
                {{ t('booking.step2.title') }}
              </h2>

              <p
                class="rounded-xl px-4 py-3 text-sm"
                :class="selectedSlot ? 'bg-indigo-50 text-indigo-800' : 'bg-slate-50 text-slate-500'"
                data-testid="booking-selected-slot"
              >
                {{ selectedSlot ? selectedLabel : t('booking.step2.noSlot') }}
              </p>

              <div>
                <label for="bk-company" class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('booking.form.companyName') }} *
                </label>
                <input
                  id="bk-company"
                  v-model="form.companyName"
                  type="text"
                  maxlength="120"
                  autocomplete="organization"
                  :class="[inputClass, touched && errors.companyName ? errorInputClass : '']"
                  :aria-invalid="touched && errors.companyName"
                />
              </div>

              <div>
                <label for="bk-name" class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('booking.form.contactName') }} *
                </label>
                <input
                  id="bk-name"
                  v-model="form.contactName"
                  type="text"
                  maxlength="100"
                  autocomplete="name"
                  :class="[inputClass, touched && errors.contactName ? errorInputClass : '']"
                  :aria-invalid="touched && errors.contactName"
                />
              </div>

              <div>
                <label for="bk-email" class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('booking.form.email') }} *
                </label>
                <input
                  id="bk-email"
                  v-model="form.email"
                  type="email"
                  maxlength="254"
                  autocomplete="email"
                  :class="[inputClass, touched && errors.email ? errorInputClass : '']"
                  :aria-invalid="touched && errors.email"
                />
              </div>

              <div>
                <label for="bk-phone" class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('booking.form.phone') }}
                </label>
                <input
                  id="bk-phone"
                  v-model="form.phone"
                  type="tel"
                  maxlength="30"
                  autocomplete="tel"
                  :class="[inputClass, touched && errors.phone ? errorInputClass : '']"
                  :aria-invalid="touched && errors.phone"
                />
              </div>

              <div>
                <label for="bk-website" class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('booking.form.website') }}
                </label>
                <input
                  id="bk-website"
                  v-model="form.website"
                  type="text"
                  inputmode="url"
                  maxlength="200"
                  autocomplete="url"
                  :placeholder="t('booking.form.websitePlaceholder')"
                  :class="inputClass"
                />
              </div>

              <div>
                <label for="bk-note" class="block text-sm font-medium text-slate-700 mb-1">
                  {{ t('booking.form.note') }}
                </label>
                <textarea
                  id="bk-note"
                  v-model="form.note"
                  rows="4"
                  maxlength="2000"
                  :placeholder="t('booking.form.notePlaceholder')"
                  :class="inputClass"
                />
              </div>

              <!-- Honeypot: hidden from people, bots fill it in -->
              <div class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
                <label for="bk-fax">Fax</label>
                <input id="bk-fax" v-model="form.fax" type="text" tabindex="-1" autocomplete="off" />
              </div>

              <label class="flex items-start gap-3 text-sm text-slate-600">
                <input
                  v-model="consent"
                  type="checkbox"
                  class="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  :aria-invalid="touched && errors.consent"
                />
                <span :class="touched && errors.consent ? 'text-red-600' : ''">
                  {{ t('booking.form.consent') }}
                  <RouterLink
                    :to="{ name: 'privacy' }"
                    class="font-medium text-indigo-600 hover:text-indigo-500 underline"
                    >{{ t('booking.form.privacyLink') }}</RouterLink
                  >.
                </span>
              </label>

              <p v-if="touched && !formValid" class="text-sm text-red-600" role="alert">
                {{ t('booking.form.fixErrors') }}
              </p>
              <p v-if="submitError" class="text-sm text-red-600" role="alert">
                {{ submitErrorText }}
              </p>

              <button
                type="submit"
                class="w-full rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!selectedSlot || submitting"
              >
                {{ submitting ? t('booking.form.submitting') : t('booking.form.submit') }}
              </button>
            </form>
          </div>
        </template>
      </div>
    </section>
  </AppShell>
</template>
