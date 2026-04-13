<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import mascotNav from '@/assets/brand/mascot-nav.png'

const { t } = useI18n()
</script>

<template>
  <aside class="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
    <!-- Logo area -->
    <div class="h-16 flex items-center px-6 border-b border-slate-100">
      <RouterLink to="/admin" class="flex items-center gap-2">
        <img :src="mascotNav" alt="AIntern" class="h-8 w-auto" />
        <span class="font-semibold text-slate-800 text-sm">AIntern</span>
      </RouterLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 flex flex-col gap-1">
      <RouterLink
        to="/admin"
        :exact-active-class="'bg-indigo-50 text-indigo-600'"
        class="rounded-lg"
      >
        <div
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <!-- squares-2x2 icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>{{ t('admin.nav.dashboard') }}</span>
        </div>
      </RouterLink>

      <RouterLink
        to="/admin/kpi"
        active-class="bg-indigo-50 text-indigo-600"
        class="rounded-lg"
      >
        <div
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <!-- chart-bar icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>{{ t('admin.nav.kpi') }}</span>
        </div>
      </RouterLink>
      <RouterLink
        to="/admin/kennisbank"
        active-class="bg-indigo-50 text-indigo-600"
        class="rounded-lg"
      >
        <div
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <!-- document-text icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>{{ t('admin.nav.kennisbank') }}</span>
        </div>
      </RouterLink>
    </nav>
  </aside>
</template>
