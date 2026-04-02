import { ref } from 'vue'

const isOpen = ref(false)

export function useIntakeModal() {
  function openIntakeModal() {
    isOpen.value = true
  }
  function closeIntakeModal() {
    isOpen.value = false
  }
  return { isOpen, openIntakeModal, closeIntakeModal }
}
