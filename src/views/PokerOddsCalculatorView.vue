<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead as useUnhead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/shell/AppShell.vue'
import PokerOddsCalculator from '@/components/poker/PokerOddsCalculator.vue'

const { t, locale } = useI18n()
const route = useRoute()

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'

useUnhead({
  title: computed(() => t('pokerOdds.meta.title')),
  htmlAttrs: { lang: computed(() => locale.value) },
  meta: [
    { name: 'description', content: computed(() => t('pokerOdds.meta.description')) },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: computed(() => t('pokerOdds.meta.title')) },
    { property: 'og:description', content: computed(() => t('pokerOdds.meta.description')) },
    { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
    { property: 'og:locale', content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')) },
  ],
  link: [{ rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) }],
})
</script>

<template>
  <AppShell>
    <div class="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section class="bg-white border-b border-slate-100 py-6 px-4 sm:px-6">
        <div class="max-w-3xl mx-auto text-center">
          <span class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 mb-3">
            {{ t('pokerOdds.eyebrow') }}
          </span>
          <h1 class="font-heading text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-2">
            {{ t('pokerOdds.headline') }}
          </h1>
          <p class="text-sm text-slate-500 max-w-xl mx-auto">
            {{ t('pokerOdds.subtext') }}
          </p>
        </div>
      </section>

      <section class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <PokerOddsCalculator />
      </section>
    </div>
  </AppShell>
</template>
