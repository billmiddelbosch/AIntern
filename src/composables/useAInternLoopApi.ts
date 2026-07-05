import { ref } from 'vue'
import apiClient from '@/lib/adminAxios'
import type { IssueItem, AgentItem, ActionItem, NewsFlowPage } from '@/types/ainternloop'

export function useAInternLoopApi() {
  const loadingIssues = ref(false)
  const loadingAgents = ref(false)
  const loadingActions = ref(false)
  const loadingNewsFlowPages = ref(false)
  const loadingPriorityTopics = ref(false)
  const error = ref<string | null>(null)
  const issues = ref<IssueItem[]>([])
  const agents = ref<AgentItem[]>([])
  const actions = ref<ActionItem[]>([])
  const newsFlowPages = ref<NewsFlowPage[]>([])
  const priorityTopics = ref<string[]>([])

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

  async function fetchActions(filters?: { status?: string; agent?: string }): Promise<void> {
    loadingActions.value = true
    error.value = null
    try {
      const res = await apiClient.get<{ items: ActionItem[] }>('/admin/ainternloop/actions', {
        params: filters,
      })
      actions.value = res.data.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout'
    } finally {
      loadingActions.value = false
    }
  }

  async function fetchActionDetail(actionId: string): Promise<ActionItem> {
    const res = await apiClient.get<ActionItem>(
      `/admin/ainternloop/actions/${encodeURIComponent(actionId)}`,
    )
    return res.data
  }

  async function updateAction(
    actionId: string,
    updates: {
      urgency?: number
      payload?: { topLezersvraag?: string; lezersvragen?: string[] }
      status?: 'cancelled'
    },
  ): Promise<void> {
    await apiClient.patch(`/admin/ainternloop/actions/${encodeURIComponent(actionId)}`, updates)
  }

  async function fetchPriorityTopics(): Promise<void> {
    loadingPriorityTopics.value = true
    error.value = null
    try {
      const res = await apiClient.get<{ topics: string[] }>('/admin/ainternloop/priority-topics')
      priorityTopics.value = res.data.topics
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout'
    } finally {
      loadingPriorityTopics.value = false
    }
  }

  async function updatePriorityTopics(topics: string[]): Promise<void> {
    const res = await apiClient.put<{ topics: string[] }>('/admin/ainternloop/priority-topics', {
      topics,
    })
    priorityTopics.value = res.data.topics
  }

  async function fetchNewsFlowPages(): Promise<void> {
    loadingNewsFlowPages.value = true
    error.value = null
    try {
      const res = await apiClient.get<{ items: NewsFlowPage[] }>('/admin/ainternloop/newsflow-pages')
      newsFlowPages.value = res.data.items
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout'
    } finally {
      loadingNewsFlowPages.value = false
    }
  }

  return {
    loadingIssues,
    loadingAgents,
    loadingActions,
    loadingNewsFlowPages,
    loadingPriorityTopics,
    error,
    issues,
    agents,
    actions,
    newsFlowPages,
    priorityTopics,
    fetchIssues,
    closeIssue,
    fetchAgents,
    updateAgentInstruction,
    fetchActions,
    fetchActionDetail,
    updateAction,
    fetchPriorityTopics,
    updatePriorityTopics,
    fetchNewsFlowPages,
  }
}
