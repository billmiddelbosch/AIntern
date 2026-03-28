import { ref } from 'vue'

const isOpen = ref(false)

export function useBookingModal() {
  function openBookingModal() {
    isOpen.value = true
  }
  function closeBookingModal() {
    isOpen.value = false
  }
  return { isOpen, openBookingModal, closeBookingModal }
}
