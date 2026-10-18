<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useHead } from '@unhead/vue'
  import { useRoute } from 'vue-router'
  import { AppShell } from '@/components/shell'
  import SectionIntro from '@/components/sections/pivot/SectionIntro.vue'
  import { useBookingModal } from '@/composables/useBookingModal'
  import { useAnalytics } from '@/composables/useAnalytics'

  const { t, locale } = useI18n()
  const route = useRoute()
  const { openBookingModal } = useBookingModal()
  const { trackEvent } = useAnalytics()

  const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'

  useHead({
    title: computed(() => t('pivot.partners.meta.title')),
    meta: [
      { name: 'description', content: computed(() => t('pivot.partners.meta.description')) },
      { property: 'og:title', content: computed(() => t('pivot.partners.meta.title')) },
      { property: 'og:description', content: computed(() => t('pivot.partners.meta.description')) },
      { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
      {
        property: 'og:locale',
        content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')),
      },
      { name: 'twitter:title', content: computed(() => t('pivot.partners.meta.title')) },
      {
        name: 'twitter:description',
        content: computed(() => t('pivot.partners.meta.description')),
      },
    ],
    link: [
      { rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) },
      { rel: 'alternate', type: 'text/markdown', href: '/partners.md' },
    ],
  })

  const who = ['process', 'lean', 'accountants', 'it'] as const
  const get = ['platform', 'method', 'stack', 'demo', 'training'] as const
  const steps = ['s1', 's2', 's3', 's4'] as const
  const earnPoints = ['p1', 'p2', 'p3'] as const

  function bookMeeting(location: string) {
    trackEvent('cta_click', { location })
    openBookingModal()
  }
</script>

<template>
  <AppShell>
    <!-- Hero -->
    <section class="relative overflow-hidden bg-slate-950 text-white">
      <div
        class="pointer-events-none absolute inset-0 opacity-60"
        style="
          background: radial-gradient(
            55% 60% at 80% 10%,
            rgba(99, 102, 241, 0.35),
            transparent 70%
          );
        "
        aria-hidden="true"
      />
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <span
          class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 rounded-full px-3 py-1 mb-6"
        >
          {{ t('pivot.partners.hero.eyebrow') }}
        </span>
        <h1 class="font-heading text-4xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
          {{ t('pivot.partners.hero.headline') }}
        </h1>
        <p class="text-lg sm:text-xl text-slate-300 max-w-2xl mb-8">
          {{ t('pivot.partners.hero.subtext') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
          <button
            type="button"
            class="px-7 py-4 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors"
            @click="bookMeeting('partners-hero')"
          >
            {{ t('pivot.partners.hero.cta') }}
          </button>
          <span class="text-sm text-slate-400">{{ t('pivot.partners.hero.ctaSub') }}</span>
        </div>
      </div>
    </section>

    <!-- Who -->
    <section class="bg-white py-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">
        <SectionIntro
          :eyebrow="t('pivot.partners.who.eyebrow')"
          :heading="t('pivot.partners.who.heading')"
        />
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            v-for="key in who"
            :key="key"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-6"
          >
            <h3 class="font-heading text-lg font-semibold text-slate-900 mb-2">
              {{ t(`pivot.partners.who.items.${key}.title`) }}
            </h3>
            <p class="text-sm leading-relaxed text-slate-600">
              {{ t(`pivot.partners.who.items.${key}.body`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- What you get -->
    <section class="bg-slate-50 py-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">
        <SectionIntro
          :eyebrow="t('pivot.partners.get.eyebrow')"
          :heading="t('pivot.partners.get.heading')"
        />
        <div class="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            v-for="key in get"
            :key="key"
            class="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h3 class="font-heading font-semibold text-slate-900 mb-1">
              {{ t(`pivot.partners.get.items.${key}.title`) }}
            </h3>
            <p class="text-sm text-slate-500">{{ t(`pivot.partners.get.items.${key}.body`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="bg-slate-950 py-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">
        <SectionIntro
          dark
          :eyebrow="t('pivot.partners.how.eyebrow')"
          :heading="t('pivot.partners.how.heading')"
        />
        <ol class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <li
            v-for="(key, index) in steps"
            :key="key"
            class="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >
            <span
              class="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 font-heading text-sm font-bold text-white"
            >
              {{ index + 1 }}
            </span>
            <h3 class="font-heading text-lg font-semibold text-white mb-2">
              {{ t(`pivot.partners.how.steps.${key}.title`) }}
            </h3>
            <p class="text-sm leading-relaxed text-slate-400">
              {{ t(`pivot.partners.how.steps.${key}.body`) }}
            </p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Earnings -->
    <section class="bg-white py-20 px-4 sm:px-6">
      <div
        class="max-w-4xl mx-auto rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/70 to-white p-8 sm:p-12"
      >
        <span class="text-xs font-semibold uppercase tracking-widest text-indigo-600">{{
          t('pivot.partners.earn.eyebrow')
        }}</span>
        <h2 class="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mt-2 mb-4">
          {{ t('pivot.partners.earn.heading') }}
        </h2>
        <p class="text-slate-600 leading-relaxed mb-6">{{ t('pivot.partners.earn.body') }}</p>
        <ul class="grid sm:grid-cols-3 gap-3">
          <li
            v-for="key in earnPoints"
            :key="key"
            class="rounded-xl bg-white border border-slate-100 p-4 text-sm font-medium text-slate-700"
          >
            {{ t(`pivot.partners.earn.points.${key}`) }}
          </li>
        </ul>
      </div>
    </section>

    <!-- Book a meeting -->
    <section id="afspraak" class="bg-slate-950 py-20 px-4 sm:px-6 scroll-mt-16">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
          {{ t('pivot.partners.book.heading') }}
        </h2>
        <p class="text-lg text-slate-400 mb-8">{{ t('pivot.partners.book.subtext') }}</p>
        <button
          type="button"
          class="px-7 py-4 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors"
          @click="bookMeeting('partners-book')"
        >
          {{ t('pivot.partners.book.button') }}
        </button>
      </div>
    </section>

  </AppShell>
</template>
