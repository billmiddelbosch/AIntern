import { ref } from 'vue'
import apiClient from '@/lib/adminAxios'

export interface KennisbankArticle {
  slug: string
  title: string
  status: 'published' | 'draft'
  lastModified: string
}

interface KennisbankListResponse {
  articles: KennisbankArticle[]
}

export function useKennisbankAdmin() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const articles = ref<KennisbankArticle[]>([])

  async function fetchArticles(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get<KennisbankListResponse>('/admin/kennisbank')
      articles.value = response.data.articles
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return { loading, error, articles, fetchArticles }
}
