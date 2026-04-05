<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ResultatenCasesSectionProps } from '@/../product/sections/resultaten-cases/types'
import ResultaatCard from './ResultaatCard.vue'
import { BRAND_COLORS, type BgColor } from '@/lib/brand'

const props = withDefaults(defineProps<ResultatenCasesSectionProps & { bg?: BgColor }>(), { bg: 'light' })

const { t } = useI18n()
</script>

<template>
  <section id="resultaten-cases" class="rc-section" :style="{ background: BRAND_COLORS[props.bg] }">
    <div class="rc-container">

      <!-- Section header -->
      <div class="rc-header">
        <span class="rc-eyebrow">{{ t('resultatenCases.sectionLabel') }}</span>
        <h2 class="rc-title">{{ t('resultatenCases.title') }}</h2>
      </div>

      <!-- Cards grid -->
      <div class="rc-grid">
        <ResultaatCard
          v-for="c in cases"
          :key="c.id"
          :case="c"
        />
      </div>

    </div>
  </section>
</template>

<style scoped>
.rc-section {
  padding: 6rem 1rem;
  position: relative;
  overflow: hidden;
}

/* Subtle dot pattern (mirrors HowItWorks rhythm) */
.rc-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 2rem 2rem;
  opacity: 0.45;
  pointer-events: none;
}

.rc-container {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
}

/* Header */
.rc-header {
  text-align: center;
  margin-bottom: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.rc-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.rc-eyebrow::before,
.rc-eyebrow::after {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
  opacity: 0.5;
}

.rc-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
  max-width: 32rem;
}

/* 2×2 Grid */
.rc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.75rem;
}

@media (max-width: 767px) {
  .rc-section {
    padding: 4rem 1rem;
  }

  .rc-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
}
</style>
