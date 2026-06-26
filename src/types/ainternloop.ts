export interface IssueItem {
  issueId: string
  agentName: string
  description: string
  status: 'open' | 'escalated' | 'resolving' | 'closed'
  resolutionApproach?: string
  instructionToAgent?: string
  actionRef?: string
  type?: string
  createdAt: string
  updatedAt: string
  errorContext?: Record<string, unknown>
}

export interface AgentItem {
  agentName: string
  displayName: string
  system: string
  instruction: string
  instructionVersion: number
  lastModifiedAt: string
  lastModifiedBy: string
  versionHistory?: Array<{
    version: number
    instruction: string
    modifiedAt: string
    modifiedBy: string
  }>
}

export interface ActionItem {
  actionId: string
  type: string
  status: string
  urgency: number
  sourceAgent: string
  targetAgent: string
  createdAt: string
  updatedAt: string
  payload?: Record<string, unknown>
}
