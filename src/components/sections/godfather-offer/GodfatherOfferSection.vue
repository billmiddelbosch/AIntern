<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useIntakeModal } from '@/composables/useIntakeModal'
import { BRAND_COLORS, type BgColor } from '@/lib/brand'

const props = withDefaults(defineProps<{ bg?: BgColor }>(), { bg: 'light' })

const { t } = useI18n()
const { openIntakeModal } = useIntakeModal()
</script>

<template>
  <section class="gfo-section" id="het-aanbod" :style="{ background: BRAND_COLORS[props.bg] }">
    <div class="gfo-container">
      <!-- Section label -->
      <span class="gfo-eyebrow">{{ t('godfatherOffer.sectionLabel') }}</span>

      <!-- Heading -->
      <h2 class="gfo-heading">{{ t('godfatherOffer.heading') }}</h2>
      <p class="gfo-intro">{{ t('godfatherOffer.intro') }}</p>

      <!-- Three steps -->
      <div class="gfo-steps">
        <div class="gfo-step">
          <div class="gfo-step__number" aria-hidden="true">1</div>
          <div class="gfo-step__content">
            <h3 class="gfo-step__title">{{ t('godfatherOffer.step1.title') }}</h3>
            <p class="gfo-step__description">{{ t('godfatherOffer.step1.description') }}</p>
          </div>
        </div>

        <div class="gfo-step-connector" aria-hidden="true" />

        <div class="gfo-step">
          <div class="gfo-step__number" aria-hidden="true">2</div>
          <div class="gfo-step__content">
            <h3 class="gfo-step__title">{{ t('godfatherOffer.step2.title') }}</h3>
            <p class="gfo-step__description">{{ t('godfatherOffer.step2.description') }}</p>
          </div>
        </div>

        <div class="gfo-step-connector" aria-hidden="true" />

        <div class="gfo-step">
          <div class="gfo-step__number" aria-hidden="true">3</div>
          <div class="gfo-step__content">
            <h3 class="gfo-step__title">{{ t('godfatherOffer.step3.title') }}</h3>
            <p class="gfo-step__description">{{ t('godfatherOffer.step3.description') }}</p>
          </div>
        </div>
      </div>

      <!-- Scenario cards -->
      <!-- <h3 class="gfo-scenarios-heading">{{ t('godfatherOffer.scenariosHeading') }}</h3> -->

      <div class="gfo-scenarios">
        <!-- Kostenbesparing -->
        <!-- <article class="gfo-card gfo-card--kostenbesparing">
          <div class="gfo-card__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="gfo-card__tag">{{ t('godfatherOffer.scenarios.kostenbesparing.tag') }}</span>
          <h4 class="gfo-card__title">{{ t('godfatherOffer.scenarios.kostenbesparing.title') }}</h4>
          <p class="gfo-card__description">{{ t('godfatherOffer.scenarios.kostenbesparing.description') }}</p>
        </article> -->

        <!-- Tijdswinst -->
        <!-- <article class="gfo-card gfo-card--tijdswinst">
          <div class="gfo-card__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="16 7 22 7 22 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="gfo-card__tag">{{ t('godfatherOffer.scenarios.tijdswinst.tag') }}</span>
          <h4 class="gfo-card__title">{{ t('godfatherOffer.scenarios.tijdswinst.title') }}</h4>
          <p class="gfo-card__description">{{ t('godfatherOffer.scenarios.tijdswinst.description') }}</p>
        </article> -->

        <!-- Gemiste omzet -->
        <!-- <article class="gfo-card gfo-card--omzet">
          <div class="gfo-card__icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="gfo-card__tag">{{ t('godfatherOffer.scenarios.omzet.tag') }}</span>
          <h4 class="gfo-card__title">{{ t('godfatherOffer.scenarios.omzet.title') }}</h4>
          <p class="gfo-card__description">{{ t('godfatherOffer.scenarios.omzet.description') }}</p>
        </article> -->
      </div>

      <!-- CTA -->
      <div class="gfo-cta-wrap">
        <button class="gfo-cta-btn" @click="openIntakeModal">
          {{ t('godfatherOffer.cta') }}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <p class="gfo-cta-sub">{{ t('godfatherOffer.ctaSub') }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.gfo-section {
  padding: 5rem 1rem;
}

.gfo-container {
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

/* Eyebrow */
.gfo-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.gfo-eyebrow::before, 
.gfo-eyebrow::after {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
}

/* Heading */
.gfo-heading {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0;
}

.gfo-intro {
  font-size: 1.0625rem;
  color: #475569;
  text-align: center;
  max-width: 48rem;
  line-height: 1.7;
  margin: 0;
}

/* Steps */
.gfo-steps {
  display: flex;
  align-items: flex-start;
  gap: 0;
  width: 100%;
  max-width: 56rem;
  margin-top: 1rem;
}

.gfo-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 0 1rem;
}

.gfo-step__number {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.125rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}

.gfo-step__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.gfo-step__description {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

.gfo-step-connector {
  flex-shrink: 0;
  width: 3rem;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #a78bfa);
  margin-top: 1.4rem;
  border-radius: 1px;
}

/* Scenarios heading */
.gfo-scenarios-heading {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  margin: 1rem 0 0;
}

/* Scenario cards */
.gfo-scenarios {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  width: 100%;
}

.gfo-card {
  background: white;
  border-radius: 1.25rem;
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gfo-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.07), 0 16px 32px rgba(0,0,0,0.07);
}

.gfo-card__icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gfo-card__tag {
  display: inline-flex;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  width: fit-content;
}

.gfo-card__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  margin: 0;
}

.gfo-card__description {
  font-size: 0.9rem;
  line-height: 1.65;
  color: #64748b;
  margin: 0;
}

/* Kostenbesparing — emerald */
.gfo-card--kostenbesparing .gfo-card__icon {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}
.gfo-card--kostenbesparing .gfo-card__tag {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

/* Tijdswinst — indigo */
.gfo-card--tijdswinst .gfo-card__icon {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}
.gfo-card--tijdswinst .gfo-card__tag {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

/* Omzet — amber */
.gfo-card--omzet .gfo-card__icon {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}
.gfo-card--omzet .gfo-card__tag {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

/* CTA */
.gfo-cta-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}

.gfo-cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: #4f46e5;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.625rem;
  border: none;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(79,70,229,0.35);
}

.gfo-cta-btn:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79,70,229,0.45);
}

.gfo-cta-btn:active {
  transform: translateY(0);
}

.gfo-cta-sub {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0;
  text-align: center;
}

/* Responsive */
@media (max-width: 1023px) {
  .gfo-scenarios {
    grid-template-columns: 1fr;
  }

  .gfo-steps {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .gfo-step-connector {
    width: 2px;
    height: 2rem;
    background: linear-gradient(180deg, #6366f1, #a78bfa);
    margin-top: 0;
  }

  .gfo-step {
    max-width: 32rem;
  }
}

@media (max-width: 767px) and (min-width: 480px) {
  .gfo-scenarios {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .gfo-section {
    background: #0f172a;
  }

  .gfo-heading {
    color: #f1f5f9;
  }

  .gfo-intro {
    color: #94a3b8;
  }

  .gfo-scenarios-heading {
    color: #f1f5f9;
  }

  .gfo-card {
    background: #1e293b;
    border-color: rgba(99, 102, 241, 0.15);
  }

  .gfo-card__title {
    color: #f1f5f9;
  }

  .gfo-step__title {
    color: #f1f5f9;
  }
}
</style>
