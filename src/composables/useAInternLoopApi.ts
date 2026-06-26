import { ref } from 'vue'
import apiClient from '@/lib/adminAxios'
import type { IssueItem, AgentItem, ActionItem } from '@/types/ainternloop'

export function useAInternLoopApi() {
  const loadingIssues = ref(false)
  const loadingAgents = ref(false)
  const loadingActions = ref(false)
  const error = ref<string | null>(null)
  const issues = ref<IssueItem[]>([])
  const agents = ref<AgentItem[]>([])
  const actions = ref<ActionItem[]>([])

  async function fetchIssues(status?: string): Promise<void> {
    loadingIssues.value = true
    error.value = null
    try {
      const params = status ? { status } : {}
      const res = await apiClient.get<{ items: IssueItem[] }>('/admin/ainternloop/issues', { params })
      issues.value = res.data.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout'
    } finally {
      loadingIssues.value = false
    }
  }

  async function closeIssue(issueId: string): Promise<void> {
    await apiClient.patch(`/admin/ainternloop/issues/${encodeURIComponent(issueId)}`, { status: 'closed' })
  }

  async function fetchAgents(): Promise<void> {
    loadingAgents.value = true
    error.value = null
    try {
      const res = await apiClient.get<{ items: AgentItem[] }>('/admin/ainternloop/agents')
      agents.value = res.data.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout'
    } finally {
      loadingAgents.value = false
    }
  }

  async function updateAgentInstruction(agentName: string, instruction: string): Promise<void> {
    await apiClient.put(`/admin/ainternloop/agents/${encodeURIComponent(agentName)}`, { instruction })
  }

  async function fetchActions(): Promise<void> {
    loadingActions.value = true
    error.value = null
    try {
      const res = await apiClient.get<{ items: ActionItem[] }>('/admin/ainternloop/actions')
      actions.value = res.data.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout'
    } finally {
      loadingActions.value = false
    }
  }

  return {
    loadingIssues,
    loadingAgents,
    loadingActions,
    error,
    issues,
    agents,
    actions,
    fetchIssues,
    closeIssue,
    fetchAgents,
    updateAgentInstruction,
    fetchActions,
  }
}
