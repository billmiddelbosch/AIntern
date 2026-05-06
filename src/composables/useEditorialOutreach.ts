import { ref } from 'vue'
import adminAxios from '@/lib/adminAxios'

export interface EditorialItem {
  id: string
  publicationId: string
  articleUrl: string
  articleTitle: string
  articleDate: string
  authorName?: string
  editorialReason: 'best-of-list' | 'comparison' | 'expert-feature' | 'trends' | 'none'
  contactName?: string
  contactEmail?: string
  emailSource?: 'apollo' | 'fallback_redactie'
  angle?: 'gratis_account' | 'case_study' | 'expert_quote'
  emailSubject?: string
  emailBody?: string
  status: string
  composedAt?: string
  sentAt?: string
  createdAt: string
}

const PUBLICATION_NAMES: Record<string, string> = {
  sprout: 'Sprout.nl',
  emerce: 'Emerce.nl',
  agconnect: 'AG Connect',
  computable: 'Computable.nl',
  zipconomy: 'ZiPconomy',
  mkbservicedesk: 'MKB Servicedesk',
}

export function useEditorialOutreach() {
  const items = ref<EditorialItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchItems(status = 'pending_approval') {
    loading.value = true
    error.value = null
    try {
      const { data } = await adminAxios.get<EditorialItem[]>('/admin/editorial-outreach', {
        params: { status },
      })
      items.value = data
    } catch (e) {
      error.value = 'Laden mislukt'
      console.error('[useEditorialOutreach] fetchItems', e)
    } finally {
      loading.value = false
    }
  }

  async function approve(id: string): Promise<boolean> {
    try {
      await adminAxios.put(`/admin/editorial-outreach/${id}/approve`)
      items.value = items.value.filter((i) => i.id !== id)
      return true
    } catch (e) {
      console.error('[useEditorialOutreach] approve', e)
      return false
    }
  }

  async function updateEmail(id: string, emailSubject: string, emailBody: string): Promise<boolean> {
    try {
      await adminAxios.patch(`/admin/editorial-outreach/${id}`, { emailSubject, emailBody })
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) {
        items.value[idx] = { ...items.value[idx], emailSubject, emailBody }
      }
      return true
    } catch (e) {
      console.error('[useEditorialOutreach] updateEmail', e)
      return false
    }
  }

  async function skip(id: string): Promise<boolean> {
    try {
      await adminAxios.put(`/admin/editorial-outreach/${id}/skip`)
      items.value = items.value.filter((i) => i.id !== id)
      return true
    } catch (e) {
      console.error('[useEditorialOutreach] skip', e)
      return false
    }
  }

  function publicationName(id: string): string {
    return PUBLICATION_NAMES[id] ?? id
  }

  return { items, loading, error, fetchItems, approve, skip, updateEmail, publicationName }
}
