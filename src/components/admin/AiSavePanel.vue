<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string
  saving: boolean
  error: string | null
  conflict: boolean
  savedId: string | null
  hasCode: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
    <h3 class="text-sm font-medium text-slate-700">{{ t('admin.aiStudio.saveTitle') }}</h3>

    <div class="flex gap-2">
      <input
        type="text"
        :value="props.modelValue"
        :disabled="props.saving"
        :placeholder="t('admin.aiStudio.saveNamePlaceholder')"
        class="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button
        type="button"
        :disabled="props.saving || !props.modelValue.trim() || !props.hasCode"
        class="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        @click="emit('save')"
      >
        {{ props.saving ? t('admin.aiStudio.saving') : t('admin.aiStudio.save') }}
      </button>
    </div>

    <!-- Conflict error -->
    <div
      v-if="props.conflict"
      role="alert"
      class="rounded-lg bg-amber-50 border border-amber-300 px-3 py-2 text-sm text-amber-800"
    >
      {{ t('admin.aiStudio.saveConflict') }}
    </div>

    <!-- General error -->
    <div
      v-else-if="props.error && !props.conflict"
      role="alert"
      class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
    >
      {{ props.error }}
    </div>

    <!-- Success -->
    <div
      v-if="props.savedId"
      role="status"
      class="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700"
    >
      {{ t('admin.aiStudio.saveSuccess') }}
    </div>
  </div>
</template>
