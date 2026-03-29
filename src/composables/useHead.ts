import { computed } from 'vue'
import { useHead as useUnhead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://aintern.nl'
const OG_IMAGE_URL = '/og-image.png'
const SITE_NAME = 'AIntern'

/**
 * useHead — manages all <head> SEO meta tags reactively via @unhead/vue.
 *
 * Call once at the app root (App.vue). Reacts to locale changes
 * (vue-i18n) and route changes (vue-router) automatically.
 * SSR-safe: @unhead/vue serialises tags server-side and hydrates on client.
 */
export function useHead(): void {
  const { t, locale } = useI18n()
  const route = useRoute()

  useUnhead({
    title: computed(() => t('seo.home.title')),
    htmlAttrs: { lang: computed(() => locale.value) },
    meta: [
      { name: 'description', content: computed(() => t('seo.home.description')) },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: computed(() => t('seo.home.title')) },
      { property: 'og:description', content: computed(() => t('seo.home.description')) },
      { property: 'og:url', content: computed(() => `${ORIGIN}${route.path}`) },
      { property: 'og:image', content: `${ORIGIN}${OG_IMAGE_URL}` },
      { property: 'og:image:alt', content: computed(() => t('seo.home.ogImageAlt')) },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      {
        property: 'og:locale',
        content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')),
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: computed(() => t('seo.home.title')) },
      { name: 'twitter:description', content: computed(() => t('seo.home.description')) },
      { name: 'twitter:image', content: `${ORIGIN}${OG_IMAGE_URL}` },
      { name: 'twitter:image:alt', content: computed(() => t('seo.home.ogImageAlt')) },
    ],
    link: [{ rel: 'canonical', href: computed(() => `${ORIGIN}${route.path}`) }],
  })
}
