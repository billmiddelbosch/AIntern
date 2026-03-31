<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead as useUnhead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { AppShell } from '@/components/shell'
import BlogCard from '@/components/sections/kennisbank/BlogCard.vue'
import { useKennisbank } from '@/composables/useKennisbank'
import type { BlogPostSummary } from '@/types/kennisbank'

const { t, locale } = useI18n()
const route = useRoute()
const { loading, error, fetchIndex } = useKennisbank()

const posts = ref<BlogPostSummary[]>([])
const activeCategory = ref<string | null>(null)

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'

useUnhead({
  title: computed(() => t('kennisbank.metaTitle')),
  htmlAttrs: { lang: computed(() => locale.value) },
  meta: [
    { name: 'description', content: computed(() => t('kennisbank.metaDescription')) },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: computed(() => t('kennisbank.metaTitle')) },
    { property: 'og:description', content: computed(() => t('kennisbank.metaDescription')) },
    { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
    { property: 'og:locale', content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')) },
  ],
  link: [{ rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) }],
})

onMounted(async () => {
  const index = await fetchIndex()
  posts.value = index.posts
})

const categories = computed<string[]>(() => {
  const seen = new Set<string>()
  posts.value.forEach((p) => seen.add(p.category))
  return Array.from(seen)
})

const filteredPosts = computed<BlogPostSummary[]>(() => {
  if (!activeCategory.value) return posts.value
  return posts.value.filter((p) => p.category === activeCategory.value)
})

function setCategory(cat: string | null) {
  activeCategory.value = cat
}
</script>

<template>
  <AppShell>
    <section class="kb-overview">
      <div class="kb-overview__container">

        <!-- Page header -->
        <header class="kb-overview__header">
          <span class="kb-overview__eyebrow">{{ t('kennisbank.sectionLabel') }}</span>
          <h1 class="kb-overview__title">{{ t('kennisbank.overviewTitle') }}</h1>
          <p class="kb-overview__subtitle">{{ t('kennisbank.overviewSubtitle') }}</p>
        </header>

        <!-- Category filter -->
        <div v-if="!loading && posts.length > 0" class="kb-overview__filters" role="group" :aria-label="t('kennisbank.categoryFilter')">
          <button
            class="kb-filter-pill"
            :class="{ 'kb-filter-pill--active': activeCategory === null }"
            @click="setCategory(null)"
          >
            {{ t('kennisbank.allCategories') }}
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            class="kb-filter-pill"
            :class="{ 'kb-filter-pill--active': activeCategory === cat }"
            @click="setCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="kb-overview__grid">
          <div v-for="n in 6" :key="n" class="kb-skeleton" aria-hidden="true">
            <div class="kb-skeleton__pill" />
            <div class="kb-skeleton__title" />
            <div class="kb-skeleton__line" />
            <div class="kb-skeleton__line kb-skeleton__line--short" />
            <div class="kb-skeleton__footer" />
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="kb-overview__empty">
          <p>{{ t('kennisbank.errorState') }}</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredPosts.length === 0" class="kb-overview__empty">
          <p>{{ t('kennisbank.emptyState') }}</p>
        </div>

        <!-- Post grid -->
        <div v-else class="kb-overview__grid">
          <BlogCard
            v-for="post in filteredPosts"
            :key="post.slug"
            :post="post"
          />
        </div>

      </div>
    </section>
  </AppShell>
</template>

<style scoped>
.kb-overview {
  padding: 5rem 1rem 6rem;
  background: #f8fafc;
  min-height: calc(100vh - 4rem);
}

.kb-overview__container {
  max-width: 72rem;
  margin: 0 auto;
}

.kb-overview__header {
  text-align: center;
  margin-bottom: 3.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.kb-overview__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.kb-overview__eyebrow::before,
.kb-overview__eyebrow::after {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
  opacity: 0.5;
}

.kb-overview__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.kb-overview__subtitle {
  font-size: 1.0625rem;
  color: #64748b;
  max-width: 40rem;
  line-height: 1.6;
}

/* Category filter pills */
.kb-overview__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  justify-content: center;
  margin-bottom: 3rem;
}

.kb-filter-pill {
  padding: 0.4375rem 1.125rem;
  border-radius: 999px;
  border: 1.5px solid #e2e8f0;
  background: white;
  color: #475569;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.kb-filter-pill:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.kb-filter-pill--active {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

/* Post grid — 3 cols desktop, 2 tablet, 1 mobile */
.kb-overview__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.75rem;
}

/* Empty / error state */
.kb-overview__empty {
  text-align: center;
  padding: 5rem 1rem;
  color: #94a3b8;
  font-size: 1.0625rem;
}

/* Skeleton */
.kb-skeleton {
  background: white;
  border-radius: 1.25rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  animation: kb-pulse 1.6s ease-in-out infinite;
}

.kb-skeleton__pill {
  height: 1.25rem;
  width: 7rem;
  border-radius: 999px;
  background: #e2e8f0;
}

.kb-skeleton__title {
  height: 1.5rem;
  border-radius: 0.375rem;
  background: #e2e8f0;
  width: 85%;
}

.kb-skeleton__line {
  height: 1rem;
  border-radius: 0.375rem;
  background: #e2e8f0;
}

.kb-skeleton__line--short {
  width: 65%;
}

.kb-skeleton__footer {
  height: 1rem;
  width: 50%;
  border-radius: 0.375rem;
  background: #e2e8f0;
  margin-top: 0.5rem;
}

@keyframes kb-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@media (max-width: 1023px) {
  .kb-overview__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 639px) {
  .kb-overview {
    padding: 3rem 1rem 4rem;
  }

  .kb-overview__grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}
</style>
