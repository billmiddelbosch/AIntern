<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AiGalleryCard from './AiGalleryCard.vue'
import type { AiStudioComponent } from '@/types/aiStudio'

const props = defineProps<{
  items: AiStudioComponent[]
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'load', item: AiStudioComponent): void
  (e: 'refresh'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
      <h2 class="text-sm font-semibold text-slate-700">{{ t('admin.aiStudio.galleryTitle') }}</h2>
      <button
        type="button"
        :disabled="props.loading"
        class="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors disabled:opacity-50"
        @click="emit('refresh')"
      >
        {{ t('admin.aiStudio.galleryRefresh') }}
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <!-- Loading -->
      <div v-if="props.loading" class="flex items-center justify-center py-8">
        <span class="text-sm text-slate-400">{{ t('admin.aiStudio.galleryLoading') }}</span>
      </div>

      <!-- Error -->
      <div
        v-else-if="props.error"
        role="alert"
        class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
      >
        {{ props.error }}
      </div>

      <!-- Empty -->
      <div
        v-else-if="props.items.length === 0"
        class="flex items-center justify-center py-8"
      >
        <p class="text-sm text-slate-400 text-center">{{ t('admin.aiStudio.galleryEmpty') }}</p>
      </div>

      <!-- Items -->
      <div v-else class="flex flex-col gap-3">
        <AiGalleryCard
          v-for="item in props.items"
          :key="item.id"
          :item="item"
          @load="emit('load', item)"
        />
      </div>
    </div>
  </div>
</template>
