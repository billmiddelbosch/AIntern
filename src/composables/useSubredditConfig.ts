import { ref } from 'vue'
import adminAxios from '@/lib/adminAxios'
import type { SubredditConfig } from '@/types/subredditConfig'

export function useSubredditConfig() {
  const axios = adminAxios
  const subreddits = ref<SubredditConfig[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSubreddits() {
    loading.value = true
    error.value = null
    try {
      const { data } = await axios.get<SubredditConfig[]>('/admin/subreddit-config')
      subreddits.value = data
    } catch (e) {
      error.value = 'Laden mislukt'
      console.error('[useSubredditConfig] fetchSubreddits', e)
    } finally {
      loading.value = false
    }
  }

  async function addSubreddit(name: string): Promise<void> {
    const { data } = await axios.post<SubredditConfig>('/admin/subreddit-config', { name })
    subreddits.value.push(data)
  }

  async function toggleActive(name: string, active: boolean): Promise<void> {
    await axios.put(`/admin/subreddit-config/${encodeURIComponent(name)}`, { active })
    const item = subreddits.value.find((s) => s.name === name)
    if (item) item.active = active
  }

  async function removeSubreddit(name: string): Promise<void> {
    await axios.delete(`/admin/subreddit-config/${encodeURIComponent(name)}`)
    subreddits.value = subreddits.value.filter((s) => s.name !== name)
  }

  return { subreddits, loading, error, fetchSubreddits, addSubreddit, toggleActive, removeSubreddit }
}
