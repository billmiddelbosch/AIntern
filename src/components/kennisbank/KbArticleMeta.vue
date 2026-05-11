<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  category: string
  publishedAt: string
  formattedDate: string
}>()

const categoryColors: Record<string, { bg: string; text: string }> = {
  'AI Automatisering': { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
  'MKB Praktijkcases': { bg: 'rgba(16,185,129,0.1)', text: '#059669' },
  'Implementatietips': { bg: 'rgba(245,158,11,0.1)', text: '#d97706' },
  'AI Tools & Technologie': { bg: 'rgba(139,92,246,0.1)', text: '#7c3aed' },
}

const categoryStyle = computed(() => {
  const colors = categoryColors[props.category] ?? { bg: 'rgba(100,116,139,0.1)', text: '#475569' }
  return { backgroundColor: colors.bg, color: colors.text }
})
</script>

<template>
  <div class="kb-meta">
    <span class="kb-meta__category" :style="categoryStyle">{{ category }}</span>
    <time class="kb-meta__date" :datetime="publishedAt">{{ formattedDate }}</time>
  </div>
</template>

<style scoped>
.kb-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.kb-meta__category {
  display: inline-flex;
  align-items: center;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
}

.kb-meta__date {
  font-size: 0.875rem;
  color: #94a3b8;
  font-weight: 500;
}
</style>
