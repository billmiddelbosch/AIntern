<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  mode: 'create' | 'edit'
  status: 'draft' | 'published'
  saving: boolean
  publishing: boolean
  deleting?: boolean
  hasUnsavedPublishedChanges?: boolean
}>()

const emit = defineEmits<{
  'save-draft': []
  publish: []
  back: []
  delete: []
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <div class="flex items-center gap-3">
      <button
        class="text-sm text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
        @click="emit('back')"
      >
        ← {{ t('admin.articleForm.back') }}
      </button>
      <span class="text-slate-200">|</span>
      <h2 class="text-xl font-semibold text-slate-800">
        {{ props.mode === 'create' ? t('admin.articleForm.titleCreate') : t('admin.articleForm.titleEdit') }}
      </h2>
      <span
        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1"
        :class="props.status === 'published'
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-amber-50 text-amber-700 ring-amber-200'"
      >
        {{ t('admin.kennisbank.status.' + props.status) }}
      </span>
      <span
        v-if="props.hasUnsavedPublishedChanges"
        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-orange-200"
      >
        {{ t('admin.articleForm.unsavedChangesWarning') }}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <button
        v-if="props.mode === 'edit'"
        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-600 ring-1 ring-red-200 transition-colors disabled:opacity-50"
        :disabled="props.deleting"
        @click="emit('delete')"
      >
        {{ props.deleting ? t('admin.articleForm.deleting') : t('admin.articleForm.delete') }}
      </button>
      <button
        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
        :disabled="props.saving || props.publishing"
        @click="emit('save-draft')"
      >
        {{ props.saving ? t('admin.articleForm.saving') : t('admin.articleForm.saveDraft') }}
      </button>
      <button
        class="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
        :disabled="props.saving || props.publishing"
        @click="emit('publish')"
      >
        {{ props.publishing ? t('admin.articleForm.publishing') : t('admin.articleForm.publish') }}
      </button>
    </div>
  </div>
</template>
