import { ref } from 'vue'

const isOpen = ref(false)
// Optional context (e.g. the savings calculation) that is prefilled into the
// Calendly booking as an answer to the first custom question.
const note = ref('')

export function useBookingModal() {
  function openBookingModal() {
    note.value = ''
    isOpen.value = true
  }
  function openBookingModalWithNote(text: string) {
    note.value = text
    isOpen.value = true
  }
  function closeBookingModal() {
    isOpen.value = false
  }
  return { isOpen, note, openBookingModal, openBookingModalWithNote, closeBookingModal }
}
