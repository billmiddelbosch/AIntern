<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead as useUnhead } from '@unhead/vue'
import DOMPurify from 'dompurify'
import { AppShell } from '@/components/shell'
import { useKennisbank } from '@/composables/useKennisbank'
import type { BlogPost } from '@/types/kennisbank'

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

// Category colour-coding — consistent with BlogCard
const categoryColors: Record<string, { bg: string; text: string }> = {
  'AI Automatisering': { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
  'MKB Praktijkcases': { bg: 'rgba(16,185,129,0.1)', text: '#059669' },
  'Implementatietips': { bg: 'rgba(245,158,11,0.1)', text: '#d97706' },
  'AI Tools & Technologie': { bg: 'rgba(139,92,246,0.1)', text: '#7c3aed' },
}

const categoryStyle = computed(() => {
  if (!post.value) return {}
  const colors = categoryColors[post.value.category] ?? {
    bg: 'rgba(100,116,139,0.1)',
    text: '#475569',
  }
  return { backgroundColor: colors.bg, color: colors.text }
})

const sanitizedContent = computed(() =>
  post.value ? DOMPurify.sanitize(post.value.content) : ''
)
</script>

<template>
  <AppShell>
    <div class="kb-artikel">
      <div class="kb-artikel__container">

        <!-- Back navigation -->
        <RouterLink to="/kennisbank" class="kb-artikel__back">
          <span aria-hidden="true">&larr;</span>
          {{ t('kennisbank.backToKennisbank') }}
        </RouterLink>

        <!-- Loading state -->
        <div v-if="loading" class="kb-artikel__loading" aria-busy="true">
          <div class="kb-skeleton kb-skeleton--title" />
          <div class="kb-skeleton kb-skeleton--line" />
          <div class="kb-skeleton kb-skeleton--line kb-skeleton--short" />
          <div class="kb-skeleton kb-skeleton--body" />
        </div>

        <!-- 404 / not found -->
        <div v-else-if="notFound || error" class="kb-artikel__notfound">
          <h1 class="kb-artikel__notfound-title">404</h1>
          <p class="kb-artikel__notfound-text">{{ t('kennisbank.articleNotFound') }}</p>
          <RouterLink to="/kennisbank" class="kb-artikel__notfound-link">
            {{ t('kennisbank.backToKennisbank') }}
          </RouterLink>
        </div>

        <!-- Article content -->
        <article v-else-if="post" class="kb-artikel__article">

          <!-- Meta: category + date -->
          <div class="kb-artikel__meta">
            <span class="kb-artikel__category" :style="categoryStyle">{{ post.category }}</span>
            <time class="kb-artikel__date" :datetime="post.publishedAt">{{ formattedDate }}</time>
          </div>

          <!-- Title -->
          <h1 class="kb-artikel__title">{{ post.title }}</h1>

          <!-- Excerpt -->
          <p class="kb-artikel__excerpt">{{ post.excerpt }}</p>

          <!-- Divider -->
          <div class="kb-artikel__divider" />

          <div class="kb-artikel__body" v-html="sanitizedContent" />

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
  max-width: 48rem; /* ~65ch equivalent for comfortable reading */
  margin: 0 auto;
}

/* Back link */
.kb-artikel__back {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6366f1;
  text-decoration: none;
  margin-bottom: 2.5rem;
  transition: gap 0.2s ease;
}

.kb-artikel__back:hover {
  gap: 0.625rem;
  text-decoration: underline;
}

/* Article */
.kb-artikel__article {
  background: white;
  border-radius: 1.25rem;
  padding: 3rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 16px rgba(0, 0, 0, 0.04);
}

.kb-artikel__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.kb-artikel__category {
  display: inline-flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
}

.kb-artikel__date {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}

.kb-artikel__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.kb-artikel__excerpt {
  font-size: 1.125rem;
  line-height: 1.7;
  color: #475569;
  font-weight: 400;
  margin-bottom: 0;
}

.kb-artikel__divider {
  height: 1px;
  background: #e2e8f0;
  margin: 2rem 0;
}

/* Article body — AI-generated HTML content */
.kb-artikel__body {
  font-size: 1rem;
  line-height: 1.8;
  color: #374151;
}

.kb-artikel__body :deep(h2) {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.015em;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}

.kb-artikel__body :deep(h3) {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.01em;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.kb-artikel__body :deep(p) {
  margin-bottom: 1.25rem;
}

.kb-artikel__body :deep(ul),
.kb-artikel__body :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1.25rem;
}

.kb-artikel__body :deep(li) {
  margin-bottom: 0.4rem;
}

.kb-artikel__body :deep(strong) {
  font-weight: 600;
  color: #1e293b;
}

.kb-artikel__body :deep(a) {
  color: #6366f1;
  text-decoration: underline;
}

.kb-artikel__body :deep(a:hover) {
  color: #4f46e5;
}

.kb-artikel__body :deep(blockquote) {
  border-left: 3px solid #6366f1;
  padding-left: 1.25rem;
  margin: 1.5rem 0;
  color: #475569;
  font-style: italic;
}

/* Loading skeleton */
.kb-skeleton {
  background: #e2e8f0;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  animation: kb-pulse 1.6s ease-in-out infinite;
}

.kb-skeleton--title {
  height: 2.5rem;
  width: 80%;
}

.kb-skeleton--line {
  height: 1rem;
}

.kb-skeleton--short {
  width: 55%;
}

.kb-skeleton--body {
  height: 20rem;
  margin-top: 2rem;
}

@keyframes kb-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 404 / not found */
.kb-artikel__notfound {
  text-align: center;
  padding: 5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.kb-artikel__notfound-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 5rem;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: -0.04em;
  line-height: 1;
}

.kb-artikel__notfound-text {
  font-size: 1.125rem;
  color: #64748b;
}

.kb-artikel__notfound-link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.5rem;
  border-radius: 0.75rem;
  background: #6366f1;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  margin-top: 0.5rem;
  transition: background 0.2s ease;
}

.kb-artikel__notfound-link:hover {
  background: #4f46e5;
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
