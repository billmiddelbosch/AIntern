<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import SectionIntro from './SectionIntro.vue'

  const { t } = useI18n()

  const tools = [
    'crm',
    'quotes',
    'planning',
    'hours',
    'invoicing',
    'service',
    'website',
    'mail',
  ] as const
</script>

<template>
  <section class="bg-slate-50 py-20 px-4 sm:px-6">
    <div class="max-w-6xl mx-auto">
      <SectionIntro
        :eyebrow="t('pivot.home.replace.eyebrow')"
        :heading="t('pivot.home.replace.heading')"
        :intro="t('pivot.home.replace.intro')"
      />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="key in tools"
          :key="key"
          class="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-300"
        >
          <h3 class="font-heading font-semibold text-slate-900 mb-1">
            {{ t(`pivot.home.replace.items.${key}.title`) }}
          </h3>
          <p class="text-sm text-slate-500">{{ t(`pivot.home.replace.items.${key}.body`) }}</p>
        </div>
      </div>
      <p class="mt-8 text-center text-sm text-slate-500">{{ t('pivot.home.replace.note') }}</p>
    </div>
  </section>
</template>
