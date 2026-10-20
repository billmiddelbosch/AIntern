/** Response of GET /booking/slots — slot starts are UTC ISO strings. */
export interface BookingSlotsResponse {
  timezone: string
  durationMinutes: number
  slots: string[]
}

export interface BookingRequest {
  start: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  website?: string
  note?: string
  locale: 'nl' | 'en'
  /** Honeypot — must stay empty */
  fax: string
}

export interface BookingConfirmation {
  bookingId: string
  start: string
  end: string
  meetingUrl: string | null
  emailSent: boolean
}

export type BookingSubmitResult =
  | { ok: true; booking: BookingConfirmation }
  | { ok: false; reason: 'slot_unavailable' | 'invalid' | 'too_many' | 'error' }
