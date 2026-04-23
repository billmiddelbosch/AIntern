<script setup lang="ts">
import type { Lead } from '@/types/lead'
import LeadStatusBadge from '@/components/leads/LeadStatusBadge.vue'

defineProps<{ lead: Lead }>()

function displayName(lead: Lead): string {
  return lead.companyName ?? lead.website
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 p-3 space-y-2 shadow-sm">
    <div class="font-medium text-sm text-slate-800 truncate">{{ displayName(lead) }}</div>
    <div v-if="lead.linkedinName" class="text-xs text-slate-500 truncate">{{ lead.linkedinName }}</div>
    <LeadStatusBadge :status="lead.status" />
  </div>
</template>
