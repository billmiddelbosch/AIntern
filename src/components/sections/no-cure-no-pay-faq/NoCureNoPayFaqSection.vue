<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NoCureNoPayFaqSectionProps } from '@/../product/sections/no-cure-no-pay-faq/types'
import NoCureNoPayProposition from './NoCureNoPayProposition.vue'
import FaqAccordionItem from './FaqAccordionItem.vue'
import { BRAND_COLORS, type BgColor } from '@/lib/brand'

const props = withDefaults(defineProps<NoCureNoPayFaqSectionProps & { bg?: BgColor }>(), { bg: 'dark' })

const { t } = useI18n()

const openIndex = ref(0)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? -1 : index
}
</script>

<template>
  <section id="no-cure-no-pay" class="ncnp-section" :style="{ background: BRAND_COLORS[props.bg] }">
    <div class="ncnp-container">

      <!-- Section header -->
      <div class="ncnp-header">
        <span class="ncnp-eyebrow">{{ t('noCureNoPay.sectionLabel') }}</span>
        <h2 class="ncnp-title">{{ t('noCureNoPay.title') }}</h2>
      </div>

      <!-- Two-column body -->
      <div class="ncnp-body">
        <!-- Left: proposition -->
        <NoCureNoPayProposition />

        <!-- Right: accordion -->
        <div class="ncnp-faq">
          <FaqAccordionItem
            v-for="(faq, index) in faqs"
            :key="faq.id"
            :faq="faq"
            :is-open="openIndex === index"
            @toggle="toggle(index)"
          />
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
.ncnp-section {
  padding: 6rem 1rem;
  position: relative;
  overflow: hidden;
}

/* Radial glow — mirrors ProbleemOplossingSection */
.ncnp-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 20% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 80% 30%, rgba(139, 92, 246, 0.05) 0%, transparent 60%);
  pointer-events: none;
}

.ncnp-container {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
}

/* Header */
.ncnp-header {
  text-align: center;
  margin-bottom: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.ncnp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #818cf8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ncnp-eyebrow::before,
.ncnp-eyebrow::after {
  content: '';
  display: block;
  width: 1.5rem;
  height: 2px;
  background: #818cf8;
  border-radius: 1px;
  opacity: 0.5;
}

.ncnp-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.02em;
  line-height: 1.2;
  max-width: 32rem;
}

/* Two-column body */
.ncnp-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}

/* FAQ accordion column */
.ncnp-faq {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 1023px) {
  .ncnp-body {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
}

@media (max-width: 767px) {
  .ncnp-section {
    padding: 4rem 1rem;
  }

  .ncnp-header {
    margin-bottom: 2.5rem;
  }
}
</style>
