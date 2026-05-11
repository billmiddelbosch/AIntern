<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AiPromptPanel from './AiPromptPanel.vue'
import AiCodeEditor from './AiCodeEditor.vue'
import AiPreviewPane from './AiPreviewPane.vue'
import AiSavePanel from './AiSavePanel.vue'

const props = defineProps<{
  prompt: string
  code: string
  generating: boolean
  generateError: string | null
  saveName: string
  saving: boolean
  saveError: string | null
  saveConflict: boolean
  savedId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:prompt', value: string): void
  (e: 'update:code', value: string): void
  (e: 'update:saveName', value: string): void
  (e: 'generate'): void
  (e: 'save'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <!-- Prompt -->
    <AiPromptPanel
      :model-value="props.prompt"
      :generating="props.generating"
      :error="props.generateError"
      @update:model-value="emit('update:prompt', $event)"
      @generate="emit('generate')"
    />

    <!-- Code + Preview side by side on larger screens -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 flex-1 min-h-0">
      <AiCodeEditor
        :model-value="props.code"
        :disabled="props.generating"
        @update:model-value="emit('update:code', $event)"
      />

      <div class="rounded-xl border border-slate-200 overflow-hidden" style="min-height: 320px">
        <AiPreviewPane :code="props.code" />
      </div>
    </div>

    <!-- Save -->
    <AiSavePanel
      :model-value="props.saveName"
      :saving="props.saving"
      :error="props.saveError"
      :conflict="props.saveConflict"
      :saved-id="props.savedId"
      :has-code="!!props.code.trim()"
      @update:model-value="emit('update:saveName', $event)"
      @save="emit('save')"
    />
  </div>
</template>
