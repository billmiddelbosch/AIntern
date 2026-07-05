<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useHead as useUnhead } from '@unhead/vue'
import { AppShell } from '@/components/shell'
import { useNewsFlow } from '@/composables/useNewsFlow'
import type { NewsFlowIndexEntry } from '@/types/newsflow'

const route = useRoute()
const { loading, error, fetchIndex } = useNewsFlow()

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'

const items = ref<NewsFlowIndexEntry[]>([])

const sortedItems = computed(() =>
  [...items.value].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1)),
)

useUnhead({
  title: 'Nieuws voor MKB — AIntern',
  meta: [
    { name: 'description', content: 'Actueel MKB-nieuws, geanalyseerd door AIntern.' },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'Nieuws voor MKB — AIntern' },
    { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
  ],
  link: [{ rel: 'canonical', href: computed(() => `${SITE_URL}${route.path}`) }],
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(async () => {
  items.value = await fetchIndex()
})
</script>

<template>
  <AppShell>
    <div class="min-h-screen bg-white">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <header class="mb-10">
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-3">Nieuws voor MKB</h1>
          <p class="text-lg text-slate-600">Actueel nieuws, geanalyseerd op wat het betekent voor jouw bedrijf.</p>
        </header>

        <div v-if="loading" class="flex items-center justify-center py-24">
          <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>

        <div v-else-if="error" class="text-center py-24 text-slate-500">
          Kon het nieuwsoverzicht niet laden.
        </div>

        <div v-else-if="sortedItems.length === 0" class="text-center py-24 text-slate-500">
          Er zijn nog geen nieuwsberichten gepubliceerd.
        </div>

        <ul v-else class="space-y-6">
          <li
            v-for="item in sortedItems"
            :key="item.slug"
            class="border-b border-slate-100 pb-6 last:border-0"
          >
            <RouterLink :to="`/newsflow/${item.slug}`" class="block group">
              <p class="text-sm font-medium text-blue-600 uppercase tracking-wide mb-2">
                {{ formatDate(item.publishedAt) }}
              </p>
              <h2 class="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                {{ item.title }}
              </h2>
              <p class="text-slate-600 italic">{{ item.lezersvraag }}</p>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </AppShell>
</template>
