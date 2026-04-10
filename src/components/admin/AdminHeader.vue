<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/useAuthStore'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()

const pageTitle = computed(() =>
  route.meta.title ? t(route.meta.title as string) : t('admin.header.defaultTitle'),
)
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4">
    <h1 class="text-lg font-semibold text-slate-800 flex-1">{{ pageTitle }}</h1>

    <div class="flex items-center gap-3">
      <span class="text-sm text-slate-500">{{ auth.user?.name ?? auth.user?.email }}</span>
      <button
        class="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        @click="auth.logout()"
      >
        {{ t('admin.header.logout') }}
      </button>
    </div>
  </header>
</template>
