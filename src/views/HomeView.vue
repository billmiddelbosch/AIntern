<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useCounterStore } from '@/stores/useCounterStore'

  const { t } = useI18n()
  const counter = useCounterStore()
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
    <h1 class="text-4xl font-bold text-gray-900">{{ t('home.title') }}</h1>
    <p class="text-lg text-gray-600">{{ t('home.description') }}</p>

    <div class="flex items-center gap-4">
      <button
        class="rounded bg-gray-200 px-4 py-2 font-semibold hover:bg-gray-300"
        @click="counter.decrement"
      >
        -
      </button>
      <span class="text-2xl font-bold">{{ counter.count }}</span>
      <button
        class="rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
        @click="counter.increment"
      >
        +
      </button>
    </div>
    <p class="text-sm text-gray-500">Double: {{ counter.doubleCount }}</p>

    <RouterLink to="/about" class="text-indigo-600 underline hover:text-indigo-800">
      {{ t('nav.about') }}
    </RouterLink>
  </main>
</template>
