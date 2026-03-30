import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useHead as useUnhead } from '@unhead/vue'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'
const OG_IMAGE_URL = `${SITE_URL}/og-image.png`
const SITE_NAME = 'AIntern'

export function useHead(): void {
  const { t, locale } = useI18n()
  const route = useRoute()

  useUnhead({
    title: computed(() => t('seo.home.title')),
    htmlAttrs: {
      lang: computed(() => locale.value),
    },
    meta: [
      { name: 'description', content: computed(() => t('seo.home.description')) },
      { name: 'robots', content: 'index, follow' },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:title', content: computed(() => t('seo.home.title')) },
      { property: 'og:description', content: computed(() => t('seo.home.description')) },
      { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
      { property: 'og:image', content: OG_IMAGE_URL },
      { property: 'og:image:alt', content: computed(() => t('seo.home.ogImageAlt')) },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:locale', content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')) },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: computed(() => t('seo.home.title')) },
      { name: 'twitter:description', content: computed(() => t('seo.home.description')) },
      { name: 'twitter:image', content: OG_IMAGE_URL },
      { name: 'twitter:image:alt', content: computed(() => t('seo.home.ogImageAlt')) },
    ],
    link: [
      { rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) },
    ],
  })
}
