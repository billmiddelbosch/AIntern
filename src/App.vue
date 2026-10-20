<script setup lang="ts">
import { computed, onMounted, Suspense } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useHead } from '@/composables/useHead'
import { useAnalytics } from '@/composables/useAnalytics'
import PublicLayout from '@/layouts/PublicLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import SavingsModal from '@/components/ui/SavingsModal.vue'

useHead()

const { trackPageView } = useAnalytics()
const router = useRouter()

onMounted(async () => {
  trackPageView()
  // Legacy deep link (?booking=1 opened the Calendly modal) → own booking page
  if (new URLSearchParams(window.location.search).get('booking') === '1') {
    await router.isReady()
    void router.replace({ name: 'afspraak' })
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
  <!-- Global modal: any page can open it via useSavingsModal -->
  <SavingsModal />
</template>
