import axios from 'axios'

const adminApiClient = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_BASE_URL ?? '/admin-api',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

adminApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('aintern_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default adminApiClient
