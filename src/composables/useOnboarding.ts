import adminApiClient from '@/lib/adminAxios'
import type { OnboardingEntry } from '@/types/onboarding'

export function useOnboarding() {
  async function fetchOnboardingList(): Promise<OnboardingEntry[]> {
    const response = await adminApiClient.get<OnboardingEntry[]>('/admin/onboarding')
    return response.data
  }

  async function fetchOnboardingEntry(clientId: string): Promise<OnboardingEntry> {
    const response = await adminApiClient.get<OnboardingEntry>(`/admin/onboarding/${clientId}`)
    return response.data
  }

  async function createOnboardingEntry(
    clientName: string,
    createdBy: string,
  ): Promise<OnboardingEntry> {
    const response = await adminApiClient.post<OnboardingEntry>('/admin/onboarding', {
      clientName,
      createdBy,
    })
    return response.data
  }

  async function toggleChecklistItem(
    clientId: string,
    itemId: string,
  ): Promise<OnboardingEntry> {
    const response = await adminApiClient.patch<OnboardingEntry>(
      `/admin/onboarding/${clientId}/items/${itemId}`,
    )
    return response.data
  }

  return { fetchOnboardingList, fetchOnboardingEntry, createOnboardingEntry, toggleChecklistItem }
}
