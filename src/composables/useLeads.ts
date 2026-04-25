import apiClient from '@/lib/adminAxios'
import type { Lead } from '@/types/lead'

export function useLeads() {
  async function fetchLeads(): Promise<Lead[]> {
    const response = await apiClient.get<Lead[]>('/admin/leads')
    return response.data
  }

  async function fetchLeadById(id: string): Promise<Lead> {
    const response = await apiClient.get<Lead>(`/admin/leads/${id}`)
    return response.data
  }

  async function updateLead(id: string, fields: Partial<Lead>): Promise<Lead> {
    const response = await apiClient.put<Lead>(`/admin/leads/${id}`, fields)
    return response.data
  }

  return { fetchLeads, fetchLeadById, updateLead }
}
