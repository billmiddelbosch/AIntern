<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLeadStore } from '@/stores/useLeadStore'
import { useEditorialOutreach } from '@/composables/useEditorialOutreach'
import { useEmailSequences } from '@/composables/useEmailSequences'
import LeadColumn from '@/components/leads/LeadColumn.vue'
import { LEAD_STATUSES } from '@/types/lead'
import type { LeadStatus } from '@/types/lead'

const { t } = useI18n()
const store = useLeadStore()

type Tab = 'leads' | 'editorial' | 'sequences'
type EditorialFilter = 'pending_approval' | 'sent'

const activeTab = ref<Tab>('leads')
const editorialFilter = ref<EditorialFilter>('pending_approval')

const editorial = useEditorialOutreach()
const sequences = useEmailSequences()
const actioningId = ref<string | null>(null)
const actionError = ref<string | null>(null)

interface EditDraft { subject: string; body: string }
const editDrafts = ref<Record<string, EditDraft>>({})
const seqEditDrafts = ref<Record<string, EditDraft>>({})

function startEdit(id: string, subject: string, body: string) {
  editDrafts.value[id] = { subject: subject ?? '', body: body ?? '' }
}

function cancelEdit(id: string) {
  delete editDrafts.value[id]
}

async function saveEdit(id: string) {
  const draft = editDrafts.value[id]
  if (!draft) return
  actioningId.value = id
  actionError.value = null
  const ok = await editorial.updateEmail(id, draft.subject, draft.body)
  if (ok) {
    delete editDrafts.value[id]
  } else {
    actionError.value = 'Opslaan mislukt — probeer opnieuw'
  }
  actioningId.value = null
}

async function switchTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'editorial' && editorial.items.value.length === 0) {
    await editorial.fetchItems('pending_approval')
  }
  if (tab === 'sequences' && sequences.items.value.length === 0) {
    await sequences.fetchItems()
  }
}

function seqStartEdit(id: string, subject: string, body: string) {
  seqEditDrafts.value[id] = { subject: subject ?? '', body: body ?? '' }
}

function seqCancelEdit(id: string) {
  delete seqEditDrafts.value[id]
}

async function seqSaveEdit(id: string) {
  const draft = seqEditDrafts.value[id]
  if (!draft) return
  actioningId.value = id
  actionError.value = null
  const ok = await sequences.updateEmail(id, draft.subject, draft.body)
  if (ok) {
    delete seqEditDrafts.value[id]
  } else {
    actionError.value = 'Opslaan mislukt — probeer opnieuw'
  }
  actioningId.value = null
}

async function switchEditorialFilter(filter: EditorialFilter) {
  editorialFilter.value = filter
  editDrafts.value = {}
  actionError.value = null
  await editorial.fetchItems(filter)
}

async function handleApprove(id: string) {
  actioningId.value = id
  actionError.value = null
  const ok = await editorial.approve(id)
  if (!ok) actionError.value = 'Goedkeuren mislukt — probeer opnieuw'
  actioningId.value = null
}

async function handleSkip(id: string) {
  if (!confirm('Editorial item overslaan?')) return
  actioningId.value = id
  actionError.value = null
  await editorial.skip(id)
  actioningId.value = null
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
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
        v-for="tab in (['leads', 'editorial', 'sequences'] as const)"
        :key="tab"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeTab === tab
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="switchTab(tab)"
      >
        {{ tab === 'leads' ? 'Leads' : tab === 'editorial' ? 'Editorial Outreach' : 'E-mail Sequences' }}
      </button>
    </div>

    <!-- Tab: Leads -->
    <template v-if="activeTab === 'leads'">
      <div v-if="store.error" class="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        {{ store.error }}
      </div>
      <div v-if="store.loading && store.leads.length === 0" class="flex gap-4 overflow-x-auto pb-4">
        <div
          v-for="n in 5"
          :key="n"
          class="min-w-[220px] w-56 shrink-0 h-48 bg-slate-100 rounded-xl animate-pulse"
        />
      </div>
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

      <!-- Sub-filter: Te goedkeuren / Verzonden -->
      <div class="flex gap-1 mb-4">
        <button
          v-for="f in (['pending_approval', 'sent'] as const)"
          :key="f"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          :class="editorialFilter === f
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'"
          @click="switchEditorialFilter(f)"
        >
          {{ f === 'pending_approval' ? 'Te goedkeuren' : 'Emails verzonden' }}
        </button>
      </div>

      <div v-if="editorial.loading.value" class="text-slate-500 text-sm">Laden...</div>
      <p v-else-if="editorial.error.value" class="text-red-600 text-sm">{{ editorial.error.value }}</p>

      <template v-else>

        <!-- ── Te goedkeuren ───────────────────────────────────────────── -->
        <template v-if="editorialFilter === 'pending_approval'">
          <div v-if="editorial.items.value.length === 0" class="py-12 text-center text-slate-400 text-sm">
            Geen editorial mails wachten op goedkeuring
          </div>

          <div v-else class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-sm text-slate-500">
                {{ editorial.items.value.length }} mail(s) wachten op goedkeuring vóór verzending via Sanne.
              </p>
              <button
                class="text-xs text-indigo-600 hover:underline"
                @click="editorial.fetchItems('pending_approval')"
              >
                Verversen
              </button>
            </div>

            <p v-if="actionError" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {{ actionError }}
            </p>

            <div
              v-for="item in editorial.items.value"
              :key="item.id"
              class="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
              :class="{ 'opacity-50 pointer-events-none': actioningId === item.id }"
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
                    class="text-sm text-indigo-600 hover:underline font-medium block mt-1"
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
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                    :disabled="actioningId === item.id"
                    @click="handleApprove(item.id)"
                  >
                    {{ actioningId === item.id ? '...' : 'Goedkeuren' }}
                  </button>
                  <button
                    class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                    :disabled="actioningId === item.id"
                    @click="handleSkip(item.id)"
                  >
                    Overslaan
                  </button>
                </div>
              </div>

              <!-- Mail — edit mode -->
              <div v-if="editDrafts[item.id]" class="space-y-2">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Onderwerp</label>
                  <input
                    v-model="editDrafts[item.id].subject"
                    type="text"
                    class="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Mailbody</label>
                  <textarea
                    v-model="editDrafts[item.id].body"
                    rows="8"
                    class="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y font-mono"
                  />
                </div>
                <div class="flex gap-2">
                  <button
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                    :disabled="actioningId === item.id"
                    @click="saveEdit(item.id)"
                  >
                    {{ actioningId === item.id ? 'Opslaan...' : 'Opslaan' }}
                  </button>
                  <button
                    class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                    @click="cancelEdit(item.id)"
                  >
                    Annuleren
                  </button>
                </div>
              </div>

              <!-- Mail — read mode -->
              <div v-else-if="item.emailSubject || item.emailBody" class="bg-slate-50 rounded-lg p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <p v-if="item.emailSubject" class="text-xs font-semibold text-slate-700">
                    Onderwerp: {{ item.emailSubject }}
                  </p>
                  <button
                    class="text-xs text-indigo-600 hover:underline shrink-0 ml-2"
                    @click="startEdit(item.id, item.emailSubject ?? '', item.emailBody ?? '')"
                  >
                    Bewerken
                  </button>
                </div>
                <p v-if="item.emailBody" class="text-xs text-slate-600 whitespace-pre-line">
                  {{ item.emailBody }}
                </p>
              </div>
            </div>
          </div>
        </template>

        <!-- ── Emails verzonden ────────────────────────────────────────── -->
        <template v-else>
          <div v-if="editorial.items.value.length === 0" class="py-12 text-center text-slate-400 text-sm">
            Nog geen editorial mails verstuurd
          </div>

          <div v-else class="space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-sm text-slate-500">
                {{ editorial.items.value.length }} verzonden editorial mail(s)
              </p>
              <button
                class="text-xs text-indigo-600 hover:underline"
                @click="editorial.fetchItems('sent')"
              >
                Verversen
              </button>
            </div>

            <!-- Tabel -->
            <div class="overflow-x-auto rounded-xl border border-slate-200">
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-slate-50 text-left text-slate-500 font-medium">
                    <th class="px-4 py-3">Publicatie</th>
                    <th class="px-4 py-3">Artikel</th>
                    <th class="px-4 py-3">Naar</th>
                    <th class="px-4 py-3">Onderwerp</th>
                    <th class="px-4 py-3 whitespace-nowrap">Verzonden op</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="item in editorial.items.value"
                    :key="item.id"
                    class="bg-white hover:bg-slate-50 transition-colors"
                  >
                    <td class="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {{ editorial.publicationName(item.publicationId) }}
                    </td>
                    <td class="px-4 py-3 max-w-[240px]">
                      <a
                        :href="item.articleUrl"
                        target="_blank"
                        rel="noopener"
                        class="text-indigo-600 hover:underline truncate block"
                        :title="item.articleTitle"
                      >
                        {{ item.articleTitle }}
                      </a>
                    </td>
                    <td class="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {{ item.contactName ?? item.contactEmail ?? 'redactie' }}
                    </td>
                    <td class="px-4 py-3 text-slate-600 max-w-[200px] truncate" :title="item.emailSubject">
                      {{ item.emailSubject ?? '—' }}
                    </td>
                    <td class="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {{ formatDate(item.sentAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

      </template>
    </template>

    <!-- Tab: E-mail Sequences -->
    <template v-else-if="activeTab === 'sequences'">
      <div v-if="sequences.loading.value" class="text-slate-500 text-sm">Laden...</div>
      <p v-else-if="sequences.error.value" class="text-red-600 text-sm">{{ sequences.error.value }}</p>

      <template v-else>
        <div v-if="sequences.items.value.length === 0" class="py-12 text-center text-slate-400 text-sm">
          Geen e-mail sequenties ingepland
        </div>

        <div v-else class="space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-sm text-slate-500">
              {{ sequences.items.value.length }} sequentie(s) ingepland voor morgenochtend 09:00. Pas de tekst aan vóór de run.
            </p>
            <button
              class="text-xs text-indigo-600 hover:underline"
              @click="sequences.fetchItems()"
            >
              Verversen
            </button>
          </div>

          <p v-if="actionError" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {{ actionError }}
          </p>

          <div
            v-for="item in sequences.items.value"
            :key="item.id"
            class="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
            :class="{ 'opacity-50 pointer-events-none': actioningId === item.id }"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-semibold text-slate-700">{{ item.company ?? item.email }}</span>
                  <span class="text-xs text-slate-400">·</span>
                  <span class="text-xs text-slate-500">{{ item.email }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">CTA {{ item.ctaVariant }}</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Verzending: {{ formatDate(item.sendAt) }}
                </p>
              </div>
            </div>

            <!-- Mail — edit mode -->
            <div v-if="seqEditDrafts[item.id]" class="space-y-2">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Onderwerp</label>
                <input
                  v-model="seqEditDrafts[item.id].subject"
                  type="text"
                  class="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-1">Mailbody</label>
                <textarea
                  v-model="seqEditDrafts[item.id].body"
                  rows="8"
                  class="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y font-mono"
                />
              </div>
              <div class="flex gap-2">
                <button
                  class="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                  :disabled="actioningId === item.id"
                  @click="seqSaveEdit(item.id)"
                >
                  {{ actioningId === item.id ? 'Opslaan...' : 'Opslaan' }}
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  @click="seqCancelEdit(item.id)"
                >
                  Annuleren
                </button>
              </div>
            </div>

            <!-- Mail — read mode -->
            <div v-else class="bg-slate-50 rounded-lg p-3 space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-slate-700">
                  Onderwerp: {{ item.emailSubject }}
                </p>
                <button
                  class="text-xs text-indigo-600 hover:underline shrink-0 ml-2"
                  @click="seqStartEdit(item.id, item.emailSubject, item.emailBody)"
                >
                  Bewerken
                </button>
              </div>
              <p class="text-xs text-slate-600 whitespace-pre-line">{{ item.emailBody }}</p>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
