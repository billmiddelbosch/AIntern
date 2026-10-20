import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Optional context (e.g. the savings calculation) that is prefilled into the
// "note" field of the booking form. Module-level so it survives the navigation.
const pendingNote = ref('')

/**
 * Every "plan a call" button uses this to go to the own booking page (/afspraak),
 * which replaced the Calendly modal. Must be called from a component's setup().
 */
export function useBookingPage() {
  const router = useRouter()

  function openBooking() {
    pendingNote.value = ''
    void router.push({ name: 'afspraak' })
  }

  function openBookingWithNote(text: string) {
    pendingNote.value = text
    void router.push({ name: 'afspraak' })
  }

  /** Read the pending note once (the booking page calls this on mount). */
  function consumeNote(): string {
    const value = pendingNote.value
    pendingNote.value = ''
    return value
  }

  return { openBooking, openBookingWithNote, consumeNote }
}
