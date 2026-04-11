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
    title: 'Website funnel converts & is stable',
    keyResults: [
      { id: 'kr3.2', label: 'Intake questionnaire live & A/B tested (due 1 May)', description: 'The 5-step intake form is deployed on aintern.nl and at least one A/B variant is running. Mark done when both conditions are live.', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr3.3', label: 'Kennisbank published articles', description: 'Total articles published in the S3 Kennisbank bucket (aintern-kennisbank). Auto-synced via Refresh. Does not count drafts.', targetValue: 10, unit: 'articles', type: 'numeric' },
      { id: 'kr3.4', label: 'Monthly unique visitors AIntern.nl', description: 'Google Analytics 4 activeUsers metric over the last 30 days. Auto-synced via Refresh. Must have GA4 tracking active.', targetValue: 500, unit: 'visitors/mo', type: 'numeric' },
      { id: 'kr3.5', label: 'Website uptime', description: 'Percentage of time aintern.nl responded with HTTP 2xx over the quarter. Measured weekly by CTO; manual entry.', targetValue: 99.5, unit: '%', type: 'numeric' },
      { id: 'kr3.6', label: 'Weekly security checks completed (out of 13)', description: 'Number of weeks where a security check was documented per the CTO checklist. Target is all 13 weeks of Q2.', targetValue: 13, unit: 'weeks', type: 'numeric' },
    ],
  },
  {
    id: 'o4',
    ownerLabel: 'COO',
    title: 'Operational foundation scalable',
    keyResults: [
      { id: 'kr4.1', label: 'Lead pipeline CRM (O-02) operational (due 30 Apr)', description: 'CRM system (Notion or equivalent) is live with all prospects tracked: status, last contact, next step. Mark done when actively used.', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr4.2', label: 'Client onboarding checklist ready before first client (due 1 May)', description: 'A documented step-by-step onboarding checklist exists and has been dry-run internally. Must be ready before signing the first client.', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr4.3', label: 'Weekly auto-report (O-01) active (due 30 Apr)', description: 'The Monday automated board report (O-01) runs without manual trigger and is delivered to the board. Mark done when first automated send is confirmed.', targetValue: 1, unit: '', type: 'boolean' },
    ],
  },
  {
    id: 'o5',
    ownerLabel: 'CEO / CTO',
    title: 'Board visibility & governance',
    keyResults: [
      { id: 'kr5.1', label: '/admin live, board-only auth-protected (due 22 Apr)', description: 'The /admin panel is deployed and requires login to access. Unauthenticated requests are redirected to /admin/login.', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr5.2', label: 'Organisation overview: active AIntern agents + hierarchy (due 22 Apr)', description: 'A page in /admin lists all active AIntern agents (CEO, CMO, CPO, CTO, COO) with their roles and reporting structure.', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr5.3', label: 'OKR status dashboard live at /admin (due 22 Apr)', description: 'This KPI Dashboard page is deployed, loads real actuals from DynamoDB, and is accessible to the board. You are here.', targetValue: 1, unit: '', type: 'boolean' },
      { id: 'kr5.4', label: '/admin secured with MFA or SSO (at launch)', description: 'At least one second authentication factor (TOTP MFA or Google/Microsoft SSO) is required to access /admin. Due before first client is onboarded.', targetValue: 1, unit: '', type: 'boolean' },
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
      { id: 'cmo.1', label: 'LinkedIn posts published', description: 'Original posts published on the AIntern LinkedIn page this week. Reposts/shares do not count. Target: 3 per week (Mon/Wed/Fri).', targetPerWeek: 3, unit: 'posts' },
      { id: 'cmo.2', label: 'New connections sent (Lightspeed segment)', description: 'LinkedIn connection requests sent to Lightspeed-segment prospects this week. Auto-synced from outreach-log.csv via Refresh.', targetPerWeek: 20, unit: 'connections' },
      { id: 'cmo.3', label: 'Inbound leads generated', description: 'Prospects who replied to a DM, commented on a post seeking help, or submitted the intake form this week. One per person per week.', targetPerWeek: 1, unit: 'leads' },
      { id: 'cmo.4', label: 'Morning briefings completed', description: 'AIntern daily morning briefing agent ran and was reviewed by CMO. Target is every working day (Mon–Fri).', targetPerWeek: 5, unit: 'days' },
    ],
  },
  {
    role: 'CPO',
    kpis: [
      { id: 'cpo.1', label: 'Kennisbank article published', description: 'One new article published to the S3 Kennisbank this week. Auto-synced via Refresh. Does not count edits to existing articles.', targetPerWeek: 1, unit: 'article' },
      { id: 'cpo.2', label: 'Backlog item shipped or in progress', description: 'At least one backlog item moved to "done" or actively in development this week. Tracked in the product backlog.', targetPerWeek: 1, unit: 'item' },
      { id: 'cpo.3', label: 'Website traffic report reviewed', description: 'GA4 traffic report reviewed and findings shared with the board. Binary: 0 = not done, 1 = reviewed. Auto-synced via Refresh.', targetPerWeek: 1, unit: 'review' },
      { id: 'cpo.4', label: 'Uptime check', description: 'Manual or automated uptime check performed and result logged. Includes response-time test and broken-link scan.', targetPerWeek: 1, unit: 'check' },
    ],
  },
  {
    role: 'CTO',
    kpis: [
      { id: 'cto.1', label: 'Security check performed & documented', description: 'Weekly security checklist completed and written up: dependency audit, access review, env vars. Documented in Notion or equivalent.', targetPerWeek: 1, unit: 'check' },
      { id: 'cto.2', label: 'Uptime monitored (≥ 99.5%)', description: 'Uptime check confirmed: aintern.nl returned HTTP 2xx on all probes this week. Enter 1 if target met, 0 if outage occurred.', targetPerWeek: 1, unit: 'check' },
      { id: 'cto.3', label: 'Infrastructure issues escalated (same day)', description: 'Any infra incident (Lambda error spike, deploy failure, DB timeout) was escalated to CEO same day. Enter incidents escalated; enter 1 if none occurred and monitoring was active.', targetPerWeek: 1, unit: 'check' },
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
