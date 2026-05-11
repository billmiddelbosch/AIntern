<script setup lang="ts">
defineProps<{
  sanitizedContent: string
}>()
</script>

<template>
  <div class="kb-body" v-html="sanitizedContent" />
</template>

<style scoped>
.kb-body {
  font-size: 1rem;
  line-height: 1.8;
  color: #374151;
}

.kb-body :deep(h2) {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.015em;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}

.kb-body :deep(h3) {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  letter-spacing: -0.01em;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.kb-body :deep(p) { margin-bottom: 1.25rem; }

.kb-body :deep(ul),
.kb-body :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1.25rem;
}

.kb-body :deep(li) { margin-bottom: 0.4rem; }

.kb-body :deep(strong) { font-weight: 600; color: #1e293b; }

.kb-body :deep(a) { color: #6366f1; text-decoration: underline; }
.kb-body :deep(a:hover) { color: #4f46e5; }

.kb-body :deep(blockquote) {
  border-left: 3px solid #6366f1;
  padding-left: 1.25rem;
  margin: 1.5rem 0;
  color: #475569;
  font-style: italic;
}
</style>
