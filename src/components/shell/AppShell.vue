<script setup lang="ts">
import { onMounted } from 'vue'
import MainNav from '@/components/shell/MainNav.vue'
import AppFooter from '@/components/shell/AppFooter.vue'
import CookieConsentBanner from '@/components/ui/CookieConsentBanner.vue'
import { useConsentStore } from '@/stores/useConsentStore'

const consentStore = useConsentStore()

onMounted(() => {
  consentStore.init()
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <MainNav />
    <main class="flex-1 pt-16">
      <slot />
    </main>
    <AppFooter />
    <CookieConsentBanner />
  </div>
</template>
