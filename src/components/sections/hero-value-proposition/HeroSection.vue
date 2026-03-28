<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MetricCard, AutomatedProcess } from '@/../product/sections/hero-value-proposition/types'
import DashboardMockup from './DashboardMockup.vue'

defineProps<{
  metricCards: MetricCard[]
  automatedProcesses: AutomatedProcess[]
}>()

const emit = defineEmits<{
  (e: 'cta-click'): void
}>()

const { t } = useI18n()

function scrollToContact() {
  emit('cta-click')
  const el = document.querySelector('#contact')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function scrollToHowItWorks() {
  const el = document.querySelector('#hoe-werkt-het')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section class="hero">
    <!-- Background decoration -->
    <div class="hero-bg" aria-hidden="true">
      <div class="hero-orb hero-orb-1" />
      <div class="hero-orb hero-orb-2" />
    </div>

    <div class="hero-container">
      <!-- Left: copy -->
      <div class="hero-copy">
        <span class="hero-eyebrow">{{ t('hero.eyebrow') }}</span>

        <h1 class="hero-headline">
          {{ t('hero.headline') }}
        </h1>

        <p class="hero-subtext">
          {{ t('hero.subtext') }}
        </p>

        <div class="hero-actions">
          <button class="btn-primary" @click="scrollToContact">
            {{ t('hero.cta') }}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="btn-secondary" @click="scrollToHowItWorks">
            {{ t('hero.ctaSecondary') }}
          </button>
        </div>

        <div class="hero-social-proof">
          <div class="avatar-stack" aria-hidden="true">
            <div v-for="i in 4" :key="i" class="avatar-placeholder" />
          </div>
          <span>{{ t('hero.socialProof') }}</span>
        </div>
      </div>

      <!-- Right: dashboard mockup -->
      <div class="hero-visual">
        <DashboardMockup
          :metric-cards="metricCards"
          :automated-processes="automatedProcesses"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: 6rem 1rem 5rem;
  min-height: calc(100vh - 4rem);
  display: flex;
  align-items: center;
}

/* Decorative background orbs */
.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
}

.hero-orb-1 {
  width: 40rem;
  height: 40rem;
  background: radial-gradient(circle, #6366f1, transparent 70%);
  top: -10rem;
  right: -8rem;
}

.hero-orb-2 {
  width: 28rem;
  height: 28rem;
  background: radial-gradient(circle, #7c3aed, transparent 70%);
  bottom: -8rem;
  left: -4rem;
}

/* Layout */
.hero-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

/* Copy */
.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-eyebrow::before {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
}

.hero-headline {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(2rem, 4vw, 3.25rem);
  font-weight: 700;
  line-height: 1.15;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.hero-subtext {
  font-size: 1.0625rem;
  line-height: 1.7;
  color: #475569;
  max-width: 36rem;
}

/* Actions */
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 0.625rem;
  border: none;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(79,70,229,0.35);
}

.btn-primary:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79,70,229,0.45);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #475569;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.75rem 0.25rem;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  transition: color 0.15s, text-decoration-color 0.15s;
}

.btn-secondary:hover {
  color: #4f46e5;
  text-decoration-color: #4f46e5;
}

/* Social proof */
.hero-social-proof {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.avatar-stack {
  display: flex;
}

.avatar-placeholder {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid white;
  background: linear-gradient(135deg, #818cf8, #a78bfa);
  margin-left: -0.5rem;
}

.avatar-placeholder:first-child {
  margin-left: 0;
}

/* Visual */
.hero-visual {
  width: 100%;
}

/* Responsive */
@media (max-width: 1023px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .hero {
    padding: 5rem 1rem 4rem;
    min-height: auto;
  }

  .hero-visual {
    max-width: 32rem;
    margin: 0 auto;
    width: 100%;
  }

}

@media (max-width: 639px) {
  .hero-headline {
    font-size: 1.875rem;
  }

  .hero-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .hero-headline {
    color: #f1f5f9;
  }

  .hero-subtext {
    color: #94a3b8;
  }

  .hero-orb-1 { opacity: 0.18; }
  .hero-orb-2 { opacity: 0.14; }

  .avatar-placeholder {
    border-color: #1e293b;
  }
}
</style>
