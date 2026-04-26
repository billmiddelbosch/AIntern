export type OpportunityPriority = 'high' | 'medium' | 'low'
export type OpportunityStatus = 'draft' | 'in-content' | 'in-outreach' | 'converted' | 'archived'

export interface OpportunityStatement {
  id: string
  painSignalIds: string[]
  pain: string
  persona: string
  rootCause: string
  opportunity: string
  priority: OpportunityPriority
  status: OpportunityStatus
  createdAt: string
  updatedAt: string
}
