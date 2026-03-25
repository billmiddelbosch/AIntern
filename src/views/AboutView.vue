<script setup lang="ts">
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
    <h1 class="text-4xl font-bold text-gray-900">{{ t('about.title') }}</h1>
    <RouterLink to="/" class="text-indigo-600 underline hover:text-indigo-800">
      {{ t('nav.home') }}
    </RouterLink>
  </main>
</template>
