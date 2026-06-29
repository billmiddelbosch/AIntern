<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAInternLoopApi } from '@/composables/useAInternLoopApi'

type Tab = 'agents' | 'paginas' | 'acties'

const activeTab = ref<Tab>('agents')

const { newsFlowPages, loadingNewsFlowPages, fetchNewsFlowPages } = useAInternLoopApi()

function selectTab(tab: Tab): void {
  activeTab.value = tab
  if (tab === 'paginas' || tab === 'acties') {
    void fetchNewsFlowPages()
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatBounce(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

const actiesPages = computed(() =>
  [...newsFlowPages.value]
    .filter((p) => p.recentChanges.length > 0)
    .sort((a, b) => {
      if (!a.recentChangesAt) return 1
      if (!b.recentChangesAt) return -1
      return b.recentChangesAt.localeCompare(a.recentChangesAt)
    }),
)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div>
      <h2 class="text-2xl font-semibold text-slate-800">NewsFlow</h2>
      <p class="mt-1 text-sm text-slate-500">Dagelijks nieuws-naar-landingspagina flywheel</p>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-200 gap-1">
      <button
        v-for="tab in (['agents', 'paginas', 'acties'] as const)"
        :key="tab"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="
          activeTab === tab
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        "
        @click="selectTab(tab)"
      >
        {{ { agents: 'Agents', paginas: "Pagina's", acties: 'Acties' }[tab] }}
      </button>
    </div>

    <!-- Agents tab — placeholder -->
    <div
      v-if="activeTab === 'agents'"
      class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl"
    >
      Agent overzicht (NewsAnalyzer / ContentBuilder / SEOOptimizer) — nog niet geïmplementeerd
      (A-20)
    </div>

    <!-- Paginas tab -->
    <div v-else-if="activeTab === 'paginas'">
      <div class="border border-slate-200 rounded-xl overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Pagina</th>
              <th class="px-4 py-3 text-left font-medium">Gepubliceerd</th>
              <th class="px-4 py-3 text-right font-medium">Pageviews</th>
              <th class="px-4 py-3 text-right font-medium">Bounce</th>
              <th class="px-4 py-3 text-right font-medium">Sessieduur</th>
              <th class="px-4 py-3 text-right font-medium">SEO</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Loading state -->
            <tr v-if="loadingNewsFlowPages">
              <td colspan="6" class="px-4 py-8 text-center text-slate-400">
                <span class="inline-flex gap-1">
                  <span class="animate-bounce">.</span>
                  <span class="animate-bounce [animation-delay:0.15s]">.</span>
                  <span class="animate-bounce [animation-delay:0.3s]">.</span>
                </span>
              </td>
            </tr>
            <!-- Empty state -->
            <tr v-else-if="newsFlowPages.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-slate-400">
                Nog geen gepubliceerde landingspagina's gevonden.
              </td>
            </tr>
            <!-- Data rows -->
            <tr
              v-else
              v-for="page in newsFlowPages"
              :key="page.slug"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-4 py-3">
                <a
                  :href="`https://aintern.nl/newsflow/${page.slug}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-indigo-600 hover:text-indigo-800 underline font-medium"
                >{{ page.title }}</a>
                <p class="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{{ page.lezersvraag }}</p>
              </td>
              <td class="px-4 py-3 text-slate-600 whitespace-nowrap">
                {{ formatDate(page.publishedAt) }}
              </td>
              <td class="px-4 py-3 text-right text-slate-700">
                {{ page.traffic ? page.traffic.pageviews.toLocaleString('nl-NL') : '—' }}
              </td>
              <td class="px-4 py-3 text-right text-slate-700">
                {{ page.traffic ? formatBounce(page.traffic.bounceRate) : '—' }}
              </td>
              <td class="px-4 py-3 text-right text-slate-700">
                {{ page.traffic ? formatDuration(page.traffic.avgSessionDuration) : '—' }}
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-slate-700 font-medium">{{ page.optimizationCount }}×</span>
                <p v-if="page.lastOptimizedAt" class="text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                  {{ formatDate(page.lastOptimizedAt) }}
                </p>
                <p v-else class="text-xs text-slate-400 mt-0.5">nooit</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Acties tab -->
    <div v-else-if="activeTab === 'acties'">
      <!-- Loading state -->
      <div v-if="loadingNewsFlowPages" class="py-12 text-center text-slate-400">
        <span class="inline-flex gap-1">
          <span class="animate-bounce">.</span>
          <span class="animate-bounce [animation-delay:0.15s]">.</span>
          <span class="animate-bounce [animation-delay:0.3s]">.</span>
        </span>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="actiesPages.length === 0"
        class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl"
      >
        Geen recente SEO-acties gevonden.
      </div>

      <!-- Action cards -->
      <div v-else class="space-y-3">
        <div
          v-for="page in actiesPages"
          :key="page.slug"
          class="border border-slate-200 rounded-xl p-4 bg-white"
        >
          <div class="flex items-start justify-between gap-4">
            <a
              :href="`https://aintern.nl/newsflow/${page.slug}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-indigo-600 hover:text-indigo-800 underline font-medium text-sm"
            >{{ page.title }}</a>
            <span v-if="page.recentChangesAt" class="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {{ formatDate(page.recentChangesAt) }}
            </span>
          </div>
          <ul class="mt-2 space-y-1">
            <li
              v-for="(change, i) in page.recentChanges"
              :key="i"
              class="flex items-start gap-2 text-sm text-slate-600"
            >
              <span class="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
              <span>{{ change }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
