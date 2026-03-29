import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConsentStore } from '@/stores/useConsentStore'
import { useAnalytics } from './useAnalytics'

describe('useAnalytics', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    // Remove Plausible script between tests
    const existing = document.getElementById('plausible-analytics')
    if (existing) existing.remove()
    // Clean up window.plausible
    delete (window as Window & { plausible?: unknown }).plausible
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('trackEvent()', () => {
    it('is a no-op when consent is undecided', () => {
      const plausibleMock = vi.fn()
      window.plausible = plausibleMock

      const { trackEvent } = useAnalytics()
      trackEvent('cta_click', { location: 'hero' })

      expect(plausibleMock).not.toHaveBeenCalled()
    })

    it('is a no-op when consent is declined', () => {
      const store = useConsentStore()
      store.decline()

      const plausibleMock = vi.fn()
      window.plausible = plausibleMock

      const { trackEvent } = useAnalytics()
      trackEvent('cta_click', { location: 'hero' })

      expect(plausibleMock).not.toHaveBeenCalled()
    })

    it('calls window.plausible when consent is accepted', () => {
      const store = useConsentStore()
      store.accept()

      const plausibleMock = vi.fn()
      window.plausible = plausibleMock

      const { trackEvent } = useAnalytics()
      trackEvent('cta_click', { location: 'hero' })

      expect(plausibleMock).toHaveBeenCalledWith('cta_click', { props: { location: 'hero' } })
    })

    it('calls window.plausible without props object when no props given', () => {
      const store = useConsentStore()
      store.accept()

      const plausibleMock = vi.fn()
      window.plausible = plausibleMock

      const { trackEvent } = useAnalytics()
      trackEvent('pageview')

      expect(plausibleMock).toHaveBeenCalledWith('pageview', undefined)
    })

    it('does not throw when window.plausible is undefined and consent is accepted', () => {
      const store = useConsentStore()
      store.accept()
      // window.plausible is not set

      const { trackEvent } = useAnalytics()
      expect(() => trackEvent('cta_click', { location: 'nav' })).not.toThrow()
    })
  })

  describe('trackPageView()', () => {
    it('is a no-op when consent is undecided', () => {
      const plausibleMock = vi.fn()
      window.plausible = plausibleMock

      const { trackPageView } = useAnalytics()
      trackPageView()

      expect(plausibleMock).not.toHaveBeenCalled()
    })

    it('calls window.plausible("pageview") when consent is accepted', () => {
      const store = useConsentStore()
      store.accept()

      const plausibleMock = vi.fn()
      window.plausible = plausibleMock

      const { trackPageView } = useAnalytics()
      trackPageView()

      expect(plausibleMock).toHaveBeenCalledWith('pageview', undefined)
    })
  })
})
