<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLeadStore } from '@/stores/useLeadStore'
import LeadColumn from '@/components/leads/LeadColumn.vue'
import { LEAD_STATUSES } from '@/types/lead'
import type { LeadStatus } from '@/types/lead'

const { t } = useI18n()
const store = useLeadStore()

onMounted(() => store.loadLeads())

const leadsByStatus = computed(() => {
  const map = new Map<LeadStatus, typeof store.leads>()
  for (const s of LEAD_STATUSES) {
    map.set(s, [])
  }
  for (const lead of store.leads) {
    const bucket = map.get(lead.status)
    if (bucket) bucket.push(lead)
  }
  return map
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('leads.board.heading') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t('leads.board.subheading') }}</p>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
               bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
        :disabled="store.loading"
        @click="store.loadLeads()"
      >
        {{ store.loading ? t('leads.board.loading') : t('leads.board.refresh') }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="store.error" class="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      {{ store.error }}
    </div>

    <!-- Skeleton loader -->
    <div v-if="store.loading && store.leads.length === 0" class="flex gap-4 overflow-x-auto pb-4">
      <div
        v-for="n in 5"
        :key="n"
        class="min-w-[220px] w-56 shrink-0 h-48 bg-slate-100 rounded-xl animate-pulse"
      />
    </div>

    <!-- Kanban board -->
    <div v-else class="flex gap-4 overflow-x-auto pb-6 flex-1">
      <LeadColumn
        v-for="status in LEAD_STATUSES"
        :key="status"
        :status="status"
        :leads="leadsByStatus.get(status) ?? []"
      />
    </div>
  </div>
</template>
