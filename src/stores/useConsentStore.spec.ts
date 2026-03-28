import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConsentStore } from './useConsentStore'

const STORAGE_KEY = 'aintern_consent'

describe('useConsentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    // Remove any injected Plausible script between tests
    const existing = document.getElementById('plausible-analytics')
    if (existing) existing.remove()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('starts as undecided', () => {
      const store = useConsentStore()
      expect(store.status).toBe('undecided')
    })

    it('hasDecided is false when undecided', () => {
      const store = useConsentStore()
      expect(store.hasDecided).toBe(false)
    })

    it('isAccepted is false when undecided', () => {
      const store = useConsentStore()
      expect(store.isAccepted).toBe(false)
    })
  })

  describe('init()', () => {
    it('restores accepted status from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'accepted')
      const store = useConsentStore()
      store.init()
      expect(store.status).toBe('accepted')
      expect(store.isAccepted).toBe(true)
    })

    it('restores declined status from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'declined')
      const store = useConsentStore()
      store.init()
      expect(store.status).toBe('declined')
      expect(store.isAccepted).toBe(false)
    })

    it('remains undecided when localStorage is empty', () => {
      const store = useConsentStore()
      store.init()
      expect(store.status).toBe('undecided')
    })

    it('injects Plausible script when consent was previously accepted', () => {
      localStorage.setItem(STORAGE_KEY, 'accepted')
      const store = useConsentStore()
      store.init()
      const script = document.getElementById('plausible-analytics')
      expect(script).not.toBeNull()
    })

    it('does NOT inject Plausible script when consent was declined', () => {
      localStorage.setItem(STORAGE_KEY, 'declined')
      const store = useConsentStore()
      store.init()
      const script = document.getElementById('plausible-analytics')
      expect(script).toBeNull()
    })

    it('does NOT inject Plausible script when undecided', () => {
      const store = useConsentStore()
      store.init()
      const script = document.getElementById('plausible-analytics')
      expect(script).toBeNull()
    })
  })

  describe('accept()', () => {
    it('sets status to accepted', () => {
      const store = useConsentStore()
      store.accept()
      expect(store.status).toBe('accepted')
    })

    it('sets hasDecided to true', () => {
      const store = useConsentStore()
      store.accept()
      expect(store.hasDecided).toBe(true)
    })

    it('sets isAccepted to true', () => {
      const store = useConsentStore()
      store.accept()
      expect(store.isAccepted).toBe(true)
    })

    it('persists "accepted" to localStorage', () => {
      const store = useConsentStore()
      store.accept()
      expect(localStorage.getItem(STORAGE_KEY)).toBe('accepted')
    })

    it('injects the Plausible script tag', () => {
      const store = useConsentStore()
      store.accept()
      const script = document.getElementById('plausible-analytics')
      expect(script).not.toBeNull()
      expect(script?.tagName).toBe('SCRIPT')
    })

    it('does NOT inject a second Plausible script if called twice', () => {
      const store = useConsentStore()
      store.accept()
      store.accept()
      const scripts = document.querySelectorAll('#plausible-analytics')
      expect(scripts.length).toBe(1)
    })
  })

  describe('decline()', () => {
    it('sets status to declined', () => {
      const store = useConsentStore()
      store.decline()
      expect(store.status).toBe('declined')
    })

    it('sets hasDecided to true', () => {
      const store = useConsentStore()
      store.decline()
      expect(store.hasDecided).toBe(true)
    })

    it('isAccepted remains false', () => {
      const store = useConsentStore()
      store.decline()
      expect(store.isAccepted).toBe(false)
    })

    it('persists "declined" to localStorage', () => {
      const store = useConsentStore()
      store.decline()
      expect(localStorage.getItem(STORAGE_KEY)).toBe('declined')
    })

    it('does NOT inject Plausible script', () => {
      const store = useConsentStore()
      store.decline()
      const script = document.getElementById('plausible-analytics')
      expect(script).toBeNull()
    })
  })
})
