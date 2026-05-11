<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="kb-notfound">
    <h1 class="kb-notfound__title">404</h1>
    <p class="kb-notfound__text">{{ t('kennisbank.articleNotFound') }}</p>
    <RouterLink to="/kennisbank" class="kb-notfound__link">
      {{ t('kennisbank.backToKennisbank') }}
    </RouterLink>
  </div>
</template>

<style scoped>
.kb-notfound {
  text-align: center;
  padding: 5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.kb-notfound__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 5rem;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: -0.04em;
  line-height: 1;
}

.kb-notfound__text {
  font-size: 1.125rem;
  color: #64748b;
}

.kb-notfound__link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1.5rem;
  border-radius: 0.75rem;
  background: #6366f1;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  margin-top: 0.5rem;
  transition: background 0.2s ease;
}

.kb-notfound__link:hover {
  background: #4f46e5;
}
</style>
