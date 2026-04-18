<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useKennisbankAdmin } from '@/composables/useKennisbankAdmin'
import type { KennisbankArticle } from '@/composables/useKennisbankAdmin'

const { t } = useI18n()
const router = useRouter()
const { loading, error, articles, fetchArticles } = useKennisbankAdmin()

// Sorting
type SortKey = keyof KennisbankArticle
type SortDir = 'asc' | 'desc'

const sortKey = ref<SortKey>('lastModified')
const sortDir = ref<SortDir>('desc')

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
  currentPage.value = 1
}

const sortedArticles = computed<KennisbankArticle[]>(() => {
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...articles.value].sort((a, b) => {
    const av = a[sortKey.value]
    const bv = b[sortKey.value]
    return av < bv ? -dir : av > bv ? dir : 0
  })
})

// Pagination
const PAGE_SIZE = 15
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(sortedArticles.value.length / PAGE_SIZE)))

const pagedArticles = computed<KennisbankArticle[]>(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedArticles.value.slice(start, start + PAGE_SIZE)
})

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(fetchArticles)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('admin.kennisbank.heading') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t('admin.kennisbank.subheading') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink
          to="/admin/kennisbank/new"
          class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          + {{ t('admin.kennisbank.newArticle') }}
        </RouterLink>
        <button
          class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
          :disabled="loading"
          @click="fetchArticles"
        >
          <span v-if="loading">{{ t('admin.kennisbank.loading') }}</span>
          <span v-else>{{ t('admin.kennisbank.refresh') }}</span>
        </button>
      </div>
    </div>

    <div v-if="error" class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
      {{ t('admin.kennisbank.error') }}
    </div>

    <div v-else-if="loading && articles.length === 0" class="space-y-2">
      <div v-for="n in 5" :key="n" class="h-10 rounded-lg bg-slate-100 animate-pulse" />
    </div>

    <div
      v-else-if="!loading && articles.length === 0"
      class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
    >
      <p class="text-sm text-slate-400">{{ t('admin.kennisbank.empty') }}</p>
    </div>

    <div v-else class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th
              v-for="col in (['title', 'slug', 'status', 'lastModified'] as const)"
              :key="col"
              class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-800 transition-colors"
              @click="toggleSort(col)"
            >
              <span class="inline-flex items-center gap-1">
                {{ t('admin.kennisbank.columns.' + col) }}
                <span v-if="sortKey === col" class="text-indigo-500 text-[10px]">
                  {{ sortDir === 'asc' ? '▲' : '▼' }}
                </span>
                <span v-else class="text-slate-300 text-[10px]">⇅</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="article in pagedArticles"
            :key="article.slug"
            class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
            @click="router.push({ name: 'admin-kennisbank-edit', params: { slug: article.slug } })"
          >
            <td class="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">{{ article.title }}</td>
            <td class="px-4 py-3 text-slate-500 font-mono text-xs max-w-[12rem] truncate">{{ article.slug }}</td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1"
                :class="article.status === 'published' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'"
              >
                {{ t('admin.kennisbank.status.' + article.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{{ formatDate(article.lastModified) }}</td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50"
      >
        <span class="text-xs text-slate-500">
          {{ t('admin.kennisbank.pagination.page') }} {{ currentPage }} {{ t('admin.kennisbank.pagination.of') }} {{ totalPages }}
        </span>
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
            :disabled="currentPage === 1"
            @click="prevPage"
          >{{ t('admin.kennisbank.pagination.prev') }}</button>
          <button
            class="px-3 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >{{ t('admin.kennisbank.pagination.next') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
