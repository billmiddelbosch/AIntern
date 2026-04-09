<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-semibold text-slate-800">
      {{ t('admin.dashboard.heading') }}
    </h2>
    <p class="mt-1 text-sm text-slate-500">
      {{ t('admin.dashboard.subheading') }}
    </p>

    <!-- Placeholder content card -->
    <div
      class="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
    >
      <p class="text-sm text-slate-400">{{ t('admin.dashboard.placeholder') }}</p>
    </div>
  </div>
</template>
