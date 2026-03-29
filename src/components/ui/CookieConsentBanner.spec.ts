import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CookieConsentBanner from './CookieConsentBanner.vue'
import { useConsentStore } from '@/stores/useConsentStore'

const STORAGE_KEY = 'aintern_consent'

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    const existing = document.getElementById('plausible-analytics')
    if (existing) existing.remove()
  })

  function mountBanner() {
    return mount(CookieConsentBanner, {
      global: {
        plugins: [],
      },
    })
  }

  it('renders the banner when consent is undecided', () => {
    const wrapper = mountBanner()
    expect(wrapper.find('[role="region"]').exists()).toBe(true)
  })

  it('does not render when consent is already accepted', () => {
    const store = useConsentStore()
    store.accept()
    const wrapper = mountBanner()
    // v-if hides the region
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('does not render when consent is already declined', () => {
    const store = useConsentStore()
    store.decline()
    const wrapper = mountBanner()
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('calls accept() when the accept button is clicked', async () => {
    const store = useConsentStore()
    const wrapper = mountBanner()
    const buttons = wrapper.findAll('button')
    // Accept button is second (decline, accept)
    const acceptBtn = buttons[1]
    await acceptBtn.trigger('click')
    expect(store.status).toBe('accepted')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('accepted')
  })

  it('calls decline() when the decline button is clicked', async () => {
    const store = useConsentStore()
    const wrapper = mountBanner()
    const buttons = wrapper.findAll('button')
    const declineBtn = buttons[0]
    await declineBtn.trigger('click')
    expect(store.status).toBe('declined')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('declined')
  })

  it('hides the banner after clicking accept', async () => {
    const wrapper = mountBanner()
    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })

  it('hides the banner after clicking decline', async () => {
    const wrapper = mountBanner()
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="region"]').exists()).toBe(false)
  })
})
