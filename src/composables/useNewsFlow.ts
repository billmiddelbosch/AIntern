import { ref } from 'vue'
import { s3Client } from '@/lib/s3Client'
import type { NewsFlowIndexEntry } from '@/types/newsflow'

const NEWSFLOW_BASE_URL =
  import.meta.env.VITE_NEWSFLOW_BASE_URL ?? 'https://aintern-newsflow.s3.eu-west-2.amazonaws.com'

export function useNewsFlow() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchIndex(): Promise<NewsFlowIndexEntry[]> {
    loading.value = true
    error.value = null
    try {
      const response = await s3Client.get<NewsFlowIndexEntry[]>(`${NEWSFLOW_BASE_URL}/index.json`)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      return []
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchIndex }
}
