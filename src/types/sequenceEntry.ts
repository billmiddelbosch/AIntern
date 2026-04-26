export type SequenceStatus = 'active' | 'replied' | 'bounced' | 'completed'
export type EmailVariant = 'A' | 'B' | 'C'

export interface SequenceEntry {
  id: string
  email: string
  company?: string
  contactName?: string
  opportunityId: string
  variant: EmailVariant
  currentStep: 1 | 2 | 3 | 4
  nextSendAt: string
  status: SequenceStatus
  repliedAt?: string
  bouncedAt?: string
  notes?: string
  createdAt: string
}
