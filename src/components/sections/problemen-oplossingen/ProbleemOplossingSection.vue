<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ProbleemOplossingSectionProps } from '@/../product/sections/problemen-oplossingen/types'
import ProbleemOplossingPair from './ProbleemOplossingPair.vue'
import { BRAND_COLORS, type BgColor } from '@/lib/brand'

const props = withDefaults(defineProps<ProbleemOplossingSectionProps & { bg?: BgColor }>(), { bg: 'dark' })

const { t } = useI18n()
</script>

<template>
  <section id="problemen-oplossingen" class="pos-section" :style="{ background: BRAND_COLORS[props.bg] }">
    <div class="pos-container">

      <!-- Section header -->
      <div class="pos-header">
        <span class="pos-eyebrow">{{ t('problemsSolutions.sectionLabel') }}</span>
        <h2 class="pos-title">{{ t('problemsSolutions.title') }}</h2>
      </div>

      <!-- Pairs -->
      <div class="pos-pairs">
        <ProbleemOplossingPair
          v-for="(pair, index) in pairs"
          :key="pair.id"
          :pair="pair"
          :index="index"
        />
      </div>

    </div>
  </section>
</template>

<style scoped>
.pos-section {
  padding: 6rem 1rem;
  position: relative;
  overflow: hidden;
}

/* Subtle radial glow in background */
.pos-section::before {
  content: '';
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 60rem;
  height: 30rem;
  background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.07) 0%, transparent 70%);
  pointer-events: none;
}

.pos-container {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
}

/* Header */
.pos-header {
  text-align: center;
  margin-bottom: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pos-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #818cf8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.pos-eyebrow::before,
.pos-eyebrow::after {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #818cf8;
  border-radius: 1px;
  opacity: 0.5;
}

.pos-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.02em;
  line-height: 1.2;
  max-width: 32rem;
}

/* Pairs list */
.pos-pairs {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

@media (max-width: 767px) {
  .pos-section {
    padding: 4rem 1rem;
  }

  .pos-pairs {
    gap: 2rem;
  }
}
</style>
