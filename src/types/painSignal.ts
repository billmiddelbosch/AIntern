export type PainSignalStatus = 'new' | 'processed' | 'archived'
export type PainUrgency = 'high' | 'medium' | 'low'

export interface PainSignal {
  id: string
  source: 'reddit' | 'hackernews'
  sourceUrl: string
  subreddit?: string
  title: string
  text: string
  painCategory: string
  persona?: string
  urgency: PainUrgency
  hotScore: number
  status: PainSignalStatus
  opportunityId?: string
  createdAt: string
}
