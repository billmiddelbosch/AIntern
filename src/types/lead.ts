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

export interface Lead {
  id: string
  website: string
  companyName?: string
  linkedinUrl?: string
  linkedinName?: string
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
  createdAt: string
  updatedAt: string
}

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'enriched',
  'connection_sent',
  'connected',
  'dm_sent',
  'dm_responded',
  'discovery_booked',
  'won',
  'lost',
  'not_found',
]
