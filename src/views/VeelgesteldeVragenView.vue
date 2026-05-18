<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead as useUnhead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { AppShell } from '@/components/shell'
import { useQnA } from '@/composables/useQnA'
import type { QnaEntry } from '@/types/kennisbank'

const { t, locale } = useI18n()
const route = useRoute()
const { loading, error, fetchQnaIndex } = useQnA()

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'

const items = ref<QnaEntry[]>([])
const activeCategory = ref<string | null>(null)
const openIndex = ref<number | null>(null)

const categories = computed<string[]>(() => {
  const seen = new Set<string>()
  items.value.forEach((item) => seen.add(item.category))
  return Array.from(seen)
})

const filteredItems = computed<QnaEntry[]>(() => {
  if (!activeCategory.value) return items.value
  return items.value.filter((item) => item.category === activeCategory.value)
})

useUnhead({
  title: computed(() => t('faq.metaTitle')),
  htmlAttrs: { lang: computed(() => locale.value) },
  meta: [
    { name: 'description', content: computed(() => t('faq.metaDescription')) },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: computed(() => t('faq.metaTitle')) },
    { property: 'og:description', content: computed(() => t('faq.metaDescription')) },
    { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
    { property: 'og:locale', content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')) },
  ],
  link: [{ rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) }],
  script: computed(() => {
    if (filteredItems.value.length === 0) return []
    return [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: filteredItems.value.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        }),
      },
    ]
  }),
})

onMounted(async () => {
  const index = await fetchQnaIndex()
  items.value = index.items
})

function setCategory(cat: string | null) {
  activeCategory.value = cat
  openIndex.value = null
}

function toggleItem(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <AppShell>
    <section class="faq-overview">
      <div class="faq-overview__container">

        <!-- Page header -->
        <header class="faq-overview__header">
          <span class="faq-overview__eyebrow">{{ t('faq.sectionLabel') }}</span>
          <h1 class="faq-overview__title">{{ t('faq.overviewTitle') }}</h1>
          <p class="faq-overview__subtitle">{{ t('faq.overviewSubtitle') }}</p>
        </header>

        <!-- Category filter -->
        <div
          v-if="!loading && items.length > 0"
          class="faq-overview__filters"
          role="group"
          :aria-label="t('faq.categoryFilter')"
        >
          <button
            class="faq-filter-pill"
            :class="{ 'faq-filter-pill--active': activeCategory === null }"
            @click="setCategory(null)"
          >
            {{ t('faq.allCategories') }}
          </button>
          <button
            v-for="cat in categories"
            :key="cat"
            class="faq-filter-pill"
            :class="{ 'faq-filter-pill--active': activeCategory === cat }"
            @click="setCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loading" class="faq-overview__list">
          <div v-for="n in 6" :key="n" class="faq-skeleton" aria-hidden="true">
            <div class="faq-skeleton__question" />
            <div class="faq-skeleton__toggle" />
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="faq-overview__empty">
          <p>{{ t('faq.errorState') }}</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredItems.length === 0" class="faq-overview__empty">
          <p>{{ t('faq.emptyState') }}</p>
        </div>

        <!-- FAQ accordion -->
        <div v-else class="faq-overview__list" role="list">
          <div
            v-for="(item, index) in filteredItems"
            :key="`${item.slug}-${index}`"
            class="faq-item"
            role="listitem"
          >
            <button
              class="faq-item__trigger"
              :aria-expanded="openIndex === index"
              :aria-controls="`faq-answer-${index}`"
              @click="toggleItem(index)"
            >
              <span class="faq-item__question">{{ item.question }}</span>
              <span class="faq-item__category-pill">{{ item.category }}</span>
              <span class="faq-item__chevron" :class="{ 'faq-item__chevron--open': openIndex === index }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>

            <Transition name="faq-expand">
              <div
                v-show="openIndex === index"
                :id="`faq-answer-${index}`"
                class="faq-item__body"
                role="region"
              >
                <p class="faq-item__answer">{{ item.answer }}</p>
                <RouterLink
                  :to="`/kennisbank/${item.slug}`"
                  class="faq-item__source-link"
                >
                  {{ t('faq.readFullArticle') }}: {{ item.title }} →
                </RouterLink>
              </div>
            </Transition>
          </div>
        </div>

        <!-- CTA banner -->
        <div v-if="!loading && filteredItems.length > 0" class="faq-overview__cta">
          <p class="faq-overview__cta-text">{{ t('faq.ctaText') }}</p>
          <RouterLink to="/kennisbank" class="faq-overview__cta-link">
            {{ t('faq.ctaLink') }} →
          </RouterLink>
        </div>

      </div>
    </section>
  </AppShell>
</template>

<style scoped>
.faq-overview {
  padding: 5rem 1rem 6rem;
  background: #f8fafc;
  min-height: calc(100vh - 4rem);
}

.faq-overview__container {
  max-width: 52rem;
  margin: 0 auto;
}

.faq-overview__header {
  text-align: center;
  margin-bottom: 3.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.faq-overview__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.faq-overview__eyebrow::before,
.faq-overview__eyebrow::after {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
  opacity: 0.5;
}

.faq-overview__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.faq-overview__subtitle {
  font-size: 1.0625rem;
  color: #64748b;
  max-width: 38rem;
  line-height: 1.6;
}

/* Category filter pills */
.faq-overview__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  justify-content: center;
  margin-bottom: 2.5rem;
}

.faq-filter-pill {
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

.faq-filter-pill:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.faq-filter-pill--active {
  background: #6366f1;
  border-color: #6366f1;
  color: white;
}

/* FAQ list */
.faq-overview__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* FAQ item */
.faq-item {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: box-shadow 0.15s;
}

.faq-item:hover {
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
}

.faq-item__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1.25rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.faq-item__question {
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.faq-item__category-pill {
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 0.1875rem 0.625rem;
  border-radius: 999px;
  white-space: nowrap;
}

.faq-item__chevron {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.faq-item__chevron--open {
  transform: rotate(180deg);
  color: #6366f1;
}

.faq-item__body {
  padding: 0 1.5rem 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.faq-item__answer {
  font-size: 0.9375rem;
  color: #475569;
  line-height: 1.7;
  margin: 1rem 0 0.75rem;
}

.faq-item__source-link {
  display: inline-flex;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
  text-decoration: none;
  transition: color 0.12s;
}

.faq-item__source-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

/* Accordion animation */
.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: opacity 0.18s ease;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  opacity: 0;
}

/* Empty / error state */
.faq-overview__empty {
  text-align: center;
  padding: 5rem 1rem;
  color: #94a3b8;
  font-size: 1.0625rem;
}

/* Skeleton */
.faq-skeleton {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  animation: faq-pulse 1.6s ease-in-out infinite;
}

.faq-skeleton__question {
  flex: 1;
  height: 1.125rem;
  border-radius: 0.375rem;
  background: #e2e8f0;
}

.faq-skeleton__toggle {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: #e2e8f0;
  flex-shrink: 0;
}

@keyframes faq-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

/* CTA banner */
.faq-overview__cta {
  margin-top: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%);
  border-radius: 1.25rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.faq-overview__cta-text {
  font-size: 1rem;
  color: #475569;
  margin: 0;
}

.faq-overview__cta-link {
  display: inline-flex;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #6366f1;
  text-decoration: none;
  transition: color 0.12s;
}

.faq-overview__cta-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

@media (max-width: 639px) {
  .faq-overview {
    padding: 3rem 1rem 4rem;
  }

  .faq-item__trigger {
    padding: 1rem 1.125rem;
    flex-wrap: wrap;
  }

  .faq-item__question {
    font-size: 0.9375rem;
  }

  .faq-item__category-pill {
    display: none;
  }

  .faq-item__body {
    padding: 0 1.125rem 1rem;
  }
}
</style>
