<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ResultaatCase, TagCategory } from '@/../product/sections/resultaten-cases/types'

const props = defineProps<{ case: ResultaatCase }>()

const { t, locale } = useI18n()

function getLocaleContent(c: ResultaatCase) {
  return locale.value === 'nl' ? c.nl : c.en
}

const content = computed(() => getLocaleContent(props.case))

const tagKey: Record<TagCategory, string> = {
  tijdsbesparing: 'resultatenCases.tagTimeSaving',
  kostenbesparing: 'resultatenCases.tagCostSaving',
  groei: 'resultatenCases.tagGrowth',
  kwaliteit: 'resultatenCases.tagQuality',
}

const tagLabel = computed(() => t(tagKey[props.case.tag]))

const icons: Record<string, string> = {
  'clock': `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  'trending-up': `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 7 22 7 22 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  'trending-down': `<polyline points="22 17 13.5 8.5 8.5 13.5 2 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 22 17 22 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  'check-circle': `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
}

function getIcon(name: string): string {
  return icons[name] ?? icons['clock']
}
</script>

<template>
  <article class="rc-card" :class="`rc-card--${props.case.tag}`">
    <!-- Icon badge -->
    <div class="rc-card__icon-wrap" aria-hidden="true">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        v-html="getIcon(props.case.icon)"
      />
    </div>

    <!-- Tag -->
    <span class="rc-card__tag">{{ tagLabel }}</span>

    <!-- Metric -->
    <div class="rc-card__metric">
      <span class="rc-card__metric-value">{{ props.case.metric }}</span>
      <span v-if="props.case.metricUnit" class="rc-card__metric-unit">{{ props.case.metricUnit }}</span>
    </div>

    <!-- Metric label -->
    <p class="rc-card__metric-label">{{ content.metricLabel }}</p>

    <!-- Divider -->
    <div class="rc-card__divider" />

    <!-- Title -->
    <h3 class="rc-card__title">{{ content.title }}</h3>

    <!-- Description -->
    <p class="rc-card__description">{{ content.description }}</p>
  </article>
</template>

<style scoped>
.rc-card {
  background: white;
  border-radius: 1.25rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 4px 16px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.rc-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.07),
    0 16px 32px rgba(0, 0, 0, 0.07);
}

/* Icon badge */
.rc-card__icon-wrap {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 0.25rem;
}

/* Tag */
.rc-card__tag {
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

/* Metric */
.rc-card__metric {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.rc-card__metric-value {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(2.25rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
}

.rc-card__metric-unit {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  opacity: 0.7;
}

.rc-card__metric-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  margin-top: -0.25rem;
}

/* Divider */
.rc-card__divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.5rem 0;
}

/* Title */
.rc-card__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.0625rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

/* Description */
.rc-card__description {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #64748b;
  flex: 1;
}

/* ---- Colour variants ---- */

/* tijdsbesparing — indigo */
.rc-card--tijdsbesparing .rc-card__icon-wrap {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.rc-card--tijdsbesparing .rc-card__tag {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.rc-card--tijdsbesparing .rc-card__metric-value {
  color: #6366f1;
}

.rc-card--tijdsbesparing .rc-card__metric-unit {
  color: #6366f1;
}

/* kostenbesparing — emerald */
.rc-card--kostenbesparing .rc-card__icon-wrap {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.rc-card--kostenbesparing .rc-card__tag {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.rc-card--kostenbesparing .rc-card__metric-value {
  color: #059669;
}

.rc-card--kostenbesparing .rc-card__metric-unit {
  color: #059669;
}

/* groei — amber */
.rc-card--groei .rc-card__icon-wrap {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.rc-card--groei .rc-card__tag {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.rc-card--groei .rc-card__metric-value {
  color: #d97706;
}

.rc-card--groei .rc-card__metric-unit {
  color: #d97706;
}

/* kwaliteit — violet */
.rc-card--kwaliteit .rc-card__icon-wrap {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
}

.rc-card--kwaliteit .rc-card__tag {
  background: rgba(139, 92, 246, 0.1);
  color: #7c3aed;
}

.rc-card--kwaliteit .rc-card__metric-value {
  color: #7c3aed;
}

.rc-card--kwaliteit .rc-card__metric-unit {
  color: #7c3aed;
}
</style>
