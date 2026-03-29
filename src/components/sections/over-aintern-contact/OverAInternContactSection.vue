<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBookingModal } from '@/composables/useBookingModal'
import { useAnalytics } from '@/composables/useAnalytics'

const { t } = useI18n()
const { openBookingModal } = useBookingModal()
const { trackEvent } = useAnalytics()
</script>

<template>
  <section class="oac-section">
    <div class="oac-container">

      <!-- Two-column body -->
      <div class="oac-body">

        <!-- Left: story + vision -->
        <div class="oac-story">
          <div class="oac-header">
            <span class="oac-eyebrow">{{ t('overAIntern.sectionLabel') }}</span>
            <h2 class="oac-title">{{ t('overAIntern.title') }}</h2>
          </div>

          <div class="oac-story-block">
            <h3 class="oac-story-heading">{{ t('overAIntern.story.heading') }}</h3>
            <p class="oac-story-paragraph">{{ t('overAIntern.story.paragraph1') }}</p>
            <p class="oac-story-paragraph">{{ t('overAIntern.story.paragraph2') }}</p>
          </div>

          <div class="oac-vision-block">
            <h3 class="oac-story-heading">{{ t('overAIntern.vision.heading') }}</h3>
            <blockquote class="oac-vision-quote">{{ t('overAIntern.vision.text') }}</blockquote>
          </div>
        </div>

        <!-- Right: CTA card -->
        <div class="oac-cta-card">
          <!-- Decorative icon -->
          <div class="oac-cta-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 2L20.5 6.5H27V13L31.5 16L27 19V26H20.5L16 30.5L11.5 26H5V19L0.5 16L5 13V6.5H11.5L16 2Z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
              <path d="M11 16.5L14.5 20L21 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <h3 class="oac-cta-heading">{{ t('overAIntern.contact.heading') }}</h3>
          <p class="oac-cta-subtext">{{ t('overAIntern.contact.subtext') }}</p>

          <button class="oac-cta-button" @click="() => { trackEvent('cta_click', { location: 'over_aintern' }); openBookingModal() }">
            {{ t('overAIntern.contact.cta') }}
          </button>

          <div class="oac-cta-divider">
            <span class="oac-cta-or">{{ t('overAIntern.contact.or') }}</span>
          </div>

          <a href="mailto:hello@aintern.nl" class="oac-cta-email">
            {{ t('overAIntern.contact.email') }}
          </a>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
.oac-section {
  padding: 6rem 1rem;
  background: #f8fafc;
  position: relative;
  overflow: hidden;
}

/* Subtle dot pattern — mirrors ResultatenCases */
.oac-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 2rem 2rem;
  opacity: 0.45;
  pointer-events: none;
}

.oac-container {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
}

/* Two-column layout */
.oac-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

/* ---- Left column: story ---- */
.oac-story {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* Header: eyebrow + h2 */
.oac-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.oac-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.oac-eyebrow::before,
.oac-eyebrow::after {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
  opacity: 0.5;
}

.oac-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
  max-width: 28rem;
  margin: 0;
}

/* Story block */
.oac-story-block,
.oac-vision-block {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.oac-story-heading {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.oac-story-paragraph {
  font-size: 1rem;
  line-height: 1.7;
  color: #475569;
  margin: 0;
}

/* Vision pull-quote */
.oac-vision-quote {
  font-size: 1.125rem;
  font-style: italic;
  line-height: 1.65;
  color: #334155;
  margin: 0;
  padding: 1rem 1.25rem;
  border-left: 4px solid #6366f1;
  background: rgba(99, 102, 241, 0.04);
  border-radius: 0 0.5rem 0.5rem 0;
}

/* ---- Right column: CTA card ---- */
.oac-cta-card {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
  border-radius: 1.5rem;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.25rem;
  box-shadow:
    0 20px 40px rgba(79, 70, 229, 0.35),
    0 8px 16px rgba(79, 70, 229, 0.2);
}

/* Decorative badge icon */
.oac-cta-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.oac-cta-heading {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.25;
}

.oac-cta-subtext {
  font-size: 1rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

/* Primary CTA button */
.oac-cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.75rem;
  background: #ffffff;
  color: #4f46e5;
  font-size: 0.9375rem;
  font-weight: 700;
  border-radius: 9999px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  align-self: stretch;
  text-align: center;
}

.oac-cta-button:hover {
  background: #eef2ff;
  color: #3730a3;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

/* Divider with "or" */
.oac-cta-divider {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.75rem;
}

.oac-cta-divider::before,
.oac-cta-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.25);
}

.oac-cta-or {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  flex-shrink: 0;
}

/* Secondary email link */
.oac-cta-email {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  align-self: center;
  transition: color 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 1px;
}

.oac-cta-email:hover {
  color: #ffffff;
  border-bottom-color: rgba(255, 255, 255, 0.8);
}

/* ---- Responsive ---- */
@media (max-width: 1023px) {
  .oac-body {
    grid-template-columns: 1fr;
    gap: 3rem;
  }

  .oac-title {
    max-width: none;
  }
}

@media (max-width: 767px) {
  .oac-section {
    padding: 4rem 1rem;
  }

  .oac-story {
    gap: 2rem;
  }

  .oac-cta-card {
    padding: 2rem 1.5rem;
  }
}
</style>
