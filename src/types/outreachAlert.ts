export type OutreachAlertStatus = 'pending' | 'responded' | 'dm_sent' | 'ignored'
export type OutreachIntent = 'question' | 'complaint' | 'solution_seeking'

export interface OutreachAlert {
  id: string
  painSignalId?: string
  opportunityId: string
  source: 'reddit'
  sourceUrl: string
  authorName: string
  intent: OutreachIntent
  suggestedResponse: string
  status: OutreachAlertStatus
  respondedAt?: string
  dmSentAt?: string
  notes?: string
  createdAt: string
}
