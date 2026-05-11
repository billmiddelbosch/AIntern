<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiStudioComponent } from '@/types/aiStudio'

const props = defineProps<{
  item: AiStudioComponent
}>()

const emit = defineEmits<{
  (e: 'load', item: AiStudioComponent): void
}>()

const { t } = useI18n()

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 hover:border-indigo-300 transition-colors">
    <div class="flex items-start justify-between gap-2">
      <span class="text-sm font-medium text-slate-800 leading-tight">{{ props.item.name }}</span>
      <span class="shrink-0 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
        {{ props.item.templateId }}
      </span>
    </div>

    <p class="text-xs text-slate-500 line-clamp-2">{{ props.item.prompt }}</p>

    <div class="flex items-center justify-between mt-1">
      <span class="text-xs text-slate-400">{{ formatDate(props.item.updatedAt) }}</span>
      <button
        type="button"
        class="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        @click="emit('load', props.item)"
      >
        {{ t('admin.aiStudio.galleryLoad') }}
      </button>
    </div>
  </div>
</template>
