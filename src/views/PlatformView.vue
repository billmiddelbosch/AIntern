<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useHead } from '@unhead/vue'
  import { useRoute } from 'vue-router'
  import { AppShell } from '@/components/shell'
  import SectionIntro from '@/components/sections/pivot/SectionIntro.vue'
  import PivotCtaSection from '@/components/sections/pivot/PivotCtaSection.vue'
  import IntakeModal from '@/components/ui/IntakeModal.vue'
  import { useIntakeModal } from '@/composables/useIntakeModal'
  import { useAnalytics } from '@/composables/useAnalytics'

  const { t, locale } = useI18n()
  const route = useRoute()
  const { openIntakeModal } = useIntakeModal()
  const { trackEvent } = useAnalytics()

  const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'

  useHead({
    title: computed(() => t('pivot.platform.meta.title')),
    meta: [
      { name: 'description', content: computed(() => t('pivot.platform.meta.description')) },
      { property: 'og:title', content: computed(() => t('pivot.platform.meta.title')) },
      { property: 'og:description', content: computed(() => t('pivot.platform.meta.description')) },
      { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
      {
        property: 'og:locale',
        content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')),
      },
      { name: 'twitter:title', content: computed(() => t('pivot.platform.meta.title')) },
      {
        name: 'twitter:description',
        content: computed(() => t('pivot.platform.meta.description')),
      },
    ],
    link: [{ rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) }],
    script: [
      {
        type: 'application/ld+json',
        key: 'platform-product',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'AIntern Platform',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: `${SITE_URL}/platform`,
          description:
            'Platform waarop MKB-bedrijven hun eigen bedrijfssoftware laten bouwen en onderhouden door AI agents. Code, data en hosting blijven eigendom van de klant.',
          offers: {
            '@type': 'Offer',
            price: '99',
            priceCurrency: 'EUR',
            description: 'Vanaf €99 per maand, geen prijs per gebruiker.',
          },
          provider: { '@type': 'Organization', name: 'AIntern', url: SITE_URL },
        }).replace(/</g, '\\u003c'),
      },
    ],
  })

  const principles = ['language', 'chat', 'preview', 'control'] as const
  const screens = [
    'today',
    'processes',
    'ask',
    'changes',
    'knowledge',
    'agents',
    'security',
    'costs',
    'ownership',
  ] as const
  const levels = [
    { key: 'self', dot: 'bg-emerald-400', active: 0 },
    { key: 'ask', dot: 'bg-amber-400', active: 1 },
    { key: 'never', dot: 'bg-rose-400', active: 2 },
  ] as const
  const securityPoints = ['p1', 'p2', 'p3', 'p4'] as const
  const ownershipPoints = ['p1', 'p2', 'p3', 'p4'] as const
  const roles = ['owner', 'employee', 'partner', 'tech'] as const

  function handleCta() {
    trackEvent('cta_click', { location: 'platform-hero' })
    openIntakeModal()
  }
</script>

<template>
  <AppShell>
    <!-- Hero -->
    <section class="relative overflow-hidden bg-slate-950 text-white">
      <div
        class="pointer-events-none absolute inset-0 opacity-60"
        style="
          background: radial-gradient(50% 60% at 50% 0%, rgba(99, 102, 241, 0.35), transparent 70%);
        "
        aria-hidden="true"
      />
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <span
          class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 rounded-full px-3 py-1 mb-6"
        >
          {{ t('pivot.platform.hero.eyebrow') }}
        </span>
        <h1 class="font-heading text-4xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
          {{ t('pivot.platform.hero.headline') }}
        </h1>
        <p class="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
          {{ t('pivot.platform.hero.subtext') }}
        </p>
        <button
          type="button"
          class="px-7 py-4 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors"
          @click="handleCta"
        >
          {{ t('pivot.platform.hero.cta') }}
        </button>
      </div>
    </section>

    <!-- Principles -->
    <section class="bg-white py-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">
        <SectionIntro
          :eyebrow="t('pivot.platform.principles.eyebrow')"
          :heading="t('pivot.platform.principles.heading')"
        />
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            v-for="key in principles"
            :key="key"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-6"
          >
            <h3 class="font-heading text-lg font-semibold text-slate-900 mb-2">
              {{ t(`pivot.platform.principles.items.${key}.title`) }}
            </h3>
            <p class="text-sm leading-relaxed text-slate-600">
              {{ t(`pivot.platform.principles.items.${key}.body`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Screens -->
    <section class="bg-slate-50 py-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">
        <SectionIntro
          :eyebrow="t('pivot.platform.screens.eyebrow')"
          :heading="t('pivot.platform.screens.heading')"
        />
        <div class="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              v-for="key in screens"
              :key="key"
              class="rounded-xl border border-slate-100 p-5 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
            >
              <h3 class="font-heading font-semibold text-slate-900 mb-1">
                {{ t(`pivot.platform.screens.items.${key}.title`) }}
              </h3>
              <p class="text-sm text-slate-500">
                {{ t(`pivot.platform.screens.items.${key}.body`) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Agents with sliders -->
    <section class="bg-slate-950 py-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <SectionIntro
          dark
          :center="false"
          :eyebrow="t('pivot.platform.agents.eyebrow')"
          :heading="t('pivot.platform.agents.heading')"
          :intro="t('pivot.platform.agents.body')"
        />
        <div class="space-y-4" aria-hidden="true">
          <div
            v-for="level in levels"
            :key="level.key"
            class="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="flex items-center gap-2 font-heading font-semibold text-white">
                <span class="h-2.5 w-2.5 rounded-full" :class="level.dot" />
                {{ t(`pivot.platform.agents.levels.${level.key}.label`) }}
              </span>
            </div>
            <div
              class="grid grid-cols-3 gap-1 rounded-lg bg-slate-800 p-1 text-center text-xs font-medium"
            >
              <span
                v-for="(opt, idx) in levels"
                :key="opt.key"
                class="rounded-md py-1.5"
                :class="idx === level.active ? 'bg-indigo-500 text-white' : 'text-slate-400'"
              >
                {{ t(`pivot.platform.agents.levels.${opt.key}.label`) }}
              </span>
            </div>
            <p class="mt-3 text-sm text-slate-400">
              {{ t(`pivot.platform.agents.levels.${level.key}.example`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Security + ownership -->
    <section class="bg-white py-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        <div class="rounded-2xl border border-slate-100 bg-slate-50 p-8">
          <div class="mb-5 flex gap-2" aria-hidden="true">
            <span class="h-4 w-4 rounded-full bg-emerald-400" />
            <span class="h-4 w-4 rounded-full bg-amber-200" />
            <span class="h-4 w-4 rounded-full bg-rose-200" />
          </div>
          <span class="text-xs font-semibold uppercase tracking-widest text-indigo-600">{{
            t('pivot.platform.security.eyebrow')
          }}</span>
          <h2 class="font-heading text-2xl font-bold text-slate-900 mt-2 mb-3">
            {{ t('pivot.platform.security.heading') }}
          </h2>
          <p class="text-slate-600 leading-relaxed mb-5">{{ t('pivot.platform.security.body') }}</p>
          <ul class="space-y-2">
            <li
              v-for="key in securityPoints"
              :key="key"
              class="flex items-start gap-2 text-sm text-slate-700"
            >
              <svg
                class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {{ t(`pivot.platform.security.points.${key}`) }}
            </li>
          </ul>
        </div>
        <div class="rounded-2xl border border-slate-100 bg-slate-50 p-8">
          <span class="text-xs font-semibold uppercase tracking-widest text-indigo-600">{{
            t('pivot.platform.ownership.eyebrow')
          }}</span>
          <h2 class="font-heading text-2xl font-bold text-slate-900 mt-2 mb-3">
            {{ t('pivot.platform.ownership.heading') }}
          </h2>
          <p class="text-slate-600 leading-relaxed mb-5">
            {{ t('pivot.platform.ownership.body') }}
          </p>
          <ul class="space-y-2">
            <li
              v-for="key in ownershipPoints"
              :key="key"
              class="flex items-start gap-2 text-sm text-slate-700"
            >
              <svg
                class="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {{ t(`pivot.platform.ownership.points.${key}`) }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Europe -->
    <section class="bg-white pb-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto rounded-2xl bg-indigo-600 p-8 sm:p-10 text-white">
        <span class="text-xs font-semibold uppercase tracking-widest text-indigo-200">{{
          t('pivot.platform.europe.eyebrow')
        }}</span>
        <h2 class="font-heading text-2xl sm:text-3xl font-bold mt-2 mb-3">
          {{ t('pivot.platform.europe.heading') }}
        </h2>
        <p class="text-indigo-100 max-w-3xl">{{ t('pivot.platform.europe.body') }}</p>
      </div>
    </section>

    <!-- Roles -->
    <section class="bg-slate-50 py-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">
        <SectionIntro
          :eyebrow="t('pivot.platform.roles.eyebrow')"
          :heading="t('pivot.platform.roles.heading')"
        />
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            v-for="key in roles"
            :key="key"
            class="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <h3 class="font-heading text-lg font-semibold text-slate-900 mb-2">
              {{ t(`pivot.platform.roles.items.${key}.title`) }}
            </h3>
            <p class="text-sm text-slate-600">{{ t(`pivot.platform.roles.items.${key}.body`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <PivotCtaSection
      :heading="t('pivot.platform.cta.heading')"
      :subtext="t('pivot.platform.cta.subtext')"
      :button="t('pivot.platform.cta.button')"
      location="platform-cta"
    />
    <IntakeModal />
  </AppShell>
</template>
