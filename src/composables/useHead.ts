import { watchEffect, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const OG_IMAGE_URL = '/og-image.png'
const SITE_NAME = 'AIntern'

/**
 * useHead — manages all <head> SEO meta tags reactively.
 *
 * Call once at the app root (App.vue). Reacts to locale changes
 * (vue-i18n) and route changes (vue-router) automatically.
 *
 * Manages:
 *   - <title>
 *   - <meta name="description">
 *   - <meta name="robots">
 *   - <meta property="og:*">
 *   - <meta name="twitter:*">
 *   - <link rel="canonical">
 *   - <html lang="…">
 */
export function useHead(): void {
  const { t, locale } = useI18n()
  const route = useRoute()

  function getOrCreate(selector: string, tag: string, attrs: Record<string, string>): HTMLElement {
    let el = document.querySelector<HTMLElement>(selector)
    if (!el) {
      el = document.createElement(tag)
      for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v)
      }
      document.head.appendChild(el)
    }
    return el
  }

  function setMeta(name: string, content: string): void {
    const el = getOrCreate(`meta[name="${name}"]`, 'meta', { name })
    el.setAttribute('content', content)
  }

  function setProperty(property: string, content: string): void {
    const el = getOrCreate(`meta[property="${property}"]`, 'meta', { property })
    el.setAttribute('content', content)
  }

  function setCanonical(href: string): void {
    const el = getOrCreate('link[rel="canonical"]', 'link', { rel: 'canonical' })
    el.setAttribute('href', href)
  }

  const stop = watchEffect(() => {
    const title = t('seo.home.title')
    const description = t('seo.home.description')
    const ogImageAlt = t('seo.home.ogImageAlt')
    const canonicalUrl = `${window.location.origin}${route.path}`
    const ogImage = `${window.location.origin}${OG_IMAGE_URL}`

    // <title>
    document.title = title

    // <html lang>
    document.documentElement.setAttribute('lang', locale.value)

    // Standard meta
    setMeta('description', description)
    setMeta('robots', 'index, follow')

    // Open Graph
    setProperty('og:type', 'website')
    setProperty('og:site_name', SITE_NAME)
    setProperty('og:title', title)
    setProperty('og:description', description)
    setProperty('og:url', canonicalUrl)
    setProperty('og:image', ogImage)
    setProperty('og:image:alt', ogImageAlt)
    setProperty('og:image:width', '1200')
    setProperty('og:image:height', '630')
    setProperty('og:locale', locale.value === 'nl' ? 'nl_NL' : 'en_US')

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    setMeta('twitter:image', ogImage)
    setMeta('twitter:image:alt', ogImageAlt)

    // Canonical
    setCanonical(canonicalUrl)
  })

  onUnmounted(() => {
    stop()
  })
}
