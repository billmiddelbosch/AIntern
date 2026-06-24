export interface TrafficData {
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
  lastUpdated: string
}

export interface OptimizationLogEntry {
  at: string
  agent: string
  changes: string[]
  trafficBefore: TrafficData
  trafficAfter: TrafficData
}

export interface LandingPageItem {
  pk: string                    // LANDING_PAGE#<slug>
  sk: string                    // META
  actionRef: string             // ACTION#<uuid>
  url: string
  title: string
  lezersvraag: string
  urgencyScore: number
  publishedAt: string
  lastOptimizedAt?: string
  optimizationCount: number
  status: 'published' | 'optimizing' | 'on_hold'
  traffic: TrafficData
  optimizationLog: OptimizationLogEntry[]
  sitemapAdded: boolean
  llmFileAdded: boolean
  contentS3Key: string
  createdAt: string
  updatedAt: string
  // GSI keys
  GSI1pk: string                // STATUS#<status>
  GSI1sk: string                // <publishedAt>
  GSI2pk: string                // SCORE#<urgencyBucket>
  GSI2sk: string                // <publishedAt>
}

// S3 content JSON — written by ContentBuilder, read by Vue NewsFlowPageView
export interface NewsFlowPageContent {
  slug: string
  title: string
  metaDescription: string
  lezersvraag: string
  publishedAt: string
  sections: {
    intro: string
    context: string
    mkbRelevantie: string
    ainternAngle: string
    bronnen: Array<{ title: string; url: string }>
  }
  faq: Array<{ question: string; answer: string }>
  cta: {
    headline: string
    subtext: string
    buttonLabel: string
    buttonUrl: string
  }
  schema: Record<string, unknown>
}
