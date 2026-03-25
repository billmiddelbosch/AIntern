import { ref } from 'vue'
import apiClient from '@/lib/axios'
import type { AxiosRequestConfig } from 'axios'

/**
 * Generic composable for data fetching via the configured axios instance.
 * Usage: const { data, loading, error, execute } = useFetch<User[]>('/users')
 */
export function useFetch<T>(url: string, config?: AxiosRequestConfig) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function execute(overrideConfig?: AxiosRequestConfig) {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get<T>(url, { ...config, ...overrideConfig })
      data.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
