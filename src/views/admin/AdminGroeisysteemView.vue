<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import adminAxios from '@/lib/adminAxios'
import { useSubredditConfig } from '@/composables/useSubredditConfig'
import type { PainSignal } from '@/types/painSignal'

const { t } = useI18n()

type Tab = 'flywheel' | 'subreddits' | 'pains' | 'cadans'
const activeTab = ref<Tab>('flywheel')

// ── Flywheel metrics ──────────────────────────────────────────────────────────

interface FlywheelMetrics {
  week: string
  topFunnel: { pains: number; opportunities: number; posts: number }
  midFunnel: { scanSubmissions: number }
  bottomFunnel: { outreachAlerts: number }
}

const metrics = ref<FlywheelMetrics | null>(null)
const metricsLoading = ref(false)
const selectedWeek = ref(currentIsoWeek())

function currentIsoWeek(): string {
  const now = new Date()
  const year = now.getFullYear()
  const jan1 = new Date(year, 0, 1)
  const week = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

async function loadMetrics() {
  metricsLoading.value = true
  try {
    const { data } = await adminAxios.get<FlywheelMetrics>('/admin/flywheel-metrics', {
      params: { week: selectedWeek.value },
    })
    metrics.value = data
  } catch (e) {
    console.error('[groei-systeem] loadMetrics', e)
  } finally {
    metricsLoading.value = false
  }
}

// ── Subreddits ────────────────────────────────────────────────────────────────

const { subreddits, loading: subLoading, error: subError, fetchSubreddits, addSubreddit, toggleActive, removeSubreddit } = useSubredditConfig()
const newSubredditName = ref('')
const addError = ref<string | null>(null)

async function handleAdd() {
  addError.value = null
  const name = newSubredditName.value.trim().toLowerCase().replace(/^r\//, '')
  if (!name) return
  try {
    await addSubreddit(name)
    newSubredditName.value = ''
  } catch {
    addError.value = 'Toevoegen mislukt'
  }
}

async function handleToggle(name: string, active: boolean) {
  await toggleActive(name, !active)
}

async function handleDelete(name: string) {
  if (!confirm(`Subreddit r/${name} verwijderen?`)) return
  await removeSubreddit(name)
}

// ── Pains ─────────────────────────────────────────────────────────────────────

const pains = ref<PainSignal[]>([])
const painsLoading = ref(false)

async function loadPains() {
  painsLoading.value = true
  try {
    const { data } = await adminAxios.get<PainSignal[]>('/admin/pain-signals?limit=20')
    pains.value = data
  } catch (e) {
    console.error('[groei-systeem] loadPains', e)
  } finally {
    painsLoading.value = false
  }
}

// ── Cadans checklist ──────────────────────────────────────────────────────────

const cadans = [
  { dag: 'Maandag', actie: 'Insight Extractie Lambda controleren + week review', owner: 'CMO' },
  { dag: 'Dinsdag', actie: 'Post 1 van 3 publiceren', owner: 'CMO + Bill' },
  { dag: 'Woensdag', actie: 'Post 2 van 3 publiceren + cold email batch', owner: 'CMO' },
  { dag: 'Donderdag', actie: 'Post 3 van 3 publiceren', owner: 'CMO + Bill' },
  { dag: 'Dagelijks', actie: '30 min Reddit reageren (Soft Outreach)', owner: 'Bill' },
  { dag: 'Vrijdag', actie: 'Metrics reviewen, flywheel-score bijwerken', owner: 'CMO' },
]
const cadansDone = ref<Record<string, boolean>>({})

// ── Anti-patterns ─────────────────────────────────────────────────────────────

function antiPatterns(m: FlywheelMetrics | null): Array<{ label: string; severity: 'red' | 'orange' }> {
  if (!m) return []
  const alerts: Array<{ label: string; severity: 'red' | 'orange' }> = []
  if (m.topFunnel.pains === 0) alerts.push({ label: 'Geen nieuwe pains deze week', severity: 'red' })
  if (m.topFunnel.posts === 0) alerts.push({ label: 'Geen posts gepubliceerd deze week', severity: 'orange' })
  if (m.midFunnel.scanSubmissions === 0) alerts.push({ label: 'Geen Workflow Scan submissions', severity: 'orange' })
  return alerts
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

async function switchTab(tab: Tab) {
  activeTab.value = tab
  if (tab === 'flywheel' && !metrics.value) await loadMetrics()
  if (tab === 'subreddits' && subreddits.value.length === 0) await fetchSubreddits()
  if (tab === 'pains' && pains.value.length === 0) await loadPains()
}

onMounted(() => loadMetrics())
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-semibold text-slate-800">Groei Systeem</h2>
      <p class="mt-1 text-sm text-slate-500">AI MKB Flywheel — Pain Signals → Insights → Content → Inbound</p>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-200 gap-1">
      <button
        v-for="tab in (['flywheel', 'subreddits', 'pains', 'cadans'] as const)"
        :key="tab"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize"
        :class="activeTab === tab
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="switchTab(tab)"
      >
        {{ { flywheel: 'Flywheel', subreddits: 'Subreddits', pains: 'Pains', cadans: 'Cadans' }[tab] }}
      </button>
    </div>

    <!-- Tab: Flywheel -->
    <div v-if="activeTab === 'flywheel'" class="space-y-6">
      <div class="flex items-center gap-3">
        <label class="text-sm text-slate-600 font-medium">Week</label>
        <input
          v-model="selectedWeek"
          type="text"
          placeholder="2026-W18"
          class="px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-32"
          @change="loadMetrics"
        />
        <button
          class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors"
          @click="loadMetrics"
        >
          Laden
        </button>
      </div>

      <div v-if="metricsLoading" class="text-slate-500 text-sm">Laden...</div>

      <div v-else-if="metrics" class="grid grid-cols-3 gap-4">
        <!-- Top funnel -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top Funnel</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-600">Pain signals</span>
              <span class="font-bold text-lg" :class="metrics.topFunnel.pains >= 15 ? 'text-green-600' : 'text-orange-500'">
                {{ metrics.topFunnel.pains }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-600">Opportunities</span>
              <span class="font-bold text-lg" :class="metrics.topFunnel.opportunities >= 3 ? 'text-green-600' : 'text-orange-500'">
                {{ metrics.topFunnel.opportunities }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-600">Posts</span>
              <span class="font-bold text-lg" :class="metrics.topFunnel.posts >= 3 ? 'text-green-600' : 'text-orange-500'">
                {{ metrics.topFunnel.posts }}
              </span>
            </div>
          </div>
          <p class="text-xs text-slate-400">Target: 15 pains / 3 opp / 3 posts per week</p>
        </div>

        <!-- Mid funnel -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mid Funnel</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-600">Scan submissions</span>
              <span class="font-bold text-lg" :class="metrics.midFunnel.scanSubmissions >= 5 ? 'text-green-600' : 'text-orange-500'">
                {{ metrics.midFunnel.scanSubmissions }}
              </span>
            </div>
          </div>
          <p class="text-xs text-slate-400">Target: ≥5 submissions per week</p>
        </div>

        <!-- Bottom funnel -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bottom Funnel</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-slate-600">Outreach alerts</span>
              <span class="font-bold text-lg" :class="metrics.bottomFunnel.outreachAlerts >= 3 ? 'text-green-600' : 'text-orange-500'">
                {{ metrics.bottomFunnel.outreachAlerts }}
              </span>
            </div>
          </div>
          <p class="text-xs text-slate-400">Target: ≥3 alerts per week</p>
        </div>
      </div>

      <!-- Anti-patterns -->
      <div v-if="metrics && antiPatterns(metrics).length > 0" class="space-y-2">
        <h3 class="text-sm font-semibold text-slate-700">Anti-pattern alerts</h3>
        <div
          v-for="ap in antiPatterns(metrics)"
          :key="ap.label"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
          :class="ap.severity === 'red' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-orange-50 text-orange-700 border border-orange-200'"
        >
          <span class="w-2 h-2 rounded-full shrink-0" :class="ap.severity === 'red' ? 'bg-red-500' : 'bg-orange-400'" />
          {{ ap.label }}
        </div>
      </div>
    </div>

    <!-- Tab: Subreddits -->
    <div v-else-if="activeTab === 'subreddits'" class="space-y-4">
      <!-- Add form -->
      <div class="flex gap-2">
        <input
          v-model="newSubredditName"
          type="text"
          placeholder="smallbusiness (zonder r/)"
          class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
          @keyup.enter="handleAdd"
        />
        <button
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          @click="handleAdd"
        >
          + Toevoegen
        </button>
      </div>
      <p v-if="addError" class="text-xs text-red-600">{{ addError }}</p>

      <div v-if="subLoading" class="text-slate-500 text-sm">Laden...</div>
      <p v-else-if="subError" class="text-red-600 text-sm">{{ subError }}</p>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-slate-500 border-b border-slate-100">
            <th class="pb-2 font-medium">Naam</th>
            <th class="pb-2 font-medium">Status</th>
            <th class="pb-2 font-medium">Signalen</th>
            <th class="pb-2 font-medium">Toegevoegd</th>
            <th class="pb-2 font-medium">Acties</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="sub in subreddits"
            :key="sub.name"
            class="border-b border-slate-50 hover:bg-slate-50"
          >
            <td class="py-2.5 font-medium text-slate-800">r/{{ sub.name }}</td>
            <td class="py-2.5">
              <span
                class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                :class="sub.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="sub.active ? 'bg-green-500' : 'bg-slate-400'" />
                {{ sub.active ? 'actief' : 'uit' }}
              </span>
            </td>
            <td class="py-2.5 text-slate-600">{{ sub.signalCount }}</td>
            <td class="py-2.5 text-slate-400">{{ sub.addedAt?.slice(0, 10) }}</td>
            <td class="py-2.5">
              <div class="flex gap-2">
                <button
                  class="text-xs px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  @click="handleToggle(sub.name, sub.active)"
                >
                  {{ sub.active ? 'Uit' : 'Aan' }}
                </button>
                <button
                  class="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  @click="handleDelete(sub.name)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="subreddits.length === 0">
            <td colspan="5" class="py-6 text-center text-slate-400 text-sm">Geen subreddits geconfigureerd</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tab: Pains -->
    <div v-else-if="activeTab === 'pains'" class="space-y-4">
      <div v-if="painsLoading" class="text-slate-500 text-sm">Laden...</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="text-left text-xs text-slate-500 border-b border-slate-100">
            <th class="pb-2 font-medium">Bron</th>
            <th class="pb-2 font-medium">Titel</th>
            <th class="pb-2 font-medium">Urgentie</th>
            <th class="pb-2 font-medium">Categorie</th>
            <th class="pb-2 font-medium">Datum</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="pain in pains"
            :key="pain.id"
            class="border-b border-slate-50 hover:bg-slate-50"
          >
            <td class="py-2.5 text-slate-500 text-xs">
              <span v-if="pain.source === 'reddit'">r/{{ pain.subreddit }}</span>
              <span v-else class="text-orange-500">HN</span>
            </td>
            <td class="py-2.5">
              <a :href="pain.sourceUrl" target="_blank" rel="noopener" class="text-indigo-600 hover:underline line-clamp-1">
                {{ pain.title }}
              </a>
            </td>
            <td class="py-2.5">
              <span
                class="inline-flex text-xs px-2 py-0.5 rounded-full font-medium"
                :class="{
                  'bg-red-100 text-red-700': pain.urgency === 'high',
                  'bg-orange-100 text-orange-700': pain.urgency === 'medium',
                  'bg-slate-100 text-slate-600': pain.urgency === 'low',
                }"
              >
                {{ pain.urgency }}
              </span>
            </td>
            <td class="py-2.5 text-xs text-slate-500">{{ pain.painCategory }}</td>
            <td class="py-2.5 text-xs text-slate-400">{{ pain.createdAt?.slice(0, 10) }}</td>
          </tr>
          <tr v-if="pains.length === 0">
            <td colspan="5" class="py-6 text-center text-slate-400 text-sm">Nog geen pain signals</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tab: Cadans -->
    <div v-else-if="activeTab === 'cadans'" class="space-y-4">
      <p class="text-sm text-slate-500">Wekelijkse runbook — markeer items als gedaan</p>
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
              <th class="px-4 py-3 font-medium">Dag</th>
              <th class="px-4 py-3 font-medium">Actie</th>
              <th class="px-4 py-3 font-medium">Owner</th>
              <th class="px-4 py-3 font-medium">Gedaan</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in cadans"
              :key="item.dag + item.actie"
              class="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              :class="cadansDone[item.dag + item.actie] ? 'opacity-50' : ''"
            >
              <td class="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{{ item.dag }}</td>
              <td class="px-4 py-3 text-slate-600">{{ item.actie }}</td>
              <td class="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{{ item.owner }}</td>
              <td class="px-4 py-3">
                <input
                  type="checkbox"
                  :checked="cadansDone[item.dag + item.actie]"
                  class="rounded border-slate-300 text-indigo-600 accent-indigo-600"
                  @change="cadansDone[item.dag + item.actie] = !cadansDone[item.dag + item.actie]"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
