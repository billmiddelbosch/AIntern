<template>
  <div class="kb-loading" aria-busy="true">
    <div class="kb-skeleton kb-skeleton--title" />
    <div class="kb-skeleton kb-skeleton--line" />
    <div class="kb-skeleton kb-skeleton--line kb-skeleton--short" />
    <div class="kb-skeleton kb-skeleton--body" />
  </div>
</template>

<style scoped>
.kb-skeleton {
  background: #e2e8f0;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  animation: kb-pulse 1.6s ease-in-out infinite;
}

.kb-skeleton--title { height: 2.5rem; width: 80%; }
.kb-skeleton--line { height: 1rem; }
.kb-skeleton--short { width: 55%; }
.kb-skeleton--body { height: 20rem; margin-top: 2rem; }

@keyframes kb-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
