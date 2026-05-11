<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiStudioTemplate, AiStudioTemplateId } from '@/types/aiStudio'

const props = defineProps<{
  templates: AiStudioTemplate[]
  selectedTemplateId: AiStudioTemplateId
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select-template', id: AiStudioTemplateId): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white">
    <div>
      <h1 class="text-xl font-semibold text-slate-800">{{ t('admin.aiStudio.heading') }}</h1>
      <p class="text-sm text-slate-500 mt-0.5">{{ t('admin.aiStudio.subheading') }}</p>
    </div>

    <div class="flex items-center gap-2 flex-wrap justify-end">
      <span class="text-xs font-medium text-slate-500 mr-1 hidden sm:inline">
        {{ t('admin.aiStudio.templateLabel') }}:
      </span>
      <button
        v-for="tpl in props.templates"
        :key="tpl.id"
        type="button"
        :disabled="props.loading"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
          props.selectedTemplateId === tpl.id
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          props.loading ? 'opacity-50 cursor-not-allowed' : '',
        ]"
        @click="emit('select-template', tpl.id)"
      >
        {{ tpl.label }}
      </button>
    </div>
  </div>
</template>
