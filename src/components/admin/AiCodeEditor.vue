<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { t } = useI18n()

function copyCode(): void {
  navigator.clipboard.writeText(props.modelValue).catch(() => {
    // silent — clipboard API may be unavailable in some contexts
  })
}
</script>

<template>
  <div class="flex flex-col gap-2 h-full">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-slate-700">
        {{ t('admin.aiStudio.codeLabel') }}
      </label>
      <button
        v-if="props.modelValue"
        type="button"
        class="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        @click="copyCode"
      >
        {{ t('admin.aiStudio.copyCode') }}
      </button>
    </div>

    <textarea
      :value="props.modelValue"
      :disabled="props.disabled"
      :placeholder="t('admin.aiStudio.codePlaceholder')"
      spellcheck="false"
      class="flex-1 w-full min-h-[320px] rounded-lg border border-slate-300 bg-slate-950 text-emerald-400 font-mono text-xs px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>
