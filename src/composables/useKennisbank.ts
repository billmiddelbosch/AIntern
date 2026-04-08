import { ref } from 'vue'
import { s3Client } from '@/lib/s3Client'
import type { BlogPost, KennisbankIndex } from '@/types/kennisbank'

// S3 bucket base URL — configured via VITE_KENNISBANK_BASE_URL env var
const BASE_URL = import.meta.env.VITE_KENNISBANK_BASE_URL as string

export function useKennisbank() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchIndex(): Promise<KennisbankIndex> {
    loading.value = true
    error.value = null
    try {
      const response = await s3Client.get<KennisbankIndex>(`${BASE_URL}/index.json`)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      return { posts: [] }
    } finally {
      loading.value = false
    }
  }

  async function fetchPost(slug: string): Promise<BlogPost | null> {
    loading.value = true
    error.value = null
    try {
      const response = await s3Client.get<BlogPost>(`${BASE_URL}/posts/${slug}.json`)
      return response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchIndex, fetchPost }
}
