<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <RouterLink to="/kennisbank" class="kb-back">
    <span aria-hidden="true">&larr;</span>
    {{ t('kennisbank.backToKennisbank') }}
  </RouterLink>
</template>

<style scoped>
.kb-back {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6366f1;
  text-decoration: none;
  margin-bottom: 2.5rem;
  transition: gap 0.2s ease;
}

.kb-back:hover {
  gap: 0.625rem;
  text-decoration: underline;
}
</style>
