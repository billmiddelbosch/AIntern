import { ref } from 'vue'
import apiClient from '@/lib/adminAxios'
import type { LinkedInPost, LinkedInPostStatus } from '@/types/linkedinPost'

export type CreateLinkedInPostPayload = Pick<LinkedInPost, 'title' | 'content'> &
  Partial<Pick<LinkedInPost, 'serie' | 'episode' | 'hashtags' | 'scheduledFor' | 'engagementNotes'>>

export type UpdateLinkedInPostPayload = Partial<
  Pick<LinkedInPost, 'title' | 'content' | 'status' | 'serie' | 'episode' | 'hashtags' | 'scheduledFor' | 'publishedAt' | 'engagementNotes'>
>

export function useLinkedInPosts() {
  const posts = ref<LinkedInPost[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPosts(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await apiClient.get<LinkedInPost[]>('/admin/linkedin-posts')
      posts.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  async function createPost(payload: CreateLinkedInPostPayload): Promise<LinkedInPost> {
    const response = await apiClient.post<LinkedInPost>('/admin/linkedin-posts', payload)
    posts.value.unshift(response.data)
    return response.data
  }

  async function updatePost(id: string, payload: UpdateLinkedInPostPayload): Promise<LinkedInPost> {
    const response = await apiClient.put<LinkedInPost>(`/admin/linkedin-posts/${id}`, payload)
    const idx = posts.value.findIndex((p) => p.id === id)
    if (idx !== -1) posts.value[idx] = response.data
    return response.data
  }

  async function deletePost(id: string): Promise<LinkedInPost> {
    const response = await apiClient.delete<LinkedInPost>(`/admin/linkedin-posts/${id}`)
    const idx = posts.value.findIndex((p) => p.id === id)
    if (idx !== -1) posts.value[idx] = response.data
    return response.data
  }

  async function approvePost(id: string): Promise<LinkedInPost> {
    return updatePost(id, { status: 'approved' as LinkedInPostStatus })
  }

  async function archivePost(id: string): Promise<LinkedInPost> {
    return deletePost(id)
  }

  return { posts, loading, error, fetchPosts, createPost, updatePost, deletePost, approvePost, archivePost }
}
