import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import adminApiClient from '@/lib/adminAxios'
import type { AuthUser, LoginCredentials, LoginResponse } from '@/types/auth'

const TOKEN_KEY = 'aintern_token'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await adminApiClient.post<LoginResponse>('/admin/login', credentials)
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

  function logout(): void {
    token.value = null
    user.value = null
    error.value = null
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
    }
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
