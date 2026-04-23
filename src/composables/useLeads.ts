import apiClient from '@/lib/adminAxios'
import type { Lead } from '@/types/lead'

export function useLeads() {
  async function fetchLeads(): Promise<Lead[]> {
    const response = await apiClient.get<Lead[]>('/admin/leads')
    return response.data
  }

  return { fetchLeads }
}
