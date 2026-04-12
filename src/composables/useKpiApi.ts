import apiClient from '@/lib/axios'

// Response shapes
export interface ActualEntry {
  value: number
  source: 'manual' | 'automated' | 'error'
}

export interface ActualsResponse {
  week: string
  actuals: Record<string, ActualEntry>
}

export interface RefreshResult {
  week: string
  updated: string[]
  errors: string[]
}

export function useKpiApi() {
  /**
   * GET /admin/kpi/actuals?week=2026-W15
   * Returns all stored actuals for the given ISO week.
   */
  async function getActuals(week: string): Promise<ActualsResponse> {
    const response = await apiClient.get<ActualsResponse>('/admin/kpi/actuals', {
      params: { week },
    })
    return response.data
  }

  /**
   * PUT /admin/kpi/actuals
   * Upserts a single manual actual. Never overwrites automated rows on the server.
   */
  async function putActual(week: string, metricId: string, value: number): Promise<void> {
    await apiClient.put('/admin/kpi/actuals', { week, metricId, value })
  }

  /**
   * POST /admin/kpi/refresh
   * Triggers all automated integrations for the given week (defaults to current ISO week).
   * Returns a summary of what was updated and any errors.
   */
  async function refreshActuals(week?: string): Promise<RefreshResult> {
    const body: { week?: string } = week ? { week } : {}
    const response = await apiClient.post<RefreshResult>('/admin/kpi/refresh', body)
    return response.data
  }

  return { getActuals, putActual, refreshActuals }
}
