<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import SectionIntro from './SectionIntro.vue'

  const { t } = useI18n()

  const pillars = ['own', 'proven', 'safe'] as const
  const icons: Record<(typeof pillars)[number], string> = {
    own: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    proven: 'M13 10V3L4 14h7v7l9-11h-7z',
    safe: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  }
</script>

<template>
  <section class="bg-white py-20 px-4 sm:px-6">
    <div class="max-w-6xl mx-auto">
      <SectionIntro
        :eyebrow="t('pivot.home.pillars.eyebrow')"
        :heading="t('pivot.home.pillars.heading')"
      />
      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-for="key in pillars"
          :key="key"
          class="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/70 to-white p-8"
        >
          <div
            class="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" :d="icons[key]" />
            </svg>
          </div>
          <h3 class="font-heading text-xl font-bold text-slate-900 mb-3">
            {{ t(`pivot.home.pillars.items.${key}.title`) }}
          </h3>
          <p class="text-slate-600 leading-relaxed">
            {{ t(`pivot.home.pillars.items.${key}.body`) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
