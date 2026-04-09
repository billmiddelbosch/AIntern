import axios from 'axios'
import { useAuthStore } from '@/stores/useAuthStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach auth token from Pinia store if present
// useAuthStore() is called inside the callback (not at module load time),
// so Pinia is guaranteed to be initialised before this executes.
apiClient.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// Response interceptor — handle 401 and surface error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore().logout()
    }
    return Promise.reject(new Error(error.response?.data?.message ?? error.message))
  },
)

export default apiClient
