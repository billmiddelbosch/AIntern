import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useLeads } from '@/composables/useLeads'
import type { Lead } from '@/types/lead'

export const useLeadStore = defineStore('leads', () => {
  const leads = ref<Lead[]>([])
  const selectedLead = ref<Lead | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { fetchLeads, fetchLeadById, updateLead } = useLeads()

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

  async function fetchLeadByIdAction(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      selectedLead.value = await fetchLeadById(id)
    } catch (err: unknown) {
      error.value = (err as Error).message
      selectedLead.value = null
    } finally {
      loading.value = false
    }
  }

  async function updateLeadAction(id: string, fields: Partial<Lead>): Promise<void> {
    const updated = await updateLead(id, fields)
    selectedLead.value = updated
    const idx = leads.value.findIndex((l) => l.id === updated.id)
    if (idx !== -1) leads.value[idx] = updated
  }

  return { leads, selectedLead, loading, error, loadLeads, fetchLeadByIdAction, updateLeadAction }
})
