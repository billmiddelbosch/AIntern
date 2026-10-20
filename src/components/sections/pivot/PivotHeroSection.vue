<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import { useBookingPage } from '@/composables/useBookingPage'
  import { useAnalytics } from '@/composables/useAnalytics'

  const { t } = useI18n()
  const { openBooking } = useBookingPage()
  const { trackEvent } = useAnalytics()

  // Illustrative subscription stack; product names stay generic on purpose.
  const rentedTools = [
    { key: 'crm', price: '€180' },
    { key: 'planning', price: '€140' },
    { key: 'quotes', price: '€95' },
    { key: 'hours', price: '€120' },
    { key: 'service', price: '€165' },
    { key: 'website', price: '€100' },
  ] as const

  function handleCta() {
    trackEvent('cta_click', { location: 'hero' })
    openBooking()
  }

  function scrollToHow() {
    if (typeof document === 'undefined') return
    document.querySelector('#hoe-werkt-het')?.scrollIntoView({ behavior: 'smooth' })
  }
</script>

<template>
  <section class="relative overflow-hidden bg-slate-950 text-white">
    <div
      class="pointer-events-none absolute inset-0 opacity-60"
      style="
        background: radial-gradient(60% 60% at 75% 20%, rgba(99, 102, 241, 0.35), transparent 70%);
      "
      aria-hidden="true"
    />
    <div
      class="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-2 gap-14 items-center"
    >
      <div>
        <span
          class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 rounded-full px-3 py-1 mb-6"
        >
          {{ t('pivot.home.hero.eyebrow') }}
        </span>
        <h1 class="font-heading text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight mb-6">
          {{ t('pivot.home.hero.headline') }}
        </h1>
        <p class="text-lg sm:text-xl text-slate-300 max-w-xl mb-8">
          {{ t('pivot.home.hero.subtext') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            type="button"
            class="px-7 py-4 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
            @click="handleCta"
          >
            {{ t('pivot.home.hero.cta') }}
          </button>
          <button
            type="button"
            class="px-7 py-4 rounded-xl border border-slate-700 text-slate-200 font-semibold hover:border-slate-500 hover:text-white transition-colors"
            @click="scrollToHow"
          >
            {{ t('pivot.home.hero.ctaSecondary') }}
          </button>
        </div>
        <p class="mt-5 text-sm text-slate-400">{{ t('pivot.home.hero.note') }}</p>
      </div>

      <!-- Visual: rented stack vs. owned software -->
      <div class="relative" aria-hidden="true">
        <div class="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <div class="space-y-2.5">
            <div
              v-for="tool in rentedTools"
              :key="tool.key"
              class="flex items-center justify-between rounded-lg bg-slate-800/60 px-4 py-2.5"
            >
              <span class="text-sm text-slate-300">{{
                t(`pivot.home.replace.items.${tool.key}.title`)
              }}</span>
              <span class="font-mono text-sm text-slate-500 line-through">{{ tool.price }}</span>
            </div>
          </div>
          <div class="mt-5 flex items-center justify-between border-t border-slate-800 pt-5">
            <span class="font-mono text-sm text-slate-500 line-through"
              >€800 / {{ t('pivot.home.pricing.perMonth') }}</span
            >
            <span
              class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300"
            >
              {{ t('pivot.home.pricing.from') }} {{ t('pivot.home.pricing.amount') }}
            </span>
          </div>
        </div>
        <div
          class="absolute -bottom-5 -left-4 sm:-left-8 rounded-xl bg-indigo-500 px-4 py-3 shadow-xl"
        >
          <p class="font-heading text-sm font-bold">
            {{ t('pivot.home.pillars.items.own.title') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
