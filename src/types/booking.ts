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

/** One booked appointment as shown in the admin (GET /admin/bookings). */
export interface AdminBooking {
  bookingId: string
  start: string
  end: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  note?: string
  leadWebsite?: string
  createdAt?: string
}

/** Response of GET /admin/bookings and PUT /admin/bookings/availability. */
export interface AdminBookingsResponse {
  timezone: string
  durationMinutes: number
  /** Every block that can be opened (working hours, tomorrow up to 8 weeks ahead) */
  grid: string[]
  /** Blocks Bill opened — only these are offered on /afspraak */
  open: string[]
  /** Booked appointments, last 30 days and upcoming, sorted by start */
  bookings: AdminBooking[]
}

export interface AvailabilityChange {
  open: string[]
  close: string[]
}

/** One day as shown in a DayStrip (labels already formatted). */
export interface DayOption {
  /** YYYY-MM-DD (Amsterdam) */
  key: string
  weekday: string
  day: string
  month: string
  /** Shows a dot, e.g. "has open blocks" */
  marked?: boolean
}

/** Values the BookingForm emits (trimmed; empty optionals are undefined). */
export type BookingFormValues = Omit<BookingRequest, 'start' | 'locale'>
