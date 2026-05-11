<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead as useUnhead } from '@unhead/vue'
import DOMPurify from 'dompurify'
import { AppShell } from '@/components/shell'
import { useKennisbank } from '@/composables/useKennisbank'
import type { BlogPost } from '@/types/kennisbank'
import KbArticleBackNav from '@/components/kennisbank/KbArticleBackNav.vue'
import KbArticleSkeleton from '@/components/kennisbank/KbArticleSkeleton.vue'
import KbArticleNotFound from '@/components/kennisbank/KbArticleNotFound.vue'
import KbArticleMeta from '@/components/kennisbank/KbArticleMeta.vue'
import KbArticleHeader from '@/components/kennisbank/KbArticleHeader.vue'
import KbArticleBody from '@/components/kennisbank/KbArticleBody.vue'

const { t, locale } = useI18n()
const route = useRoute()
const { loading, error, fetchPost } = useKennisbank()

const post = ref<BlogPost | null>(null)
const notFound = ref(false)

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'

// SEO meta — reactive to the loaded article
useUnhead({
  title: computed(() =>
    post.value ? `${post.value.title} — AIntern Kennisbank` : t('kennisbank.metaTitle')
  ),
  htmlAttrs: { lang: computed(() => locale.value) },
  meta: [
    {
      name: 'description',
      content: computed(() => post.value?.metaDescription ?? t('kennisbank.metaDescription')),
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'article' },
    {
      property: 'og:title',
      content: computed(() =>
        post.value ? `${post.value.title} — AIntern Kennisbank` : t('kennisbank.metaTitle')
      ),
    },
    {
      property: 'og:description',
      content: computed(() => post.value?.metaDescription ?? t('kennisbank.metaDescription')),
    },
    {
      property: 'og:url',
      content: computed(() => `${SITE_URL}${route.path}`),
    },
    {
      property: 'og:locale',
      content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')),
    },
  ],
  link: [{ rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) }],
  script: computed(() => {
    if (!post.value) return []
    const articleUrl = `${SITE_URL}/kennisbank/${post.value.slug}`
    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.value.title,
      description: post.value.metaDescription,
      url: articleUrl,
      datePublished: post.value.publishedAt,
      author: { '@type': 'Person', name: 'Bill Middelbosch' },
      publisher: {
        '@type': 'Organization',
        name: 'AIntern',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.ico` },
      },
      image: `${SITE_URL}/og-image.png`,
    }
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Kennisbank', item: `${SITE_URL}/kennisbank` },
        { '@type': 'ListItem', position: 3, name: post.value.title, item: articleUrl },
      ],
    }
    return [
      { type: 'application/ld+json', innerHTML: JSON.stringify(articleSchema) },
      { type: 'application/ld+json', innerHTML: JSON.stringify(breadcrumbSchema) },
    ]
  }),
})

async function load(slug: string) {
  notFound.value = false
  post.value = null
  const result = await fetchPost(slug)
  if (!result) {
    notFound.value = true
  } else {
    post.value = result
  }
}

onMounted(() => {
  const slug = route.params.slug as string
  load(slug)
})

// Re-fetch when the route param changes (e.g. navigating between articles)
watch(
  () => route.params.slug,
  (slug) => {
    if (typeof slug === 'string') load(slug)
  }
)

const formattedDate = computed(() => {
  if (!post.value) return ''
  const date = new Date(post.value.publishedAt)
  return new Intl.DateTimeFormat(locale.value === 'nl' ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
})

const sanitizedContent = computed(() =>
  post.value ? DOMPurify.sanitize(post.value.content) : ''
)
</script>

<template>
  <AppShell>
    <div class="kb-artikel">
      <div class="kb-artikel__container">
        <KbArticleBackNav />

        <KbArticleSkeleton v-if="loading" />

        <KbArticleNotFound v-else-if="notFound || error" />

        <article v-else-if="post" class="kb-artikel__article">
          <KbArticleMeta
            :category="post.category"
            :published-at="post.publishedAt"
            :formatted-date="formattedDate"
          />
          <KbArticleHeader :title="post.title" :excerpt="post.excerpt" />
          <KbArticleBody :sanitized-content="sanitizedContent" />
        </article>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.kb-artikel {
  padding: 4rem 1rem 6rem;
  background: #f8fafc;
  min-height: calc(100vh - 4rem);
}

.kb-artikel__container {
  max-width: 48rem;
  margin: 0 auto;
}

.kb-artikel__article {
  background: white;
  border-radius: 1.25rem;
  padding: 3rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.04);
}

@media (max-width: 639px) {
  .kb-artikel {
    padding: 2.5rem 1rem 4rem;
  }

  .kb-artikel__article {
    padding: 2rem 1.5rem;
  }
}
</style>
