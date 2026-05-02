<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Lead } from '@/types/lead'
import LeadStatusBadge from '@/components/leads/LeadStatusBadge.vue'

const props = defineProps<{ lead: Lead }>()
const router = useRouter()

function displayName(lead: Lead): string {
  return lead.companyName ?? lead.website
}

function navigate(): void {
  router.push({ name: 'admin-lead-detail', params: { id: encodeURIComponent(props.lead.website) } })
}
</script>

<template>
  <div
    class="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    @click="navigate"
  >
    <div class="font-medium text-sm text-slate-800 truncate">{{ displayName(lead) }}</div>
    <div v-if="lead.linkedinName" class="text-xs text-slate-500 truncate">{{ lead.linkedinName }}</div>
    <LeadStatusBadge :status="lead.status" />
    <div v-if="!lead.email" class="flex items-center gap-1 text-xs text-amber-500">
      <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
      e-mail ontbreekt
    </div>
    <div v-if="lead.status === 'email_sent' && lead.lastEmailSubject" class="rounded-lg bg-cyan-50 border border-cyan-100 px-2.5 py-2 space-y-1">
      <div class="text-[10px] font-semibold text-cyan-600 uppercase tracking-wide">Verstuurde e-mail</div>
      <div class="text-xs font-medium text-slate-700 truncate">{{ lead.lastEmailSubject }}</div>
      <div v-if="lead.lastEmailBody" class="text-[11px] text-slate-500 line-clamp-3 whitespace-pre-wrap">{{ lead.lastEmailBody }}</div>
    </div>
  </div>
</template>
