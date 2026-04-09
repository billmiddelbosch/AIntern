import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/lib/axios'
import type { AuthUser, LoginCredentials, LoginResponse } from '@/types/auth'

const TOKEN_KEY = 'aintern_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await apiClient.post<LoginResponse>('/admin/auth/login', credentials)
      token.value = data.token
      user.value = data.user
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, data.token)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    token.value = null
    user.value = null
    error.value = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
    }
    // Dynamically import router to avoid circular dependency
    const { default: router } = await import('@/router')
    router.push({ name: 'admin-login' })
  }

  function initFromStorage(): void {
    if (typeof localStorage === 'undefined') return
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) {
      token.value = stored
    }
  }

  return {
    token,
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    initFromStorage,
  }
})
