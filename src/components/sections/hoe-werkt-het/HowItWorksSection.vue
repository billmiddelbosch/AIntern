<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Step } from '@/../product/sections/hoe-werkt-het/types'

defineProps<{ steps: Step[] }>()

const { t, locale } = useI18n()

const icons: Record<string, string> = {
  'search': `<path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  'cpu': `<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
  'trending-up': `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 7 22 7 22 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
}

function getLocaleContent(step: Step) {
  return locale.value === 'nl' ? step.nl : step.en
}

function getIcon(name: string) {
  return icons[name] ?? icons['search']
}

const stepOffsets = ['step-offset-0', 'step-offset-1', 'step-offset-2']
</script>

<template>
  <section class="hiw-section" id="hoe-werkt-het">
    <div class="hiw-container">

      <!-- Section header -->
      <div class="hiw-header">
        <span class="hiw-eyebrow">{{ t('howItWorks.sectionLabel') }}</span>
        <h2 class="hiw-title">{{ t('howItWorks.title') }}</h2>
      </div>

      <!-- Diagonal steps -->
      <div class="hiw-steps">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="hiw-step"
          :class="stepOffsets[index]"
        >
          <!-- Step number (decorative) -->
          <span class="step-number">{{ String(step.order).padStart(2, '0') }}</span>

          <!-- Card -->
          <div class="step-card">
            <!-- Icon -->
            <div class="step-icon-wrap">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                v-html="getIcon(step.icon)"
              />
            </div>

            <!-- Content -->
            <div class="step-content">
              <h3 class="step-title">{{ getLocaleContent(step).title }}</h3>
              <p class="step-description">{{ getLocaleContent(step).description }}</p>
            </div>
          </div>

          <!-- Connector arrow (between steps) -->
          <div v-if="index < steps.length - 1" class="step-connector" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path
                d="M4 20 Q20 8 36 20"
                stroke="#6366f1"
                stroke-width="1.5"
                stroke-dasharray="4 3"
                stroke-linecap="round"
                fill="none"
                opacity="0.4"
              />
              <path d="M30 16 L36 20 L30 24" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
            </svg>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
.hiw-section {
  padding: 6rem 1rem;
  background: #f8fafc;
  position: relative;
  overflow: hidden;
}

/* Subtle background pattern */
.hiw-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 2rem 2rem;
  opacity: 0.5;
  pointer-events: none;
}

.hiw-container {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
}

/* Header */
.hiw-header {
  text-align: center;
  margin-bottom: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.hiw-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hiw-eyebrow::before,
.hiw-eyebrow::after {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
  opacity: 0.5;
}

.hiw-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
  max-width: 32rem;
}

/* Steps diagonal layout */
.hiw-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  align-items: start;
  position: relative;
}

.hiw-step {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Diagonal offsets */
.step-offset-0 { margin-top: 0; }
.step-offset-1 { margin-top: 3.5rem; }
.step-offset-2 { margin-top: 7rem; }

/* Big background number */
.step-number {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 4.5rem;
  font-weight: 800;
  color: #6366f1;
  opacity: 0.08;
  line-height: 1;
  letter-spacing: -0.04em;
  user-select: none;
  position: absolute;
  top: -1.5rem;
  left: -0.5rem;
  z-index: 0;
}

/* Step card */
.step-card {
  position: relative;
  z-index: 1;
  background: white;
  border-radius: 1rem;
  padding: 1.75rem;
  box-shadow:
    0 1px 3px rgba(0,0,0,0.06),
    0 4px 16px rgba(99,102,241,0.06);
  border: 1px solid rgba(99,102,241,0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.step-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 4px 8px rgba(0,0,0,0.07),
    0 12px 32px rgba(99,102,241,0.12);
}

/* Icon */
.step-icon-wrap {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  flex-shrink: 0;
}

/* Content */
.step-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.step-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.step-description {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: #64748b;
}

/* Connector arrow */
.step-connector {
  position: absolute;
  right: -1.25rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

/* Mobile: vertical stack, no diagonal */
@media (max-width: 767px) {
  .hiw-steps {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 28rem;
    margin: 0 auto;
  }

  .step-offset-0,
  .step-offset-1,
  .step-offset-2 {
    margin-top: 0;
  }

  .step-connector {
    display: none;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .hiw-section {
    background: #0f172a;
  }

  .hiw-section::before {
    background-image: radial-gradient(circle, #1e293b 1px, transparent 1px);
    opacity: 0.8;
  }

  .hiw-title {
    color: #f1f5f9;
  }

  .step-card {
    background: #1e293b;
    border-color: rgba(99,102,241,0.15);
    box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(99,102,241,0.08);
  }

  .step-title {
    color: #f1f5f9;
  }

  .step-description {
    color: #94a3b8;
  }

  .step-icon-wrap {
    background: linear-gradient(135deg, #1e1b4b, #2e1065);
  }
}
</style>
