import { ref } from 'vue'
import axios from '@/lib/axios'

export type ContactFormStatus = 'idle' | 'loading' | 'success' | 'error'

export function useContactForm() {
  const name = ref('')
  const email = ref('')
  const message = ref('')
  const status = ref<ContactFormStatus>('idle')

  async function submit() {
    const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT
    if (!endpoint) {
      status.value = 'error'
      return
    }

    status.value = 'loading'
    try {
      await axios.post(endpoint, {
        name: name.value,
        email: email.value,
        message: message.value,
      }, {
        headers: { Accept: 'application/json' },
      })
      status.value = 'success'
      name.value = ''
      email.value = ''
      message.value = ''
    } catch {
      status.value = 'error'
    }
  }

  function reset() {
    name.value = ''
    email.value = ''
    message.value = ''
    status.value = 'idle'
  }

  return { name, email, message, status, submit, reset }
}
