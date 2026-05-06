import { ref } from 'vue'
import adminAxios from '@/lib/adminAxios'

export interface SequenceEntry {
  id: string
  email: string
  company?: string
  emailSubject: string
  emailBody: string
  ctaVariant: string
  status: string
  sendAt: string
  createdAt: string
}

export function useEmailSequences() {
  const items = ref<SequenceEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      const { data } = await adminAxios.get<SequenceEntry[]>('/admin/sequences')
      items.value = data
    } catch (e) {
      error.value = 'Laden mislukt'
      console.error('[useEmailSequences] fetchItems', e)
    } finally {
      loading.value = false
    }
  }

  async function updateEmail(id: string, emailSubject: string, emailBody: string): Promise<boolean> {
    try {
      await adminAxios.patch(`/admin/sequences/${id}`, { emailSubject, emailBody })
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) {
        items.value[idx] = { ...items.value[idx], emailSubject, emailBody }
      }
      return true
    } catch (e) {
      console.error('[useEmailSequences] updateEmail', e)
      return false
    }
  }

  return { items, loading, error, fetchItems, updateEmail }
}
