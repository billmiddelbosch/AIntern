import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type ConsentStatus = 'undecided' | 'accepted' | 'declined'

const STORAGE_KEY = 'aintern_consent'
const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN ?? 'aintern.nl'
const PLAUSIBLE_SCRIPT_ID = 'plausible-analytics'
const PLAUSIBLE_SRC = 'https://plausible.io/js/script.js'

function injectPlausibleScript(): void {
  if (document.getElementById(PLAUSIBLE_SCRIPT_ID)) return
  const script = document.createElement('script')
  script.id = PLAUSIBLE_SCRIPT_ID
  script.defer = true
  script.setAttribute('data-domain', PLAUSIBLE_DOMAIN)
  script.src = PLAUSIBLE_SRC
  document.head.appendChild(script)
}

export const useConsentStore = defineStore('consent', () => {
  const status = ref<ConsentStatus>('undecided')

  const hasDecided = computed(() => status.value !== 'undecided')
  const isAccepted = computed(() => status.value === 'accepted')

  function init(): void {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'accepted') {
      status.value = 'accepted'
      injectPlausibleScript()
    } else if (stored === 'declined') {
      status.value = 'declined'
    }
  }

  function accept(): void {
    status.value = 'accepted'
    localStorage.setItem(STORAGE_KEY, 'accepted')
    injectPlausibleScript()
  }

  function decline(): void {
    status.value = 'declined'
    localStorage.setItem(STORAGE_KEY, 'declined')
  }

  return {
    status,
    hasDecided,
    isAccepted,
    init,
    accept,
    decline,
  }
})
