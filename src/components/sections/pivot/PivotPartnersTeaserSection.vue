<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
</script>

<template>
  <section class="bg-white py-16 px-4 sm:px-6">
    <div
      class="max-w-5xl mx-auto rounded-3xl bg-indigo-600 px-6 py-12 sm:px-12 flex flex-col md:flex-row md:items-center gap-8 justify-between"
    >
      <div class="max-w-2xl">
        <span class="text-xs font-semibold uppercase tracking-widest text-indigo-200">
          {{ t('pivot.home.partnersTeaser.eyebrow') }}
        </span>
        <h2 class="font-heading text-2xl sm:text-3xl font-bold text-white mt-2 mb-3">
          {{ t('pivot.home.partnersTeaser.heading') }}
        </h2>
        <p class="text-indigo-100">{{ t('pivot.home.partnersTeaser.body') }}</p>
      </div>
      <RouterLink
        to="/partners"
        class="shrink-0 self-start md:self-center px-7 py-4 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
      >
        {{ t('pivot.home.partnersTeaser.cta') }}
      </RouterLink>
    </div>
  </section>
</template>
