export type LinkedInPostStatus = 'draft' | 'approved' | 'published' | 'archived'

export interface LinkedInPost {
  id: string
  title: string
  content: string
  status: LinkedInPostStatus
  episode?: number
  serie?: string
  hashtags?: string
  scheduledFor?: string
  publishedAt?: string
  engagementNotes?: string
  createdAt: string
  updatedAt: string
}

export const LINKEDIN_POST_STATUSES: LinkedInPostStatus[] = [
  'draft',
  'approved',
  'published',
  'archived',
]
