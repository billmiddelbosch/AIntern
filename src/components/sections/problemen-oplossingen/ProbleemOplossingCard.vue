<script setup lang="ts">
import type { CardProps } from '@/../product/sections/problemen-oplossingen/types'

defineProps<CardProps>()

const icons: Record<string, string> = {
  'clock': `<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  'zap': `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  'shield-alert': `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  'shield-check': `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="9 12 11 14 15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  'puzzle': `<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  'settings': `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>`,
}

function getIcon(name: string): string {
  return icons[name] ?? icons['clock']
}
</script>

<template>
  <div class="poc-card" :class="variant === 'problem' ? 'poc-card--problem' : 'poc-card--solution'">
    <!-- Icon badge -->
    <div class="poc-card__icon-wrap">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        v-html="getIcon(icon)"
      />
    </div>

    <!-- Type label -->
    <span class="poc-card__label">
      <slot name="label" />
    </span>

    <!-- Title -->
    <h3 class="poc-card__title">{{ title }}</h3>

    <!-- Description -->
    <p class="poc-card__description">{{ description }}</p>
  </div>
</template>

<style scoped>
.poc-card {
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  border: 1px solid transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.poc-card:hover {
  transform: translateY(-2px);
}

/* Problem variant — warm red tint */
.poc-card--problem {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.15);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(239, 68, 68, 0.06);
}

.poc-card--problem:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25), 0 12px 28px rgba(239, 68, 68, 0.1);
}

/* Solution variant — indigo/green tint */
.poc-card--solution {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(99, 102, 241, 0.08);
}

.poc-card--solution:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25), 0 12px 28px rgba(99, 102, 241, 0.14);
}

/* Icon wrap */
.poc-card__icon-wrap {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.poc-card--problem .poc-card__icon-wrap {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}

.poc-card--solution .poc-card__icon-wrap {
  background: rgba(99, 102, 241, 0.14);
  color: #818cf8;
}

/* Label */
.poc-card__label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.poc-card--problem .poc-card__label {
  color: #f87171;
}

.poc-card--solution .poc-card__label {
  color: #818cf8;
}

/* Title */
.poc-card__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.0625rem;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

/* Description */
.poc-card__description {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #94a3b8;
  flex: 1;
}
</style>
