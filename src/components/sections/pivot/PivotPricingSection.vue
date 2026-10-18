<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useSavingsModal } from '@/composables/useSavingsModal'
  import { useAnalytics } from '@/composables/useAnalytics'

  const { t } = useI18n()
  const { openSavingsModal } = useSavingsModal()
  const { trackEvent } = useAnalytics()

  const points = ['p1', 'p2', 'p3', 'p4'] as const
  const stack = ['small', 'medium', 'large'] as const

  function handleCta() {
    trackEvent('cta_click', { location: 'pricing' })
    openSavingsModal()
  }
</script>

<template>
  <section id="prijs" class="bg-slate-950 py-20 px-4 sm:px-6 scroll-mt-16">
    <div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <span
          class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 rounded-full px-3 py-1 mb-4"
        >
          {{ t('pivot.home.pricing.eyebrow') }}
        </span>
        <h2 class="font-heading text-2xl sm:text-4xl font-bold text-white leading-tight mb-8">
          {{ t('pivot.home.pricing.heading') }}
        </h2>
        <div class="rounded-2xl border border-indigo-500/40 bg-slate-900 p-8">
          <p class="text-slate-400">
            {{ t('pivot.home.pricing.from') }}
            <span class="font-heading text-5xl font-bold text-white mx-1">{{
              t('pivot.home.pricing.amount')
            }}</span>
            {{ t('pivot.home.pricing.perMonth') }}
          </p>
          <ul class="mt-6 space-y-3">
            <li v-for="key in points" :key="key" class="flex items-start gap-3 text-slate-300">
              <svg
                class="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ t(`pivot.home.pricing.points.${key}`) }}</span>
            </li>
          </ul>
          <button
            type="button"
            class="mt-8 w-full sm:w-auto px-7 py-4 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors"
            @click="handleCta"
          >
            {{ t('pivot.home.pricing.cta') }}
          </button>
        </div>
      </div>

      <div>
        <h3 class="font-heading text-lg font-semibold text-white mb-5">
          {{ t('pivot.home.pricing.stackHeading') }}
        </h3>
        <div class="space-y-3">
          <div
            v-for="key in stack"
            :key="key"
            class="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4"
          >
            <span class="text-slate-300">{{ t(`pivot.home.pricing.stack.${key}.label`) }}</span>
            <span class="font-mono font-medium text-rose-300">{{
              t(`pivot.home.pricing.stack.${key}.value`)
            }}</span>
          </div>
        </div>
        <p class="mt-5 text-sm text-slate-400">{{ t('pivot.home.pricing.footnote') }}</p>
      </div>
    </div>
  </section>
</template>
