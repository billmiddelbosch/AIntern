<script setup lang="ts">
import { computed, onMounted, Suspense } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useHead } from '@/composables/useHead'
import { useAnalytics } from '@/composables/useAnalytics'
import { useBookingModal } from '@/composables/useBookingModal'
import PublicLayout from '@/layouts/PublicLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

useHead()

const { trackPageView } = useAnalytics()
const { openBookingModal } = useBookingModal()

onMounted(() => {
  trackPageView()
  if (new URLSearchParams(window.location.search).get('booking') === '1') {
    openBookingModal()
  }
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
    <RouterView v-slot="{ Component }">
      <Suspense>
        <component :is="Component" />
        <template #fallback>
          <div class="flex items-center justify-center py-32">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </template>
      </Suspense>
    </RouterView>
  </component>
  <RouterView v-slot="{ Component }" v-else>
    <Suspense>
      <component :is="Component" />
      <template #fallback>
        <div class="flex items-center justify-center py-32">
          <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </template>
    </Suspense>
  </RouterView>
</template>
