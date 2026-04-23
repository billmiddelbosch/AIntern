<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LeadStatus } from '@/types/lead'

const props = defineProps<{ status: LeadStatus }>()
const { t } = useI18n()

const colorMap: Record<LeadStatus, string> = {
  new: 'bg-slate-100 text-slate-600 ring-slate-200',
  enriched: 'bg-blue-50 text-blue-700 ring-blue-200',
  connection_sent: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  connected: 'bg-violet-50 text-violet-700 ring-violet-200',
  dm_sent: 'bg-purple-50 text-purple-700 ring-purple-200',
  dm_responded: 'bg-pink-50 text-pink-700 ring-pink-200',
  discovery_booked: 'bg-amber-50 text-amber-700 ring-amber-200',
  won: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  lost: 'bg-red-50 text-red-600 ring-red-200',
  not_found: 'bg-slate-100 text-slate-500 ring-slate-200',
}

const classes = computed(() => colorMap[props.status])
const label = computed(() => t(`leads.status.${props.status}`))
</script>

<template>
  <span class="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ring-1" :class="classes">
    {{ label }}
  </span>
</template>
