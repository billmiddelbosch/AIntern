<script setup lang="ts">
/**
 * [ORGANISM] Step 2 of /afspraak: company + contact details.
 * Validates locally and emits the trimmed values; the page does the API call.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FormField from '@/components/ui/FormField.vue'
import type { BookingFormValues } from '@/types/booking'

const props = defineProps<{
  hasSlot: boolean
  selectedLabel: string
  submitting: boolean
  submitError: 'invalid' | 'too_many' | 'error' | null
  initialNote?: string
}>()
const emit = defineEmits<{ submit: [values: BookingFormValues] }>()
const { t } = useI18n()

const form = reactive({
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  note: props.initialNote ?? '',
  fax: '', // honeypot
})
const consent = ref(false)
const touched = ref(false)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[0-9+()\-.\s]{6,30}$/

const errors = computed(() => ({
  companyName: !form.companyName.trim(),
  contactName: !form.contactName.trim(),
  email: !EMAIL_RE.test(form.email.trim()),
  phone: form.phone.trim() !== '' && !PHONE_RE.test(form.phone.trim()),
  consent: !consent.value,
}))
const formValid = computed(() => !Object.values(errors.value).some(Boolean))

const submitErrorText = computed(() => {
  if (props.submitError === 'invalid') return t('booking.form.invalid')
  if (props.submitError === 'too_many') return t('booking.form.too_many')
  return t('booking.form.error')
})

function handleSubmit(): void {
  touched.value = true
  if (!props.hasSlot || !formValid.value) return
  emit('submit', {
    companyName: form.companyName.trim(),
    contactName: form.contactName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || undefined,
    website: form.website.trim() || undefined,
    note: form.note.trim() || undefined,
    fax: form.fax,
  })
}
</script>

<template>
  <form
    class="min-w-0 space-y-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-8"
    novalidate
    @submit.prevent="handleSubmit"
  >
    <h2 class="font-heading text-xl font-semibold text-slate-900">{{ t('booking.step2.title') }}</h2>

    <p
      class="rounded-xl px-4 py-3 text-sm"
      :class="hasSlot ? 'bg-indigo-50 text-indigo-800' : 'bg-slate-50 text-slate-500'"
      data-testid="booking-selected-slot"
    >
      {{ hasSlot ? selectedLabel : t('booking.step2.noSlot') }}
    </p>

    <FormField
      id="bk-company"
      v-model="form.companyName"
      :label="t('booking.form.companyName')"
      required
      :maxlength="120"
      autocomplete="organization"
      :invalid="touched && errors.companyName"
    />
    <FormField
      id="bk-name"
      v-model="form.contactName"
      :label="t('booking.form.contactName')"
      required
      :maxlength="100"
      autocomplete="name"
      :invalid="touched && errors.contactName"
    />
    <FormField
      id="bk-email"
      v-model="form.email"
      type="email"
      :label="t('booking.form.email')"
      required
      :maxlength="254"
      autocomplete="email"
      :invalid="touched && errors.email"
    />
    <FormField
      id="bk-phone"
      v-model="form.phone"
      type="tel"
      :label="t('booking.form.phone')"
      :maxlength="30"
      autocomplete="tel"
      :invalid="touched && errors.phone"
    />
    <FormField
      id="bk-website"
      v-model="form.website"
      :label="t('booking.form.website')"
      inputmode="url"
      :maxlength="200"
      autocomplete="url"
      :placeholder="t('booking.form.websitePlaceholder')"
    />
    <FormField
      id="bk-note"
      v-model="form.note"
      :label="t('booking.form.note')"
      :rows="4"
      :maxlength="2000"
      :placeholder="t('booking.form.notePlaceholder')"
    />

    <!-- Honeypot: hidden from people, bots fill it in -->
    <div class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
      <label for="bk-fax">Fax</label>
      <input id="bk-fax" v-model="form.fax" type="text" tabindex="-1" autocomplete="off" />
    </div>

    <label class="flex cursor-pointer items-start gap-3 py-2 text-sm text-slate-600">
      <input
        v-model="consent"
        type="checkbox"
        class="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        :aria-invalid="touched && errors.consent"
      />
      <span :class="touched && errors.consent ? 'text-red-600' : ''">
        {{ t('booking.form.consent') }}
        <RouterLink :to="{ name: 'privacy' }" class="font-medium text-indigo-600 underline hover:text-indigo-500">{{
          t('booking.form.privacyLink')
        }}</RouterLink
        >.
      </span>
    </label>

    <p v-if="touched && !formValid" class="text-sm text-red-600" role="alert">{{ t('booking.form.fixErrors') }}</p>
    <p v-if="submitError" class="text-sm text-red-600" role="alert">{{ submitErrorText }}</p>

    <button
      type="submit"
      class="min-h-12 w-full rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="!hasSlot || submitting"
    >
      {{ submitting ? t('booking.form.submitting') : t('booking.form.submit') }}
    </button>
  </form>
</template>
