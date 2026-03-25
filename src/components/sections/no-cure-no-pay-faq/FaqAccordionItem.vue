<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FaqItem } from '@/../product/sections/no-cure-no-pay-faq/types'

const props = defineProps<{
  faq: FaqItem
  isOpen: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const { locale } = useI18n()

const content = computed(() => (locale.value === 'nl' ? props.faq.nl : props.faq.en))
</script>

<template>
  <div class="ncnp-faq-item" :class="{ 'ncnp-faq-item--open': isOpen }">
    <button class="ncnp-faq-item__trigger" @click="emit('toggle')" :aria-expanded="isOpen">
      <span class="ncnp-faq-item__question">{{ content.question }}</span>
      <svg
        class="ncnp-faq-item__chevron"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <polyline
          points="6 9 12 15 18 9"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <div class="ncnp-faq-item__body">
      <p class="ncnp-faq-item__answer">{{ content.answer }}</p>
    </div>
  </div>
</template>

<style scoped>
.ncnp-faq-item {
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.ncnp-faq-item--open {
  border-color: rgba(99, 102, 241, 0.4);
  border-left: 3px solid #6366f1;
}

.ncnp-faq-item__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: #f1f5f9;
}

.ncnp-faq-item__trigger:hover .ncnp-faq-item__question {
  color: #e2e8f0;
}

.ncnp-faq-item__question {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: #f1f5f9;
  transition: color 0.15s ease;
}

.ncnp-faq-item--open .ncnp-faq-item__question {
  color: #a5b4fc;
}

.ncnp-faq-item__chevron {
  flex-shrink: 0;
  color: #64748b;
  transition: transform 0.25s ease, color 0.2s ease;
}

.ncnp-faq-item--open .ncnp-faq-item__chevron {
  transform: rotate(180deg);
  color: #6366f1;
}

/* Accordion body — max-height animation */
.ncnp-faq-item__body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.ncnp-faq-item--open .ncnp-faq-item__body {
  max-height: 20rem;
}

.ncnp-faq-item__answer {
  padding: 0 1.5rem 1.25rem;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #94a3b8;
}
</style>
