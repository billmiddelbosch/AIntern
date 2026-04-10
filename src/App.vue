<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useHead } from '@/composables/useHead'
import { useAnalytics } from '@/composables/useAnalytics'
import PublicLayout from '@/layouts/PublicLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

useHead()

const { trackPageView } = useAnalytics()

onMounted(() => {
  trackPageView()
})

const route = useRoute()

/**
 * Resolve the layout component based on `route.meta.layout`:
 * - 'admin'  → AdminLayout
 * - 'none'   → null (bare RouterView rendered directly)
 * - default  → PublicLayout
 */
const layout = computed(() => {
  if (route.meta.layout === 'admin') return AdminLayout
  if (route.meta.layout === 'none') return null
  return PublicLayout
})
</script>

<template>
  <component :is="layout" v-if="layout">
    <RouterView />
  </component>
  <RouterView v-else />
</template>
