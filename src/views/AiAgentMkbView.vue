<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead as useUnhead } from '@unhead/vue'
import { useRoute, RouterLink } from 'vue-router'
import { AppShell } from '@/components/shell'
import IntakeModal from '@/components/ui/IntakeModal.vue'
import { useIntakeModal } from '@/composables/useIntakeModal'
import { useAnalytics } from '@/composables/useAnalytics'

const { t, locale } = useI18n()
const route = useRoute()
const { openIntakeModal } = useIntakeModal()
const { trackEvent } = useAnalytics()

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'

useUnhead({
  title: computed(() => t('aiAgentMkb.meta.title')),
  htmlAttrs: { lang: computed(() => locale.value) },
  meta: [
    { name: 'description', content: computed(() => t('aiAgentMkb.meta.description')) },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: computed(() => t('aiAgentMkb.meta.title')) },
    { property: 'og:description', content: computed(() => t('aiAgentMkb.meta.description')) },
    { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
    { property: 'og:locale', content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')) },
    { property: 'og:image', content: `${SITE_URL}/og-image.png` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '627' },
  ],
  link: [{ rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'AI Agent voor MKB — no-cure-no-pay',
        description:
          'AIntern bouwt een op maat gemaakte AI agent voor MKB-bedrijven in Nederland. De agent automatiseert productinvoer, klantemails en offertes — je betaalt pas bij bewezen tijdsbesparing.',
        url: `${SITE_URL}/ai-agent-mkb`,
        inLanguage: 'nl',
        provider: { '@type': 'Organization', name: 'AIntern', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'Netherlands' },
        serviceType: 'AI-procesautomatisering',
        offers: {
          '@type': 'Offer',
          description: 'No-cure-no-pay: betaling start pas na verificatie van de afgesproken succescriteria.',
          price: '0',
          priceCurrency: 'EUR',
        },
      }),
    },
  ],
})

function handleCta(location: string) {
  trackEvent('cta_click', { location })
  openIntakeModal()
}

const useCases = computed(() => [
  {
    tag: t('aiAgentMkb.useCases.productInvoer.tag'),
    title: t('aiAgentMkb.useCases.productInvoer.title'),
    description: t('aiAgentMkb.useCases.productInvoer.description'),
  },
  {
    tag: t('aiAgentMkb.useCases.klantvragen.tag'),
    title: t('aiAgentMkb.useCases.klantvragen.title'),
    description: t('aiAgentMkb.useCases.klantvragen.description'),
  },
  {
    tag: t('aiAgentMkb.useCases.offertes.tag'),
    title: t('aiAgentMkb.useCases.offertes.title'),
    description: t('aiAgentMkb.useCases.offertes.description'),
  },
])

const pricingPoints = computed(() => [
  t('aiAgentMkb.pricing.point1'),
  t('aiAgentMkb.pricing.point2'),
  t('aiAgentMkb.pricing.point3'),
])
</script>

<template>
  <AppShell>
    <div class="min-h-[calc(100vh-4rem)] bg-slate-50">

      <!-- Section 1: Hero -->
      <section class="bg-white border-b border-slate-100 py-16 px-4 sm:px-6">
        <div class="max-w-4xl mx-auto text-center">
          <span class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 mb-4">
            {{ t('aiAgentMkb.hero.eyebrow') }}
          </span>
          <h1 class="font-heading text-3xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
            {{ t('aiAgentMkb.hero.headline') }}
          </h1>
          <p class="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
            {{ t('aiAgentMkb.hero.subtext') }}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              type="button"
              class="px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
              @click="handleCta('hero')"
            >
              {{ t('aiAgentMkb.hero.cta') }}
            </button>
            <p class="text-sm text-slate-400">{{ t('aiAgentMkb.hero.ctaSub') }}</p>
          </div>
        </div>
      </section>

      <!-- Section 2: Wat doet een AI agent -->
      <section class="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12">
          <span class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 mb-4">
            {{ t('aiAgentMkb.what.eyebrow') }}
          </span>
          <h2 class="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            {{ t('aiAgentMkb.what.heading') }}
          </h2>
          <p class="text-slate-600 leading-relaxed text-lg">
            {{ t('aiAgentMkb.what.body') }}
          </p>
        </div>
      </section>

      <!-- Section 3: Use cases -->
      <section class="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <h2 class="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">
          {{ t('aiAgentMkb.useCases.heading') }}
        </h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="(useCase, index) in useCases"
            :key="index"
            class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3"
          >
            <span class="text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 self-start">
              {{ useCase.tag }}
            </span>
            <h3 class="text-lg font-semibold text-slate-800">
              {{ useCase.title }}
            </h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              {{ useCase.description }}
            </p>
          </div>
        </div>
      </section>

      <!-- Section 4: No-cure-no-pay -->
      <section class="bg-white border-t border-b border-slate-100 py-16 px-4 sm:px-6">
        <div class="max-w-3xl mx-auto">
          <div class="text-center mb-8">
            <span class="inline-block text-xs font-semibold uppercase tracking-widest text-emerald-600 bg-emerald-50 rounded-full px-3 py-1 mb-4">
              {{ t('aiAgentMkb.pricing.eyebrow') }}
            </span>
            <h2 class="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {{ t('aiAgentMkb.pricing.heading') }}
            </h2>
            <p class="text-slate-500">{{ t('aiAgentMkb.pricing.intro') }}</p>
          </div>
          <div class="space-y-4">
            <div
              v-for="(point, index) in pricingPoints"
              :key="index"
              class="flex items-start gap-3 bg-slate-50 rounded-xl p-4"
            >
              <span class="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">
                {{ index + 1 }}
              </span>
              <p class="text-slate-700 text-sm leading-relaxed">{{ point }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 5: CTA Block -->
      <section class="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 class="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          {{ t('aiAgentMkb.ctaBlock.heading') }}
        </h2>
        <p class="text-slate-500 mb-8">{{ t('aiAgentMkb.ctaBlock.subtext') }}</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            type="button"
            class="px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm"
            @click="handleCta('cta-block')"
          >
            {{ t('aiAgentMkb.ctaBlock.button') }}
          </button>
          <span class="text-sm text-slate-400">
            {{ t('aiAgentMkb.ctaBlock.orText') }}
            <RouterLink to="/" class="text-indigo-600 hover:underline">
              {{ t('aiAgentMkb.ctaBlock.homeLink') }}
            </RouterLink>
          </span>
        </div>
      </section>

    </div>

    <IntakeModal />
  </AppShell>
</template>
