import apiClient from '@/lib/adminAxios'
import type { AdminBookingsResponse, AvailabilityChange } from '@/types/booking'

export function useAdminBookings() {
  async function fetchBookings(): Promise<AdminBookingsResponse> {
    const response = await apiClient.get<AdminBookingsResponse>('/admin/bookings')
    return response.data
  }

  /** Opens/closes blocks and returns the fresh overview. */
  async function updateAvailability(change: AvailabilityChange): Promise<AdminBookingsResponse> {
    const response = await apiClient.put<AdminBookingsResponse>('/admin/bookings/availability', change)
    return response.data
  }

  return { fetchBookings, updateAvailability }
}
