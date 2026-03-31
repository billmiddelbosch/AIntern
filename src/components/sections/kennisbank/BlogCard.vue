<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { BlogPostSummary } from '@/types/kennisbank'

const props = defineProps<{ post: BlogPostSummary }>()

const { t, locale } = useI18n()

// Category colour-coding — consistent with rc-card tag pill pattern
const categoryColors: Record<string, { bg: string; text: string }> = {
  'AI Automatisering': { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
  'MKB Praktijkcases': { bg: 'rgba(16,185,129,0.1)', text: '#059669' },
  'Implementatietips': { bg: 'rgba(245,158,11,0.1)', text: '#d97706' },
  'AI Tools & Technologie': { bg: 'rgba(139,92,246,0.1)', text: '#7c3aed' },
}

const categoryStyle = computed(() => {
  const colors = categoryColors[props.post.category] ?? {
    bg: 'rgba(100,116,139,0.1)',
    text: '#475569',
  }
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  }
})

const formattedDate = computed(() => {
  const date = new Date(props.post.publishedAt)
  return new Intl.DateTimeFormat(locale.value === 'nl' ? 'nl-NL' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
})
</script>

<template>
  <article class="kb-card">
    <!-- Category pill -->
    <span class="kb-card__category" :style="categoryStyle">
      {{ post.category }}
    </span>

    <!-- Title -->
    <h3 class="kb-card__title">{{ post.title }}</h3>

    <!-- Excerpt -->
    <p class="kb-card__excerpt">{{ post.excerpt }}</p>

    <!-- Footer: date + link -->
    <div class="kb-card__footer">
      <time class="kb-card__date" :datetime="post.publishedAt">{{ formattedDate }}</time>
      <RouterLink
        :to="`/kennisbank/${post.slug}`"
        class="kb-card__link"
      >
        {{ t('kennisbank.readMore') }}
        <span aria-hidden="true">&rarr;</span>
      </RouterLink>
    </div>
  </article>
</template>

<style scoped>
.kb-card {
  background: white;
  border-radius: 1.25rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 16px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.kb-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.07),
    0 16px 32px rgba(0, 0, 0, 0.07);
}

.kb-card__category {
  display: inline-flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  width: fit-content;
}

.kb-card__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.0625rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin-top: 0.25rem;
}

.kb-card__excerpt {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #64748b;
  flex: 1;
}

.kb-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.kb-card__date {
  font-size: 0.8125rem;
  color: #94a3b8;
  font-weight: 500;
}

.kb-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6366f1;
  text-decoration: none;
  transition: gap 0.2s ease;
  white-space: nowrap;
}

.kb-card__link:hover {
  gap: 0.5rem;
  text-decoration: underline;
}
</style>
