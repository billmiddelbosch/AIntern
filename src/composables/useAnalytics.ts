import { useConsentStore } from '@/stores/useConsentStore'

type EventProps = Record<string, string | number | boolean>

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: EventProps }) => void
  }
}

export function useAnalytics() {
  function trackEvent(name: string, props?: EventProps): void {
    const consent = useConsentStore()
    if (!consent.isAccepted) return
    if (typeof window === 'undefined' || typeof window.plausible !== 'function') return
    window.plausible(name, props ? { props } : undefined)
  }

  function trackPageView(): void {
    trackEvent('pageview')
  }

  return {
    trackEvent,
    trackPageView,
  }
}
