<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useHead } from '@/composables/useHead'
import { useAnalytics } from '@/composables/useAnalytics'

useHead()

const { trackPageView } = useAnalytics()

onMounted(() => {
  trackPageView()
})
</script>

<template>
  <RouterView />
</template>
