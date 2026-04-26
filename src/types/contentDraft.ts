export type ContentChannel = 'linkedin_company' | 'x'
export type ContentFormat = 'post' | 'thread'
export type ContentStatus = 'draft' | 'approved' | 'published' | 'archived'

export interface ContentDraft {
  id: string
  opportunityId: string
  channel: ContentChannel
  format: ContentFormat
  content: string
  hashtags?: string
  status: ContentStatus
  scheduledFor?: string
  publishedAt?: string
  engagementNotes?: string
  createdAt: string
  updatedAt: string
}
