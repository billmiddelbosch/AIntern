<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AiStudioHeader from '@/components/admin/AiStudioHeader.vue'
import ComponentBuilder from '@/components/admin/ComponentBuilder.vue'
import AiGalleryPanel from '@/components/admin/AiGalleryPanel.vue'
import { useAiStudio } from '@/composables/useAiStudio'
import type { AiStudioComponent, AiStudioTemplateId } from '@/types/aiStudio'

const { t } = useI18n()

const {
  templates,
  templatesLoading,
  selectedTemplateId,
  fetchTemplates,
  selectTemplate,
  prompt,
  code,
  generating,
  generateError,
  generate,
  saveName,
  saving,
  saveError,
  saveConflict,
  savedId,
  saveComponent,
  galleryItems,
  galleryLoading,
  galleryError,
  fetchGallery,
  loadFromGallery,
} = useAiStudio()

onMounted(() => {
  fetchTemplates()
  fetchGallery()
})

function handleSelectTemplate(id: AiStudioTemplateId): void {
  selectTemplate(id)
}

function handleLoadFromGallery(item: AiStudioComponent): void {
  loadFromGallery(item)
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Page header with template selector -->
    <AiStudioHeader
      :templates="templates"
      :selected-template-id="selectedTemplateId"
      :loading="templatesLoading || generating"
      @select-template="handleSelectTemplate"
    />

    <!-- Body: builder + gallery -->
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Main builder area -->
      <main class="flex-1 overflow-y-auto p-6">
        <div
          v-if="templatesLoading && templates.length === 0"
          class="flex items-center justify-center py-16"
        >
          <span class="text-sm text-slate-400">{{ t('admin.aiStudio.loadingTemplates') }}</span>
        </div>

        <ComponentBuilder
          v-else
          :prompt="prompt"
          :code="code"
          :generating="generating"
          :generate-error="generateError"
          :save-name="saveName"
          :saving="saving"
          :save-error="saveError"
          :save-conflict="saveConflict"
          :saved-id="savedId"
          @update:prompt="prompt = $event"
          @update:code="code = $event"
          @update:save-name="saveName = $event"
          @generate="generate"
          @save="saveComponent"
        />
      </main>

      <!-- Gallery sidebar -->
      <aside class="w-72 shrink-0 border-l border-slate-200 bg-white overflow-hidden flex flex-col">
        <AiGalleryPanel
          :items="galleryItems"
          :loading="galleryLoading"
          :error="galleryError"
          @load="handleLoadFromGallery"
          @refresh="fetchGallery"
        />
      </aside>
    </div>
  </div>
</template>
