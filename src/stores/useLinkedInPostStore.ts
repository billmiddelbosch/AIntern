import { defineStore } from 'pinia'
import { useLinkedInPosts } from '@/composables/useLinkedInPosts'
import type { CreateLinkedInPostPayload, UpdateLinkedInPostPayload } from '@/composables/useLinkedInPosts'
import type { LinkedInPost } from '@/types/linkedinPost'

export const useLinkedInPostStore = defineStore('linkedInPosts', () => {
  const { posts, loading, error, fetchPosts, createPost, updatePost, deletePost } = useLinkedInPosts()

  async function loadPosts(): Promise<void> {
    await fetchPosts()
  }

  async function create(payload: CreateLinkedInPostPayload): Promise<LinkedInPost> {
    return createPost(payload)
  }

  async function update(id: string, payload: UpdateLinkedInPostPayload): Promise<LinkedInPost> {
    return updatePost(id, payload)
  }

  async function archive(id: string): Promise<LinkedInPost> {
    return deletePost(id)
  }

  return { posts, loading, error, loadPosts, create, update, archive }
})
