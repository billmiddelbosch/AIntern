<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import SectionIntro from './SectionIntro.vue'

  const { t } = useI18n()

  const steps = ['talk', 'nextDay', 'parallel', 'build'] as const
</script>

<template>
  <section id="hoe-werkt-het" class="bg-slate-950 py-20 px-4 sm:px-6 scroll-mt-16">
    <div class="max-w-6xl mx-auto">
      <SectionIntro
        dark
        :eyebrow="t('pivot.home.how.eyebrow')"
        :heading="t('pivot.home.how.heading')"
        :intro="t('pivot.home.how.intro')"
      />
      <ol class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <li
          v-for="(key, index) in steps"
          :key="key"
          class="relative rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          <div class="mb-5 flex items-center gap-3">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 font-heading text-sm font-bold text-white"
            >
              {{ index + 1 }}
            </span>
            <span class="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              {{ t(`pivot.home.how.steps.${key}.tag`) }}
            </span>
          </div>
          <h3 class="font-heading text-lg font-semibold text-white mb-2">
            {{ t(`pivot.home.how.steps.${key}.title`) }}
          </h3>
          <p class="text-sm leading-relaxed text-slate-400">
            {{ t(`pivot.home.how.steps.${key}.body`) }}
          </p>
        </li>
      </ol>
    </div>
  </section>
</template>
