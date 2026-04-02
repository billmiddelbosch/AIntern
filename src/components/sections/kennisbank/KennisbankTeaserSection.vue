<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useKennisbank } from '@/composables/useKennisbank'
import BlogCard from './BlogCard.vue'
import type { BlogPostSummary } from '@/types/kennisbank'
import { BRAND_COLORS, type BgColor } from '@/lib/brand'

const props = withDefaults(defineProps<{ bg?: BgColor }>(), { bg: 'light' })

const { t } = useI18n()
const { loading, error, fetchIndex } = useKennisbank()

const posts = ref<BlogPostSummary[]>([])

onMounted(async () => {
  const index = await fetchIndex()
  // index.json is sorted by publishedAt descending by the publishing agent
  posts.value = index.posts.slice(0, 3)
})
</script>

<template>
  <section id="kennisbank" class="kb-teaser" :style="{ background: BRAND_COLORS[props.bg] }">
    <div class="kb-teaser__container">

      <!-- Section header -->
      <div class="kb-teaser__header">
        <span class="kb-teaser__eyebrow">{{ t('kennisbank.sectionLabel') }}</span>
        <h2 class="kb-teaser__title">{{ t('kennisbank.teaserTitle') }}</h2>
        <p class="kb-teaser__subtitle">{{ t('kennisbank.teaserSubtitle') }}</p>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="kb-teaser__grid">
        <div v-for="n in 3" :key="n" class="kb-skeleton" aria-hidden="true">
          <div class="kb-skeleton__pill" />
          <div class="kb-skeleton__title" />
          <div class="kb-skeleton__line" />
          <div class="kb-skeleton__line kb-skeleton__line--short" />
          <div class="kb-skeleton__footer" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="kb-teaser__empty">
        <p>{{ t('kennisbank.errorState') }}</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="posts.length === 0" class="kb-teaser__empty">
        <p>{{ t('kennisbank.emptyState') }}</p>
      </div>

      <!-- Cards -->
      <div v-else class="kb-teaser__grid">
        <BlogCard
          v-for="post in posts"
          :key="post.slug"
          :post="post"
        />
      </div>

      <!-- CTA -->
      <div class="kb-teaser__cta-wrap">
        <RouterLink to="/kennisbank" class="kb-teaser__cta">
          {{ t('kennisbank.viewAll') }}
          <span aria-hidden="true">&rarr;</span>
        </RouterLink>
      </div>

    </div>
  </section>
</template>

<style scoped>
.kb-teaser {
  padding: 6rem 1rem;
  position: relative;
  overflow: hidden;
}

.kb-teaser::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 2rem 2rem;
  opacity: 0.45;
  pointer-events: none;
}

.kb-teaser__container {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
}

.kb-teaser__header {
  text-align: center;
  margin-bottom: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.kb-teaser__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.kb-teaser__eyebrow::before,
.kb-teaser__eyebrow::after {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
  opacity: 0.5;
}

.kb-teaser__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #6366f1;
  letter-spacing: -0.02em;
  line-height: 1.2;
  max-width: 32rem;
}

.kb-teaser__subtitle {
  font-size: 1rem;
  color: #64748b;
  max-width: 36rem;
  line-height: 1.6;
}

/* 3-column grid */
.kb-teaser__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.75rem;
}

/* CTA */
.kb-teaser__cta-wrap {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
}

.kb-teaser__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  border-radius: 0.75rem;
  background: #6366f1;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease, gap 0.2s ease;
}

.kb-teaser__cta:hover {
  background: #4f46e5;
  gap: 0.75rem;
}

/* Empty / error state */
.kb-teaser__empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
  font-size: 1rem;
}

/* Skeleton loader */
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
  .kb-teaser__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 639px) {
  .kb-teaser {
    padding: 4rem 1rem;
  }

  .kb-teaser__grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}
</style>
