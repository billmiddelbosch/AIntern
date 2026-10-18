<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import SectionIntro from './SectionIntro.vue'

  const { t } = useI18n()

  const items = ['perUser', 'lockIn', 'fit'] as const
  const icons: Record<(typeof items)[number], string> = {
    perUser:
      'M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 2a3 3 0 11-6 0 3 3 0 016 0z',
    lockIn:
      'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    fit: 'M4 6h16M4 12h8m-8 6h16',
  }
</script>

<template>
  <section class="bg-white py-20 px-4 sm:px-6">
    <div class="max-w-6xl mx-auto">
      <SectionIntro
        :eyebrow="t('pivot.home.problem.eyebrow')"
        :heading="t('pivot.home.problem.heading')"
        :intro="t('pivot.home.problem.intro')"
      />
      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-for="key in items"
          :key="key"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-7"
        >
          <div
            class="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500"
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
          <h3 class="font-heading text-lg font-semibold text-slate-900 mb-2">
            {{ t(`pivot.home.problem.items.${key}.title`) }}
          </h3>
          <p class="text-slate-600 leading-relaxed">
            {{ t(`pivot.home.problem.items.${key}.body`) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
