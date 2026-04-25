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
  </div>
</template>
