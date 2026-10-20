import { ref } from 'vue'
import axios from '@/lib/axios'
import type {
  BookingConfirmation,
  BookingRequest,
  BookingSlotsResponse,
  BookingSubmitResult,
} from '@/types/booking'

/** API access for the own booking page (replaces Calendly). */
export function useBooking() {
  const slots = ref<string[]>([])
  const durationMinutes = ref(30)
  const loadingSlots = ref(false)
  const slotsError = ref(false)
  const submitting = ref(false)

  async function loadSlots(): Promise<void> {
    loadingSlots.value = true
    slotsError.value = false
    try {
      const { data } = await axios.get<BookingSlotsResponse>('/booking/slots')
      slots.value = Array.isArray(data.slots) ? data.slots : []
      durationMinutes.value = data.durationMinutes ?? 30
    } catch {
      slotsError.value = true
      slots.value = []
    } finally {
      loadingSlots.value = false
    }
  }

  async function submitBooking(request: BookingRequest): Promise<BookingSubmitResult> {
    submitting.value = true
    try {
      // 4xx are expected answers (taken slot, validation) — don't let axios throw on them
      const res = await axios.post<BookingConfirmation>('/booking', request, {
        validateStatus: (status) => status < 500,
      })
      if (res.status === 201) return { ok: true, booking: res.data }
      if (res.status === 409) return { ok: false, reason: 'slot_unavailable' }
      if (res.status === 400) return { ok: false, reason: 'invalid' }
      if (res.status === 429) return { ok: false, reason: 'too_many' }
      return { ok: false, reason: 'error' }
    } catch {
      return { ok: false, reason: 'error' }
    } finally {
      submitting.value = false
    }
  }

  return { slots, durationMinutes, loadingSlots, slotsError, submitting, loadSlots, submitBooking }
}
