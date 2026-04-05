export interface BlogPostSummary {
  slug: string
  title: string
  category: string
  publishedAt: string // ISO date string "2026-03-31"
  excerpt: string
  metaDescription: string
}

export interface BlogPost extends BlogPostSummary {
  content: string // HTML string from AI agent
}

export interface KennisbankIndex {
  posts: BlogPostSummary[]
}
