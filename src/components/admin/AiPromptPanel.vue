<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string
  generating: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'generate'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-3">
    <label for="ai-prompt" class="text-sm font-medium text-slate-700">
      {{ t('admin.aiStudio.promptLabel') }}
    </label>

    <textarea
      id="ai-prompt"
      :value="props.modelValue"
      :disabled="props.generating"
      :placeholder="t('admin.aiStudio.promptPlaceholder')"
      rows="5"
      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none disabled:opacity-60 disabled:cursor-not-allowed"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />

    <div
      v-if="props.error"
      role="alert"
      class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
    >
      {{ props.error }}
    </div>

    <button
      type="button"
      :disabled="props.generating || !props.modelValue.trim()"
      class="self-end flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      @click="emit('generate')"
    >
      <!-- sparkles icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        :class="props.generating ? 'animate-spin' : ''"
      >
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
        <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z" />
        <path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5L19 2z" />
      </svg>
      <span>
        {{ props.generating ? t('admin.aiStudio.generating') : t('admin.aiStudio.generate') }}
      </span>
    </button>
  </div>
</template>
