export interface BlogPostSummary {
  slug: string
  title: string
  category: string
  publishedAt: string // ISO date string "2026-03-31"
  excerpt: string
  metaDescription: string
}

export interface QnAPair {
  question: string
  answer: string
}

export interface BlogPost extends BlogPostSummary {
  content: string // HTML string from AI agent
  faq: QnAPair[]
}

export interface KennisbankIndex {
  posts: BlogPostSummary[]
}

export interface QnaEntry {
  question: string
  answer: string
  slug: string
  title: string
  category: string
  publishedAt: string
}

export interface QnaIndex {
  items: QnaEntry[]
}
