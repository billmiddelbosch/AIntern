<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useHead } from '@unhead/vue'
  import { useRoute } from 'vue-router'
  import { AppShell } from '@/components/shell'
  import SectionIntro from '@/components/sections/pivot/SectionIntro.vue'
  import PivotCtaSection from '@/components/sections/pivot/PivotCtaSection.vue'
  import IntakeModal from '@/components/ui/IntakeModal.vue'

  const { t, locale } = useI18n()
  const route = useRoute()

  const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'
  const CONTACT_EMAIL = 'info@aintern.nl'

  useHead({
    title: computed(() => t('pivot.about.meta.title')),
    meta: [
      { name: 'description', content: computed(() => t('pivot.about.meta.description')) },
      { property: 'og:title', content: computed(() => t('pivot.about.meta.title')) },
      { property: 'og:description', content: computed(() => t('pivot.about.meta.description')) },
      { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
      {
        property: 'og:locale',
        content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')),
      },
      { name: 'twitter:title', content: computed(() => t('pivot.about.meta.title')) },
      { name: 'twitter:description', content: computed(() => t('pivot.about.meta.description')) },
    ],
    link: [
      { rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) },
      { rel: 'alternate', type: 'text/markdown', href: '/about.md' },
    ],
    script: [
      {
        type: 'application/ld+json',
        key: 'about-page',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          url: `${SITE_URL}/about`,
          about: {
            '@type': 'Organization',
            name: 'AIntern',
            url: SITE_URL,
            email: CONTACT_EMAIL,
            founder: { '@type': 'Person', name: 'Bill Middelbosch' },
          },
        }).replace(/</g, '\\u003c'),
      },
    ],
  })

  const values = ['own', 'prove', 'language', 'safe', 'fair'] as const
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
          {{ t('pivot.about.hero.eyebrow') }}
        </span>
        <h1 class="font-heading text-4xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
          {{ t('pivot.about.hero.headline') }}
        </h1>
        <p class="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
          {{ t('pivot.about.hero.subtext') }}
        </p>
      </div>
    </section>

    <!-- Why -->
    <section class="bg-white py-20 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto">
        <SectionIntro
          :eyebrow="t('pivot.about.why.eyebrow')"
          :heading="t('pivot.about.why.heading')"
        />
        <div class="space-y-5 text-lg leading-relaxed text-slate-600">
          <p>{{ t('pivot.about.why.body1') }}</p>
          <p>{{ t('pivot.about.why.body2') }}</p>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="bg-slate-50 py-20 px-4 sm:px-6">
      <div class="max-w-6xl mx-auto">
        <SectionIntro
          :eyebrow="t('pivot.about.values.eyebrow')"
          :heading="t('pivot.about.values.heading')"
        />
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="key in values"
            :key="key"
            class="rounded-2xl border border-slate-100 bg-white p-6"
          >
            <h3 class="font-heading text-lg font-semibold text-slate-900 mb-2">
              {{ t(`pivot.about.values.items.${key}.title`) }}
            </h3>
            <p class="text-sm leading-relaxed text-slate-600">
              {{ t(`pivot.about.values.items.${key}.body`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Team -->
    <section class="bg-white py-20 px-4 sm:px-6">
      <div class="max-w-3xl mx-auto">
        <SectionIntro
          :eyebrow="t('pivot.about.team.eyebrow')"
          :heading="t('pivot.about.team.heading')"
        />
        <div class="space-y-5 text-lg leading-relaxed text-slate-600">
          <p>{{ t('pivot.about.team.body1') }}</p>
          <p>{{ t('pivot.about.team.body2') }}</p>
          <p>
            {{ t('pivot.about.team.contact') }}
            <a
              :href="`mailto:${CONTACT_EMAIL}`"
              class="font-medium text-indigo-600 hover:text-indigo-500 underline"
              >{{ CONTACT_EMAIL }}</a
            >
          </p>
        </div>
      </div>
    </section>

    <PivotCtaSection
      :heading="t('pivot.about.cta.heading')"
      :subtext="t('pivot.about.cta.subtext')"
      :button="t('pivot.about.cta.button')"
      :secondary-label="t('pivot.about.cta.secondary')"
      secondary-to="/partners"
      location="about-cta"
    />
    <IntakeModal />
  </AppShell>
</template>
