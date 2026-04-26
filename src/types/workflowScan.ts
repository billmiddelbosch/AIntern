export interface WorkflowScanSubmission {
  id: string
  email: string
  score: number
  rawScore: number
  answers: Record<string, string | number>
  topIssues: string[]
  sector?: string
  createdAt: string
}

export interface ScanRecommendation {
  issue: string
  recommendation: string
  ainternApproach: string
}
