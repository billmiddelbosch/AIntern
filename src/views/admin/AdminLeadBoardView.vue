<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLeadStore } from '@/stores/useLeadStore'
import { useEditorialOutreach } from '@/composables/useEditorialOutreach'
import LeadColumn from '@/components/leads/LeadColumn.vue'
import { LEAD_STATUSES } from '@/types/lead'
import type { LeadStatus } from '@/types/lead'

const { t } = useI18n()
const store = useLeadStore()

type Tab = 'leads' | 'editorial'
const activeTab = ref<Tab>('leads')

const editorial = useEditorialOutreach()

async function switchTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'editorial' && editorial.items.value.length === 0) {
    await editorial.fetchItems('pending_approval')
  }
}

async function handleApprove(id: string) {
  await editorial.approve(id)
}

async function handleSkip(id: string) {
  if (!confirm('Editorial item overslaan?')) return
  await editorial.skip(id)
}

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
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('leads.board.heading') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t('leads.board.subheading') }}</p>
      </div>
      <button
        v-if="activeTab === 'leads'"
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
               bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
        :disabled="store.loading"
        @click="store.loadLeads()"
      >
        {{ store.loading ? t('leads.board.loading') : t('leads.board.refresh') }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-200 gap-1 mb-5">
      <button
        v-for="tab in (['leads', 'editorial'] as const)"
        :key="tab"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeTab === tab
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="switchTab(tab)"
      >
        {{ tab === 'leads' ? 'Leads' : 'Editorial Outreach' }}
      </button>
    </div>

    <!-- Tab: Leads -->
    <template v-if="activeTab === 'leads'">
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
    </template>

    <!-- Tab: Editorial Outreach -->
    <template v-else-if="activeTab === 'editorial'">
      <div v-if="editorial.loading.value" class="text-slate-500 text-sm">Laden...</div>
      <p v-else-if="editorial.error.value" class="text-red-600 text-sm">{{ editorial.error.value }}</p>

      <template v-else>
        <div v-if="editorial.items.value.length === 0" class="py-12 text-center text-slate-400 text-sm">
          Geen editorial mails wachten op goedkeuring
        </div>

        <div v-else class="space-y-3">
          <p class="text-sm text-slate-500">
            {{ editorial.items.value.length }} mail(s) wachten op jouw goedkeuring vóór verzending via Sanne.
          </p>

          <div
            v-for="item in editorial.items.value"
            :key="item.id"
            class="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-semibold text-slate-700">
                    {{ editorial.publicationName(item.publicationId) }}
                  </span>
                  <span class="text-xs text-slate-400">·</span>
                  <span class="text-xs text-slate-500">{{ item.editorialReason }}</span>
                  <span v-if="item.angle" class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {{ item.angle }}
                  </span>
                </div>
                <a
                  :href="item.articleUrl"
                  target="_blank"
                  rel="noopener"
                  class="text-sm text-indigo-600 hover:underline font-medium block mt-1 line-clamp-1"
                >
                  {{ item.articleTitle }}
                </a>
                <p class="text-xs text-slate-500 mt-0.5">
                  Naar: {{ item.contactName ?? item.contactEmail ?? 'redactie' }}
                  <span v-if="item.emailSource" class="text-slate-400">({{ item.emailSource }})</span>
                </p>
              </div>
              <div class="flex gap-2 shrink-0">
                <button
                  class="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                  @click="handleApprove(item.id)"
                >
                  Goedkeuren
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  @click="handleSkip(item.id)"
                >
                  Overslaan
                </button>
              </div>
            </div>

            <!-- Mail preview -->
            <div v-if="item.emailSubject || item.emailBody" class="bg-slate-50 rounded-lg p-3 space-y-1">
              <p v-if="item.emailSubject" class="text-xs font-semibold text-slate-700">
                Onderwerp: {{ item.emailSubject }}
              </p>
              <p v-if="item.emailBody" class="text-xs text-slate-600 whitespace-pre-line line-clamp-4">
                {{ item.emailBody }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
