import { reactive, ref } from 'vue'
import type { Ref } from 'vue'
import apiClient from '@/lib/adminAxios'

export const VALID_CATEGORIES = [
  'AI Automatisering',
  'MKB Praktijkcases',
  'Implementatietips',
  'AI Tools & Technologie',
] as const

export const VALID_TAGS = [
  'ai-automatisering',
  'lightspeed-webshop',
  'mkb',
  'no-cure-no-pay',
  'roi-kostenbesparing',
  'implementatietips',
  'ai-tools',
  'klantenservice',
  'productbeschrijvingen',
] as const

export type ValidCategory = (typeof VALID_CATEGORIES)[number]
export type ValidTag = (typeof VALID_TAGS)[number]

export interface KennisbankPostForm {
  slug: string
  title: string
  category: string
  publishedAt: string
  excerpt: string
  metaDescription: string
  content: string
  tags: string[]
  status: 'draft' | 'published'
}

export interface UseKennisbankArticleEditor {
  form: KennisbankPostForm
  loading: Ref<boolean>
  saving: Ref<boolean>
  publishing: Ref<boolean>
  deleting: Ref<boolean>
  error: Ref<string | null>
  loadArticle(slug: string): Promise<void>
  saveDraft(): Promise<void>
  publish(): Promise<void>
  deleteArticle(): Promise<void>
}

export function useKennisbankArticleEditor(): UseKennisbankArticleEditor {
  const form = reactive<KennisbankPostForm>({
    slug: '',
    title: '',
    category: VALID_CATEGORIES[0],
    publishedAt: new Date().toISOString().split('T')[0],
    excerpt: '',
    metaDescription: '',
    content: '',
    tags: [],
    status: 'draft',
  })

  const loading = ref(false)
  const saving = ref(false)
  const publishing = ref(false)
  const deleting = ref(false)
  const error = ref<string | null>(null)

  async function loadArticle(slug: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get<KennisbankPostForm>(`/admin/kennisbank/${slug}`)
      Object.assign(form, response.data)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  async function saveDraft(): Promise<void> {
    saving.value = true
    error.value = null
    try {
      await apiClient.put(`/admin/kennisbank/${form.slug}`, { ...form, status: 'draft' })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function publish(): Promise<void> {
    publishing.value = true
    error.value = null
    try {
      await apiClient.post(`/admin/kennisbank/${form.slug}/publish`, { ...form })
      form.status = 'published'
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      publishing.value = false
    }
  }

  async function deleteArticle(): Promise<void> {
    deleting.value = true
    error.value = null
    try {
      await apiClient.delete(`/admin/kennisbank/${form.slug}`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      deleting.value = false
    }
  }

  return { form, loading, saving, publishing, deleting, error, loadArticle, saveDraft, publish, deleteArticle }
}
