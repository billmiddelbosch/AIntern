import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useKpiApi } from '@/composables/useKpiApi'
import type { OKRObjective, CLevel } from '@/types/kpi'
import adminAxios from '@/lib/adminAxios'

// Q2 2026 OKR definitions — board approved 2026-04-09, revised 2026-04-12
const OBJECTIVES: OKRObjective[] = [
  {
    id: 'o1',
    ownerLabel: 'CEO / Sales',
    title: 'Win first paying clients',
    keyResults: [
      { id: 'kr1.1', label: 'Signed contracts via Godfather Offer', description: 'Clients who signed a paid contract through our Godfather Offer. Each signed deal counts as 1.', targetValue: 2, unit: 'clients', type: 'numeric' },
      { id: 'kr1.2', label: 'Qualified discovery calls booked', description: 'Calls with prospects who match our ICP (Lightspeed segment, 6–50 employees). Informal chats do not count.', targetValue: 6, unit: 'calls', type: 'numeric' },
      { id: 'kr1.3', label: 'Pilot cases documented as case studies', description: 'Written case studies published on the website or shared with prospects. Must include measurable results.', targetValue: 2, unit: 'case studies', type: 'numeric' },
    ],
  },
  {
    id: 'o2',
    ownerLabel: 'CMO',
    title: 'Activate LinkedIn as primary acquisition channel',
    keyResults: [
      { id: 'kr2.1', label: 'Weeks posting 3×/wk (no gaps > 3 days)', description: 'Consecutive weeks with ≥3 LinkedIn posts and no gap exceeding 3 days between posts. Tracked from Q2 start.', targetValue: 13, unit: 'weeks', type: 'numeric' },
      { id: 'kr2.2', label: 'New connections in Lightspeed-beachhead segment', description: 'Accepted LinkedIn connection requests from retail/wholesale decision-makers (owners, directors) since 1 Apr 2026. Auto-synced from outreach-log.csv.', targetValue: 300, unit: 'connections', type: 'numeric' },
      { id: 'kr2.3', label: 'Inbound leads via LinkedIn DM or website', description: 'Prospects who initiated contact via LinkedIn DM reply or submitted the website intake form. Counts only first contact.', targetValue: 10, unit: 'leads', type: 'numeric' },
    ],
  },
  {
    id: 'o3',
    ownerLabel: 'CPO / CTO',
    title: 'Website is organically found & converts',
    keyResults: [
      { id: 'kr3.1', label: 'Monthly unique visitors AIntern.nl', targetValue: 500, unit: 'visitors/mo', type: 'numeric' },
      { id: 'kr3.2', label: 'Google top-10 ranking for target keywords', targetValue: 5, unit: 'keywords', type: 'numeric' },
      { id: 'kr3.3', label: 'AIntern.nl cited/found by LLM tools (Perplexity, ChatGPT, Claude)', targetValue: 2, unit: 'tools', type: 'numeric' },
      { id: 'kr3.4', label: 'Kennisbank published articles', targetValue: 20, unit: 'articles', type: 'numeric' },
    ],
  },
  {
    id: 'o4',
    ownerLabel: 'COO',
    title: 'Operational foundation scalable',
    keyResults: [
      { id: 'kr4.1', label: 'Lead pipeline CRM active and maintained weekly', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr4.2', label: 'Client onboarding checklist ready before first client', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr4.3', label: 'Weekly auto-report active and sent', targetValue: 1, unit: '', type: 'boolean' },
    ],
  },
  {
    id: 'o5',
    ownerLabel: 'CEO / CTO',
    title: 'Board visibility & governance',
    keyResults: [
      { id: 'kr5.1', label: 'Board has real-time insight into OKR progress', targetValue: 1, unit: '', type: 'boolean' },
    ],
  },
]

// ── Weekly KPI targets per C-Level ───────────────────────────────────────────

const C_LEVELS: CLevel[] = [
  {
    role: 'CEO',
    kpis: [
      { id: 'ceo.1', label: 'Outreach to qualified prospects', description: 'Personalised outreach message sent to a new qualified prospect this week (LinkedIn DM or email). Must be ICP-fit.', targetPerWeek: 1, unit: 'outreach' },
      { id: 'ceo.2', label: 'Discovery call held or scheduled', description: 'A 30-min discovery call completed or confirmed in calendar this week. Biweekly cadence: counts every other week.', targetPerWeek: 1, unit: 'call (biweekly)' },
      { id: 'ceo.3', label: 'Pipeline review (Monday)', description: 'Monday pipeline review completed: all leads reviewed, next steps updated in CRM. Logged in the weekly board report.', targetPerWeek: 1, unit: 'review' },
      { id: 'ceo.4', label: 'OKR progress reviewed (Friday)', description: 'Friday OKR check-in completed: actuals updated, blockers flagged, next-week priorities set.', targetPerWeek: 1, unit: 'review' },
    ],
  },
  {
    role: 'CMO',
    kpis: [
      { id: 'cmo.1', label: 'LinkedIn posts published', targetPerWeek: 3, unit: 'posts' },
      { id: 'cmo.2', label: 'New connections sent (Lightspeed segment)', targetPerWeek: 20, unit: 'connections' },
      { id: 'cmo.3', label: 'Inbound leads generated', targetPerWeek: 1, unit: 'leads' },
      { id: 'cmo.4', label: 'LinkedIn → website referral traffic monitored', targetPerWeek: 1, unit: 'check' },
    ],
  },
  {
    role: 'CPO',
    kpis: [
      { id: 'cpo.1', label: 'Kennisbank articles published', targetPerWeek: 2, unit: 'articles' },
      { id: 'cpo.2', label: 'Backlog item shipped or in progress', targetPerWeek: 1, unit: 'item' },
      { id: 'cpo.3', label: 'SEO ranking check (keyword positions)', targetPerWeek: 1, unit: 'check' },
      { id: 'cpo.4', label: 'Website traffic report reviewed', targetPerWeek: 1, unit: 'review' },
    ],
  },
  {
    role: 'CTO',
    kpis: [
      { id: 'cto.1', label: 'Security check performed & documented', targetPerWeek: 1, unit: 'check' },
      { id: 'cto.2', label: 'LLM citation check (Perplexity / ChatGPT / Claude)', targetPerWeek: 1, unit: 'check (biweekly)' },
      { id: 'cto.3', label: 'Infrastructure issues escalated (same day)', targetPerWeek: 1, unit: 'check' },
    ],
  },
  {
    role: 'COO',
    kpis: [
      { id: 'coo.1', label: 'Weekly report generated & sent (Monday)', description: 'The automated Monday board report (O-01) ran successfully and was delivered to the board by 09:00. Enter 1 if sent, 0 if missed or manual.', targetPerWeek: 1, unit: 'report' },
      { id: 'coo.2', label: 'Lead pipeline updated', description: 'CRM pipeline updated at least twice this week: all leads have current status, last-contact date, and next action. Target: 2 updates.', targetPerWeek: 2, unit: 'updates' },
      { id: 'coo.3', label: 'Open blockers identified & escalated', description: 'Weekly blocker review conducted: open issues listed, owners assigned, escalated to CEO if unresolved >2 days. Enter 1 if review done.', targetPerWeek: 1, unit: 'review' },
      { id: 'coo.4', label: 'Onboarding checklist progress monitored', description: 'Client onboarding checklist reviewed for completeness and readiness. Enter 1 once the checklist is done and verified; 0 if still in progress.', targetPerWeek: 1, unit: 'review' },
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
  }

  /**
   * Fetch actuals from DynamoDB via GET /admin/kpi/actuals and hydrate both maps.
   * OKR key results (kr*) go into okrActuals; weekly KPI ids go into weeklyActuals.
   */
  async function loadActuals(week?: string): Promise<void> {
    const params = week ? { week } : {}
    const { data } = await adminAxios.get<{
      week: string
      actuals: Record<string, { value: number; source: string }>
    }>('/admin/kpi/actuals', { params })

    const newOkr: Record<string, number> = { ...okrActuals.value }
    const newWeekly: Record<string, number> = { ...weeklyActuals.value }

    for (const [id, item] of Object.entries(data.actuals)) {
      if (id.startsWith('kr')) {
        newOkr[id] = item.value
      } else {
        newWeekly[id] = item.value
      }
    }

    okrActuals.value = newOkr
    weeklyActuals.value = newWeekly
  }

  return { objectives, cLevels, updateOkrActual, updateWeeklyActual, loadActuals }
})
