<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLinkedInPostStore } from '@/stores/useLinkedInPostStore'
import LinkedInPostStatusBadge from '@/components/linkedin/LinkedInPostStatusBadge.vue'
import type { LinkedInPostStatus } from '@/types/linkedinPost'

const { t } = useI18n()
const router = useRouter()
const store = useLinkedInPostStore()

type TabStatus = LinkedInPostStatus | 'all'
const activeTab = ref<TabStatus>('draft')

const tabs: { key: TabStatus; label: string }[] = [
  { key: 'all', label: t('linkedinPosts.tabs.all') },
  { key: 'draft', label: t('linkedinPosts.tabs.draft') },
  { key: 'approved', label: t('linkedinPosts.tabs.approved') },
  { key: 'published', label: t('linkedinPosts.tabs.published') },
  { key: 'archived', label: t('linkedinPosts.tabs.archived') },
]

const filteredPosts = computed(() => {
  if (activeTab.value === 'all') return store.posts
  return store.posts.filter((p) => p.status === activeTab.value)
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(store.loadPosts)
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-slate-800">{{ t('linkedinPosts.heading') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ t('linkedinPosts.subheading') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink
          to="/admin/linkedin/new"
          class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          + {{ t('linkedinPosts.newPost') }}
        </RouterLink>
        <button
          class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
          :disabled="store.loading"
          @click="store.loadPosts"
        >
          <span v-if="store.loading">{{ t('linkedinPosts.loading') }}</span>
          <span v-else>{{ t('linkedinPosts.refresh') }}</span>
        </button>
      </div>
    </div>

    <!-- Status tabs -->
    <div class="flex items-center gap-1 border-b border-slate-200">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-3 py-2 text-sm font-medium transition-colors"
        :class="activeTab === tab.key
          ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
          : 'text-slate-500 hover:text-slate-800'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="store.error" class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
      {{ t('linkedinPosts.error') }}
    </div>

    <div v-else-if="store.loading && store.posts.length === 0" class="space-y-2">
      <div v-for="n in 4" :key="n" class="h-10 rounded-lg bg-slate-100 animate-pulse" />
    </div>

    <div
      v-else-if="!store.loading && filteredPosts.length === 0"
      class="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
    >
      <p class="text-sm text-slate-400">{{ t('linkedinPosts.empty') }}</p>
    </div>

    <div v-else class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {{ t('linkedinPosts.columns.title') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {{ t('linkedinPosts.columns.serie') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {{ t('linkedinPosts.columns.status') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {{ t('linkedinPosts.columns.updatedAt') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="post in filteredPosts"
            :key="post.id"
            class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
            @click="router.push({ name: 'admin-linkedin-edit', params: { id: post.id } })"
          >
            <td class="px-4 py-3 font-medium text-slate-800 max-w-xs">
              <span class="truncate block max-w-xs">{{ post.title }}</span>
              <span v-if="post.episode" class="text-xs text-slate-400 mt-0.5 block">
                {{ t('linkedinPosts.episodeLabel', { n: post.episode }) }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-500 text-xs">{{ post.serie ?? '—' }}</td>
            <td class="px-4 py-3">
              <LinkedInPostStatusBadge :status="post.status" />
            </td>
            <td class="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{{ formatDate(post.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
