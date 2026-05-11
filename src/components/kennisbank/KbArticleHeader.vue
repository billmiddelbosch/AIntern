<script setup lang="ts">
defineProps<{
  title: string
  excerpt: string
}>()
</script>

<template>
  <div>
    <h1 class="kb-header__title">{{ title }}</h1>
    <p class="kb-header__excerpt">{{ excerpt }}</p>
    <div class="kb-header__divider" />
  </div>
</template>

<style scoped>
.kb-header__title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.kb-header__excerpt {
  font-size: 1.125rem;
  line-height: 1.7;
  color: #475569;
  font-weight: 400;
  margin-bottom: 0;
}

.kb-header__divider {
  height: 1px;
  background: #e2e8f0;
  margin: 2rem 0;
}
</style>
