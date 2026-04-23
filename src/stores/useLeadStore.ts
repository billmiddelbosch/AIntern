import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useLeads } from '@/composables/useLeads'
import type { Lead } from '@/types/lead'

export const useLeadStore = defineStore('leads', () => {
  const leads = ref<Lead[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { fetchLeads } = useLeads()

  async function loadLeads(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      leads.value = await fetchLeads()
    } catch (err: unknown) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  return { leads, loading, error, loadLeads }
})
