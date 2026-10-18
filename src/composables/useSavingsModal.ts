import { ref } from 'vue'

const isOpen = ref(false)

export function useSavingsModal() {
  function openSavingsModal() {
    isOpen.value = true
  }
  function closeSavingsModal() {
    isOpen.value = false
  }
  return { isOpen, openSavingsModal, closeSavingsModal }
}
