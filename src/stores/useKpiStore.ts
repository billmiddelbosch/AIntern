import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { OKRObjective, CLevel } from '@/types/kpi'

// Q2 2026 OKR definitions — board approved 2026-04-09
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

// Weekly KPI targets per C-Level
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

export const useKpiStore = defineStore('kpi', () => {
  const okrActuals = useLocalStorage<Record<string, number>>('kpi:okr-actuals', {})
  const weeklyActuals = useLocalStorage<Record<string, number>>('kpi:weekly-actuals', {})

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

  function updateOkrActual(id: string, value: number) {
    okrActuals.value = { ...okrActuals.value, [id]: value }
  }

  function updateWeeklyActual(id: string, value: number) {
    weeklyActuals.value = { ...weeklyActuals.value, [id]: value }
  }

  return { objectives, cLevels, updateOkrActual, updateWeeklyActual }
})
