import { ref } from 'vue'
import { s3Client } from '@/lib/s3Client'
import type { QnaIndex } from '@/types/kennisbank'

const BASE_URL = import.meta.env.VITE_KENNISBANK_BASE_URL as string

export function useQnA() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchQnaIndex(): Promise<QnaIndex> {
    loading.value = true
    error.value = null
    try {
      const response = await s3Client.get<QnaIndex>(`${BASE_URL}/qa.json`)
      return response.data
    } catch (err: unknown) {
      // 403/404 means qa.json doesn't exist yet — treat as empty, not an error
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403 || status === 404) {
        return { items: [] }
      }
      error.value = err instanceof Error ? err.message : 'Unknown error'
      return { items: [] }
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchQnaIndex }
}
