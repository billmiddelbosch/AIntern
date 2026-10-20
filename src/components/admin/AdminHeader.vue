<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/useAuthStore'

defineProps<{ menuOpen: boolean }>()
defineEmits<{ toggleMenu: [] }>()
const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()

const pageTitle = computed(() =>
  route.meta.title ? t(route.meta.title as string) : t('admin.header.defaultTitle'),
)
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-3 md:gap-4">
    <button
      type="button"
      class="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
      :aria-label="menuOpen ? t('admin.header.closeMenu') : t('admin.header.openMenu')"
      :aria-expanded="menuOpen"
      aria-controls="admin-sidebar"
      data-testid="admin-menu-button"
      @click="$emit('toggleMenu')"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
      </svg>
    </button>
    <h1 class="text-lg font-semibold text-slate-800 flex-1 min-w-0 truncate">{{ pageTitle }}</h1>

    <div class="flex items-center gap-3">
      <span class="hidden sm:inline text-sm text-slate-500">{{ auth.user?.name ?? auth.user?.email }}</span>
      <button
        class="min-h-11 md:min-h-0 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        @click="auth.logout()"
      >
        {{ t('admin.header.logout') }}
      </button>
    </div>
  </header>
</template>
