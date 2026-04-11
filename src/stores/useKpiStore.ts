import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useKpiApi } from '@/composables/useKpiApi'
import type { OKRObjective, CLevel } from '@/types/kpi'

// ── ISO week helper ───────────────────────────────────────────────────────────

function currentIsoWeek(): string {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1)
  const weekNum = Math.floor((now.getTime() - startOfWeek1.getTime()) / (7 * 86400000)) + 1
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// ── Q2 2026 OKR definitions — board approved 2026-04-09 ──────────────────────

const OBJECTIVES: OKRObjective[] = [
  {
    id: 'o1',
    ownerLabel: 'CEO / Sales',
    title: 'Win first paying clients',
    keyResults: [
      { id: 'kr1.1', label: 'Signed contracts via Godfather Offer', targetValue: 2, unit: 'clients', type: 'numeric' },
      { id: 'kr1.2', label: 'Qualified discovery calls booked', targetValue: 6, unit: 'calls', type: 'numeric' },
      { id: 'kr1.3', label: 'Pilot cases documented as case studies', targetValue: 2, unit: 'case studies', type: 'numeric' },
    ],
  },
  {
    id: 'o2',
    ownerLabel: 'CMO',
    title: 'Activate LinkedIn as primary acquisition channel',
    keyResults: [
      { id: 'kr2.1', label: 'Weeks posting 3×/wk (no gaps > 3 days)', targetValue: 13, unit: 'weeks', type: 'numeric' },
      { id: 'kr2.2', label: 'New connections in Lightspeed-beachhead segment', targetValue: 300, unit: 'connections', type: 'numeric' },
      { id: 'kr2.3', label: 'Inbound leads via LinkedIn DM or website', targetValue: 10, unit: 'leads', type: 'numeric' },
    ],
  },
  {
    id: 'o3',
    ownerLabel: 'CPO / CTO',
    title: 'Website funnel converts & is stable',
    keyResults: [
      { id: 'kr3.2', label: 'Intake questionnaire live & A/B tested (due 1 May)', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr3.3', label: 'Kennisbank published articles', targetValue: 10, unit: 'articles', type: 'numeric' },
      { id: 'kr3.4', label: 'Monthly unique visitors AIntern.nl', targetValue: 500, unit: 'visitors/mo', type: 'numeric' },
      { id: 'kr3.5', label: 'Website uptime', targetValue: 99.5, unit: '%', type: 'numeric' },
      { id: 'kr3.6', label: 'Weekly security checks completed (out of 13)', targetValue: 13, unit: 'weeks', type: 'numeric' },
    ],
  },
  {
    id: 'o4',
    ownerLabel: 'COO',
    title: 'Operational foundation scalable',
    keyResults: [
      { id: 'kr4.1', label: 'Lead pipeline CRM (O-02) operational (due 30 Apr)', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr4.2', label: 'Client onboarding checklist ready before first client (due 1 May)', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr4.3', label: 'Weekly auto-report (O-01) active (due 30 Apr)', targetValue: 1, unit: '', type: 'boolean' },
    ],
  },
  {
    id: 'o5',
    ownerLabel: 'CEO / CTO',
    title: 'Board visibility & governance',
    keyResults: [
      { id: 'kr5.1', label: '/admin live, board-only auth-protected (due 22 Apr)', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr5.2', label: 'Organisation overview: active AIntern agents + hierarchy (due 22 Apr)', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr5.3', label: 'OKR status dashboard live at /admin (due 22 Apr)', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr5.4', label: '/admin secured with MFA or SSO (at launch)', targetValue: 1, unit: '', type: 'boolean' },
    ],
  },
]

// ── Weekly KPI targets per C-Level ───────────────────────────────────────────

const C_LEVELS: CLevel[] = [
  {
    role: 'CEO',
    kpis: [
      { id: 'ceo.1', label: 'Outreach to qualified prospects', targetPerWeek: 1, unit: 'outreach' },
      { id: 'ceo.2', label: 'Discovery call held or scheduled', targetPerWeek: 1, unit: 'call (biweekly)' },
      { id: 'ceo.3', label: 'Pipeline review (Monday)', targetPerWeek: 1, unit: 'review' },
      { id: 'ceo.4', label: 'OKR progress reviewed (Friday)', targetPerWeek: 1, unit: 'review' },
    ],
  },
  {
    role: 'CMO',
    kpis: [
      { id: 'cmo.1', label: 'LinkedIn posts published', targetPerWeek: 3, unit: 'posts' },
      { id: 'cmo.2', label: 'New connections sent (Lightspeed segment)', targetPerWeek: 20, unit: 'connections' },
      { id: 'cmo.3', label: 'Inbound leads generated', targetPerWeek: 1, unit: 'leads' },
      { id: 'cmo.4', label: 'Morning briefings completed', targetPerWeek: 5, unit: 'days' },
    ],
  },
  {
    role: 'CPO',
    kpis: [
      { id: 'cpo.1', label: 'Kennisbank article published', targetPerWeek: 1, unit: 'article' },
      { id: 'cpo.2', label: 'Backlog item shipped or in progress', targetPerWeek: 1, unit: 'item' },
      { id: 'cpo.3', label: 'Website traffic report reviewed', targetPerWeek: 1, unit: 'review' },
      { id: 'cpo.4', label: 'Uptime check', targetPerWeek: 1, unit: 'check' },
    ],
  },
  {
    role: 'CTO',
    kpis: [
      { id: 'cto.1', label: 'Security check performed & documented', targetPerWeek: 1, unit: 'check' },
      { id: 'cto.2', label: 'Uptime monitored (≥ 99.5%)', targetPerWeek: 1, unit: 'check' },
      { id: 'cto.3', label: 'Infrastructure issues escalated (same day)', targetPerWeek: 1, unit: 'check' },
    ],
  },
  {
    role: 'COO',
    kpis: [
      { id: 'coo.1', label: 'Weekly report generated & sent (Monday)', targetPerWeek: 1, unit: 'report' },
      { id: 'coo.2', label: 'Lead pipeline updated', targetPerWeek: 2, unit: 'updates' },
      { id: 'coo.3', label: 'Open blockers identified & escalated', targetPerWeek: 1, unit: 'review' },
      { id: 'coo.4', label: 'Onboarding checklist progress monitored', targetPerWeek: 1, unit: 'review' },
    ],
  },
]

// ── Store ─────────────────────────────────────────────────────────────────────

export const useKpiStore = defineStore('kpi', () => {
  const { getActuals, putActual, refreshActuals: apiRefreshActuals } = useKpiApi()

  // localStorage write-through cache — instant UI + offline fallback
  const okrActuals = useLocalStorage<Record<string, number>>('kpi:okr-actuals', {})
  const weeklyActuals = useLocalStorage<Record<string, number>>('kpi:weekly-actuals', {})

  // API-sourced metadata
  const actualsSource = ref<Record<string, 'manual' | 'automated' | 'error'>>({})
  const isLoadingActuals = ref(false)
  const isRefreshing = ref(false)
  const lastRefreshed = ref<string | null>(null)
  const refreshErrors = ref<string[]>([])

  // ── Computed views ──────────────────────────────────────────────────────────

  const objectives = computed(() =>
    OBJECTIVES.map((obj) => ({
      ...obj,
      keyResults: obj.keyResults.map((kr) => ({
        ...kr,
        currentValue: okrActuals.value[kr.id] ?? 0,
      })),
    })),
  )

  const cLevels = computed(() =>
    C_LEVELS.map((cl) => ({
      ...cl,
      kpis: cl.kpis.map((kpi) => ({
        ...kpi,
        currentWeek: weeklyActuals.value[kpi.id] ?? 0,
      })),
    })),
  )

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Load actuals from API for the current ISO week and merge into localStorage cache.
   * Silently falls back to existing localStorage values on API error.
   */
  async function loadActuals(): Promise<void> {
    isLoadingActuals.value = true
    try {
      const response = await getActuals(currentIsoWeek())
      const newOkr: Record<string, number> = { ...okrActuals.value }
      const newWeekly: Record<string, number> = { ...weeklyActuals.value }
      const newSource: Record<string, 'manual' | 'automated' | 'error'> = { ...actualsSource.value }

      for (const [id, entry] of Object.entries(response.actuals)) {
        // kr-prefixed ids → OKR actuals; everything else → weekly actuals
        if (id.startsWith('kr')) {
          newOkr[id] = entry.value
        } else {
          newWeekly[id] = entry.value
        }
        newSource[id] = entry.source
      }

      okrActuals.value = newOkr
      weeklyActuals.value = newWeekly
      actualsSource.value = newSource
    } catch {
      // Silently continue — localStorage values remain as fallback
    } finally {
      isLoadingActuals.value = false
    }
  }

  /**
   * Trigger POST /admin/kpi/refresh then reload actuals.
   * Records the refresh timestamp and any server-side errors.
   */
  async function refreshActuals(): Promise<void> {
    isRefreshing.value = true
    refreshErrors.value = []
    try {
      const result = await apiRefreshActuals()
      refreshErrors.value = result.errors
      await loadActuals()
      lastRefreshed.value = new Date().toLocaleTimeString()
    } catch (err) {
      refreshErrors.value = [err instanceof Error ? err.message : 'Unknown error']
    } finally {
      isRefreshing.value = false
    }
  }

  /**
   * Optimistically update an OKR actual locally, then persist to API.
   * Reverts on API failure.
   */
  async function updateOkrActual(id: string, value: number): Promise<void> {
    const previous = okrActuals.value[id]
    okrActuals.value = { ...okrActuals.value, [id]: value }
    try {
      await putActual(currentIsoWeek(), id, value)
    } catch {
      // Revert to previous value
      const reverted = { ...okrActuals.value }
      if (previous === undefined) {
        delete reverted[id]
      } else {
        reverted[id] = previous
      }
      okrActuals.value = reverted
    }
  }

  /**
   * Optimistically update a weekly KPI actual locally, then persist to API.
   * Reverts on API failure.
   */
  async function updateWeeklyActual(id: string, value: number): Promise<void> {
    const previous = weeklyActuals.value[id]
    weeklyActuals.value = { ...weeklyActuals.value, [id]: value }
    try {
      await putActual(currentIsoWeek(), id, value)
    } catch {
      // Revert to previous value
      const reverted = { ...weeklyActuals.value }
      if (previous === undefined) {
        delete reverted[id]
      } else {
        reverted[id] = previous
      }
      weeklyActuals.value = reverted
    }
  }

  return {
    objectives,
    cLevels,
    actualsSource,
    isLoadingActuals,
    isRefreshing,
    lastRefreshed,
    refreshErrors,
    loadActuals,
    refreshActuals,
    updateOkrActual,
    updateWeeklyActual,
  }
})
