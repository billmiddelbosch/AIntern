<script setup lang="ts">
  import { ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import SectionIntro from './SectionIntro.vue'

  const { t } = useI18n()

  const questions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const
  const openKey = ref<string | null>('q1')

  function toggle(key: string) {
    openKey.value = openKey.value === key ? null : key
  }
</script>

<template>
  <section id="faq" class="bg-slate-50 py-20 px-4 sm:px-6 scroll-mt-16">
    <div class="max-w-3xl mx-auto">
      <SectionIntro :eyebrow="t('pivot.home.faq.eyebrow')" :heading="t('pivot.home.faq.heading')" />
      <div class="space-y-3">
        <div
          v-for="key in questions"
          :key="key"
          class="rounded-xl border border-slate-200 bg-white"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            :aria-expanded="openKey === key"
            :aria-controls="`faq-answer-${key}`"
            @click="toggle(key)"
          >
            <span class="font-heading font-semibold text-slate-900">{{
              t(`pivot.home.faq.items.${key}.q`)
            }}</span>
            <svg
              class="h-5 w-5 flex-shrink-0 text-indigo-600 transition-transform"
              :class="{ 'rotate-45': openKey === key }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div
            v-show="openKey === key"
            :id="`faq-answer-${key}`"
            class="px-6 pb-5 text-slate-600 leading-relaxed"
          >
            {{ t(`pivot.home.faq.items.${key}.a`) }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
