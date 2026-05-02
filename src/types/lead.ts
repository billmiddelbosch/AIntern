export type LeadStatus =
  | 'new'
  | 'enriched'
  | 'connection_sent'
  | 'connected'
  | 'dm_sent'
  | 'dm_responded'
  | 'discovery_booked'
  | 'won'
  | 'lost'
  | 'not_found'
  | 'email_sent'

export interface Lead {
  id: string
  website: string
  companyName?: string
  linkedinUrl?: string
  linkedinName?: string
  email?: string
  status: LeadStatus
  assignee?: string
  connectionSentAt?: string
  connectionMessage?: string
  connectionVariant?: string
  dmSentAt?: string
  dmMessage?: string
  dmVariant?: string
  dmResponse?: string
  discoveryBookedAt?: string
  discoveryCallUrl?: string
  source?: string
  notes?: string
  lastEmailSubject?: string
  lastEmailBody?: string
  createdAt: string
  updatedAt: string
}

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'not_found',
  'enriched',
  'email_sent',
  'connection_sent',
  'connected',
  'dm_sent',
  'dm_responded',
  'discovery_booked',
  'won',
  'lost',
]
