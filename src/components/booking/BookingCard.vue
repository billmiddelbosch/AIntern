<script setup lang="ts">
/** [MOLECULE] One planned appointment in the admin. */
import { useI18n } from 'vue-i18n'
import type { AdminBooking } from '@/types/booking'

defineProps<{ booking: AdminBooking; when: string }>()
defineEmits<{ viewLead: [] }>()
const { t } = useI18n()
</script>

<template>
  <li class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
    <p class="text-xs font-medium text-indigo-600">{{ when }}</p>
    <p class="mt-1 break-words font-semibold text-slate-800">{{ booking.companyName }}</p>
    <p class="text-sm text-slate-600">{{ booking.contactName }}</p>
    <div class="mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-3">
      <a :href="`mailto:${booking.email}`" class="inline-flex min-h-11 items-center break-all text-indigo-600 hover:underline sm:min-h-0">
        {{ booking.email }}
      </a>
      <a
        v-if="booking.phone"
        :href="`tel:${booking.phone}`"
        class="inline-flex min-h-11 items-center text-indigo-600 hover:underline sm:min-h-0"
      >
        {{ booking.phone }}
      </a>
    </div>
    <p v-if="booking.note" class="mt-2 whitespace-pre-line break-words text-sm text-slate-500">
      <span class="font-medium text-slate-600">{{ t('admin.bookings.note') }}:</span> {{ booking.note }}
    </p>
    <button
      v-if="booking.leadWebsite"
      type="button"
      class="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-indigo-600 hover:underline sm:min-h-0 sm:text-xs"
      @click="$emit('viewLead')"
    >
      {{ t('admin.bookings.viewLead') }} →
    </button>
  </li>
</template>
