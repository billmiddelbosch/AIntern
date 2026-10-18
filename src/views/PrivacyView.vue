<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useHead } from '@unhead/vue'
  import { useRoute } from 'vue-router'
  import { AppShell } from '@/components/shell'

  const { t, locale } = useI18n()
  const route = useRoute()

  const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'
  const CONTACT_EMAIL = 'info@aintern.nl'

  useHead({
    title: computed(() => t('pivot.privacy.meta.title')),
    meta: [
      { name: 'description', content: computed(() => t('pivot.privacy.meta.description')) },
      { property: 'og:title', content: computed(() => t('pivot.privacy.meta.title')) },
      { property: 'og:description', content: computed(() => t('pivot.privacy.meta.description')) },
      { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
      {
        property: 'og:locale',
        content: computed(() => (locale.value === 'nl' ? 'nl_NL' : 'en_US')),
      },
    ],
    link: [
      { rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) },
      { rel: 'alternate', type: 'text/markdown', href: '/privacy.md' },
    ],
  })

  const sections = [
    'who',
    'analytics',
    'intake',
    'calendly',
    'email',
    'purpose',
    'sharing',
    'retention',
    'rights',
    'clients',
    'changes',
  ] as const
</script>

<template>
  <AppShell>
    <section class="bg-white pt-28 pb-20 px-4 sm:px-6">
      <article class="max-w-3xl mx-auto">
        <span
          class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 mb-4"
        >
          {{ t('pivot.privacy.eyebrow') }}
        </span>
        <h1 class="font-heading text-3xl sm:text-5xl font-bold leading-tight text-slate-900 mb-4">
          {{ t('pivot.privacy.heading') }}
        </h1>
        <p class="text-lg text-slate-600 mb-2">{{ t('pivot.privacy.intro') }}</p>
        <p class="text-sm text-slate-400 mb-12">{{ t('pivot.privacy.updated') }}</p>

        <section v-for="key in sections" :key="key" class="mb-10">
          <h2 class="font-heading text-xl sm:text-2xl font-semibold text-slate-900 mb-3">
            {{ t(`pivot.privacy.sections.${key}.title`) }}
          </h2>
          <p class="leading-relaxed text-slate-600">
            {{ t(`pivot.privacy.sections.${key}.body`) }}
          </p>
        </section>

        <p class="mt-12 rounded-2xl bg-slate-50 border border-slate-100 p-6 text-slate-700">
          {{ t('pivot.privacy.contact') }}
          <a
            :href="`mailto:${CONTACT_EMAIL}`"
            class="font-medium text-indigo-600 hover:text-indigo-500 underline"
            >{{ CONTACT_EMAIL }}</a
          >
        </p>
      </article>
    </section>
  </AppShell>
</template>
