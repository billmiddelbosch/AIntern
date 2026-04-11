<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKpiStore } from '@/stores/useKpiStore'

const { t } = useI18n()
const store = useKpiStore()

type Tab = 'quarterly' | 'weekly'
const activeTab = ref<Tab>('quarterly')

// Load actuals from API on mount
onMounted(() => store.loadActuals())

// Source indicator map
const actualsSource = computed(() => store.actualsSource)

// ── helpers ──────────────────────────────────────────────────────────────────

function pct(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

function statusColor(current: number, target: number, type: 'numeric' | 'boolean') {
  if (type === 'boolean') return current >= 1 ? 'green' : 'red'
  const p = pct(current, target)
  if (p >= 80) return 'green'
  if (p >= 50) return 'yellow'
  return 'red'
}

const barClass: Record<string, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-red-400',
}

const badgeClass: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-600 ring-red-200',
}

// ── OKR edit ─────────────────────────────────────────────────────────────────

function onOkrInput(id: string, event: Event) {
  const v = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(v) && v >= 0) store.updateOkrActual(id, v)
}

function onWeeklyInput(id: string, event: Event) {
  const v = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(v) && v >= 0) store.updateWeeklyActual(id, v)
}

// ── owner badge colours ───────────────────────────────────────────────────────

const ownerBadge: Record<string, string> = {
  'CEO / Sales': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  CMO: 'bg-pink-50 text-pink-700 ring-pink-200',
  'CPO / CTO': 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  COO: 'bg-violet-50 text-violet-700 ring-violet-200',
  'CEO / CTO': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  CEO: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  CPO: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  CTO: 'bg-teal-50 text-teal-700 ring-teal-200',
}

function ownerColor(owner: string): string {
  return ownerBadge[owner] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
}

// ── quarterly summary stat ───────────────────────────────────────────────────

const overallOkrPct = computed(() => {
  const all = store.objectives.flatMap((o) => o.keyResults)
  if (all.length === 0) return 0
  const total = all.reduce((sum, kr) => sum + pct(kr.currentValue, kr.targetValue), 0)
  return Math.round(total / all.length)
})
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Page header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('admin.kpi.heading') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t('admin.kpi.subheading') }}</p>
      </div>
      <!-- Overall progress pill + Refresh button -->
      <div class="shrink-0 flex flex-col items-end gap-2">
        <span class="text-xs font-medium text-slate-400 uppercase tracking-wide">Q2 overall</span>
        <div class="flex items-center gap-2">
          <div class="w-32 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="overallOkrPct >= 80 ? 'bg-emerald-500' : overallOkrPct >= 50 ? 'bg-amber-400' : 'bg-red-400'"
              :style="{ width: overallOkrPct + '%' }"
            />
          </div>
          <span class="text-sm font-semibold text-slate-700">{{ overallOkrPct }}%</span>
        </div>
        <!-- Refresh button -->
        <button
          class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
          :disabled="store.isRefreshing"
          @click="store.refreshActuals()"
        >
          <span v-if="store.isRefreshing">{{ t('admin.kpi.refreshing') }}</span>
          <span v-else>{{ t('admin.kpi.refreshButton') }}</span>
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
      <button
        v-for="tab in (['quarterly', 'weekly'] as const)"
        :key="tab"
        class="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors"
        :class="
          activeTab === tab
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        "
        @click="activeTab = tab"
      >
        {{ tab === 'quarterly' ? t('admin.kpi.quarterlyTab') : t('admin.kpi.weeklyTab') }}
      </button>
    </div>

    <!-- Last refreshed timestamp -->
    <div v-if="store.lastRefreshed" class="text-xs text-slate-400">
      {{ t('admin.kpi.lastRefreshed', { time: store.lastRefreshed }) }}
    </div>

    <!-- Refresh errors -->
    <div v-if="store.refreshErrors.length" class="text-xs text-red-500 space-y-0.5">
      <p v-for="err in store.refreshErrors" :key="err">⚠ {{ err }}</p>
    </div>

    <!-- ── Quarterly OKRs ─────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'quarterly'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="obj in store.objectives"
        :key="obj.id"
        class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <!-- Objective header -->
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-sm font-semibold text-slate-800 leading-snug">{{ obj.title }}</h3>
          <span
            class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ring-1"
            :class="ownerColor(obj.ownerLabel)"
          >{{ obj.ownerLabel }}</span>
        </div>

        <!-- Key Results -->
        <div class="space-y-3">
          <div v-for="kr in obj.keyResults" :key="kr.id" class="space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-slate-600 leading-tight flex-1">{{ kr.label }}</span>
              <!-- Source badge -->
              <span
                v-if="actualsSource[kr.id]"
                class="shrink-0 text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-400"
              >{{ actualsSource[kr.id] === 'automated' ? t('admin.kpi.sourceAuto') : t('admin.kpi.sourceManual') }}</span>
              <!-- Boolean toggle -->
              <template v-if="kr.type === 'boolean'">
                <button
                  class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ring-1 transition-colors"
                  :class="badgeClass[statusColor(kr.currentValue, kr.targetValue, kr.type)]"
                  @click="store.updateOkrActual(kr.id, kr.currentValue >= 1 ? 0 : 1)"
                >
                  {{ kr.currentValue >= 1 ? 'Done' : 'Open' }}
                </button>
              </template>
              <!-- Numeric input -->
              <template v-else>
                <div class="shrink-0 flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    :max="kr.targetValue * 2"
                    :value="kr.currentValue"
                    class="w-16 text-right text-xs border border-slate-200 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    @change="onOkrInput(kr.id, $event)"
                  />
                  <span class="text-xs text-slate-400">/ {{ kr.targetValue }}</span>
                  <span v-if="kr.unit" class="text-xs text-slate-400">{{ kr.unit }}</span>
                </div>
              </template>
            </div>
            <!-- Progress bar (numeric only) -->
            <div v-if="kr.type === 'numeric'" class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="barClass[statusColor(kr.currentValue, kr.targetValue, kr.type)]"
                :style="{ width: pct(kr.currentValue, kr.targetValue) + '%' }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Weekly KPIs ────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'weekly'" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="cl in store.cLevels"
        :key="cl.role"
        class="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
      >
        <!-- Role header -->
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-semibold px-2.5 py-1 rounded-full ring-1"
            :class="ownerColor(cl.role)"
          >{{ cl.role }}</span>
          <span class="text-xs text-slate-400">this week</span>
        </div>

        <!-- KPIs -->
        <div class="space-y-3">
          <div v-for="kpi in cl.kpis" :key="kpi.id" class="space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-slate-600 leading-tight flex-1">{{ kpi.label }}</span>
              <div class="shrink-0 flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  :max="kpi.targetPerWeek * 3"
                  :value="kpi.currentWeek"
                  class="w-12 text-right text-xs border border-slate-200 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  @change="onWeeklyInput(kpi.id, $event)"
                />
                <span class="text-xs text-slate-400">/ {{ kpi.targetPerWeek }}</span>
              </div>
            </div>
            <div class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="barClass[statusColor(kpi.currentWeek, kpi.targetPerWeek, 'numeric')]"
                :style="{ width: pct(kpi.currentWeek, kpi.targetPerWeek) + '%' }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
