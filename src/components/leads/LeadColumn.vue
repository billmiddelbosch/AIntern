<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Lead, LeadStatus } from '@/types/lead'
import LeadCard from '@/components/leads/LeadCard.vue'

const props = defineProps<{
  status: LeadStatus
  leads: Lead[]
}>()

const { t } = useI18n()

const label = computed(() => t(`leads.status.${props.status}`))
</script>

<template>
  <div class="flex flex-col min-w-[220px] w-56 shrink-0">
    <!-- Column header -->
    <div class="flex items-center justify-between mb-3 px-1">
      <span class="text-xs font-semibold text-slate-600 uppercase tracking-wide">{{ label }}</span>
      <span class="text-xs font-medium bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
        {{ leads.length }}
      </span>
    </div>

    <!-- Cards -->
    <div class="flex flex-col gap-2 min-h-[60px]">
      <LeadCard v-for="lead in leads" :key="lead.id" :lead="lead" />
    </div>
  </div>
</template>
