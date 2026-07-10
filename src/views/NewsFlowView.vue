<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink, onBeforeRouteUpdate } from 'vue-router'
import { useHead as useUnhead } from '@unhead/vue'
import DOMPurify from 'dompurify'
import { AppShell } from '@/components/shell'
import type { NewsFlowPageContent } from '@/types/newsflow'

const route = useRoute()

const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://aintern.nl'
const NEWSFLOW_BASE_URL =
  import.meta.env.VITE_NEWSFLOW_BASE_URL ?? 'https://aintern-newsflow.s3.eu-west-2.amazonaws.com'

// Fetched at setup-time (awaited) so vite-ssg's renderToString captures the
// resolved content in the pre-rendered HTML — this component is nested under
// the <Suspense> boundary in App.vue, which is required for async setup().
async function loadPage(slug: string): Promise<NewsFlowPageContent | null> {
  if (!slug || !/^[a-z0-9-]{3,80}$/.test(slug)) return null
  try {
    const res = await fetch(`${NEWSFLOW_BASE_URL}/posts/${slug}.json`)
    if (!res.ok) return null
    return (await res.json()) as NewsFlowPageContent
  } catch {
    return null
  }
}

const page = ref<NewsFlowPageContent | null>(await loadPage(route.params.slug as string))
const notFound = computed(() => page.value === null)

// The route component instance is reused when navigating between two
// /newsflow/:slug articles (same matched route, only the param changes), so
// setup() does not re-run — refetch explicitly on param change.
onBeforeRouteUpdate(async (to) => {
  page.value = await loadPage(to.params.slug as string)
})

useUnhead({
  title: computed(() =>
    page.value ? `${page.value.title} — AIntern` : 'Nieuws voor MKB — AIntern',
  ),
  meta: [
    {
      name: 'description',
      content: computed(() => page.value?.metaDescription ?? 'Actueel MKB-nieuws van AIntern.'),
    },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:type', content: 'article' },
    { property: 'og:title', content: computed(() => page.value?.title ?? 'Nieuws voor MKB') },
    {
      property: 'og:description',
      content: computed(() => page.value?.metaDescription ?? ''),
    },
    { property: 'og:url', content: computed(() => `${SITE_URL}${route.path}`) },
    { property: 'og:image', content: `${SITE_URL}/og-image.png` },
    {
      property: 'article:published_time',
      content: computed(() => page.value?.publishedAt ?? ''),
    },
  ],
  script: computed(() =>
    page.value?.schema
      ? [
          {
            type: 'application/ld+json',
            // MED-3: unicode-escape angle brackets so LLM-generated schema cannot break out of the JSON-LD block
            children: JSON.stringify(page.value.schema)
              .split('<').join('\\u003c')
              .split('>').join('\\u003e')
              .split('&').join('\\u0026'),
          },
        ]
      : [],
  ),
})

// HIGH-3: explicit ALLOWED_ATTR + ALLOW_UNKNOWN_PROTOCOLS makes posture version-stable
function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'a', 'br', 'ul', 'li'],
    ALLOWED_ATTR: ['href'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  })
}

// HIGH-1, HIGH-2: validate that LLM-generated URLs use http(s) only
function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <AppShell>
  <div class="min-h-screen bg-white">
    <!-- Not found -->
    <div v-if="notFound" class="max-w-2xl mx-auto px-4 py-32 text-center">
      <h1 class="text-2xl font-bold text-slate-800 mb-4">Pagina niet gevonden</h1>
      <p class="text-slate-600 mb-8">Dit artikel bestaat niet of is verwijderd.</p>
      <RouterLink to="/" class="text-blue-600 hover:underline">← Terug naar AIntern</RouterLink>
    </div>

    <!-- Article -->
    <article v-else-if="page" class="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <!-- Breadcrumb -->
      <nav class="text-sm text-slate-500 mb-8 flex items-center gap-2">
        <RouterLink to="/" class="hover:text-blue-600">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/newsflow" class="hover:text-blue-600">Nieuws</RouterLink>
        <span>/</span>
        <span class="text-slate-700 truncate">{{ page.title }}</span>
      </nav>

      <!-- Header -->
      <header class="mb-10">
        <p class="text-sm font-medium text-blue-600 uppercase tracking-wide mb-3">
          {{ formatDate(page.publishedAt) }}
        </p>
        <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
          {{ page.title }}
        </h1>
        <p class="text-lg text-slate-600 italic">{{ page.lezersvraag }}</p>
      </header>

      <!-- Intro -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="prose prose-slate max-w-none mb-8" v-html="sanitize(page.sections.intro)" />

      <!-- Context -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold text-slate-800 mb-3">Achtergrond</h2>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose prose-slate max-w-none" v-html="sanitize(page.sections.context)" />
      </section>

      <!-- MKB relevance -->
      <section class="bg-blue-50 rounded-xl p-6 mb-8">
        <h2 class="text-xl font-semibold text-slate-800 mb-3">Wat betekent dit voor jouw bedrijf?</h2>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose prose-slate max-w-none" v-html="sanitize(page.sections.mkbRelevantie)" />
      </section>

      <!-- AIntern angle -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold text-slate-800 mb-3">Hoe helpt AIntern?</h2>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="prose prose-slate max-w-none" v-html="sanitize(page.sections.ainternAngle)" />
      </section>

      <!-- FAQ -->
      <section class="mb-10">
        <h2 class="text-2xl font-bold text-slate-800 mb-6">Veelgestelde vragen</h2>
        <dl class="space-y-6">
          <div
            v-for="(item, i) in page.faq"
            :key="i"
            class="border-l-4 border-blue-200 pl-4"
          >
            <dt class="font-semibold text-slate-800 mb-2">{{ item.question }}</dt>
            <dd class="text-slate-600">{{ item.answer }}</dd>
          </div>
        </dl>
      </section>

      <!-- Sources -->
      <section
        v-if="page.sections.bronnen.length > 0"
        class="mb-10 border-t border-slate-100 pt-6"
      >
        <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Bronnen</h3>
        <ul class="space-y-1">
          <li v-for="(bron, i) in page.sections.bronnen" :key="i">
            <a
              v-if="bron.url && isSafeUrl(bron.url)"
              :href="bron.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-blue-600 hover:underline"
            >{{ bron.title }}</a>
            <span v-else class="text-sm text-slate-500">{{ bron.title }}</span>
          </li>
        </ul>
      </section>

      <!-- CTA -->
      <aside class="bg-slate-900 text-white rounded-2xl p-8 text-center">
        <h2 class="text-2xl font-bold mb-2">{{ page.cta.headline }}</h2>
        <p class="text-slate-300 mb-6">{{ page.cta.subtext }}</p>
        <a
          :href="isSafeUrl(page.cta.buttonUrl) ? page.cta.buttonUrl : 'https://aintern.nl/#intake'"
          class="inline-block bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          {{ page.cta.buttonLabel }}
        </a>
      </aside>
    </article>
  </div>
  </AppShell>
</template>
