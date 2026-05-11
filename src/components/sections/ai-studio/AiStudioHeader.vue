<!--
  AiStudioHeader.vue [MOLECULE]

  Atomic Level: Molecule
  Atomic Rationale: Composes a heading (text primitive) with two tab-switch
  buttons into a single cohesive navigation unit. Single responsibility:
  display the page title and emit a tab-change event. No store or composable
  imports — receives all state via props.

  Design: matches AdminGroeisysteemView tab bar pattern exactly.
  Active tab: indigo-600 text + indigo-500 bottom border (-mb-px trick).
  Inactive tab: slate-500 text, transparent border, hover slate-700.
  8pt grid: px-4 py-2 tabs, gap-1 between tabs.
-->
<script setup lang="ts">
import type { AiStudioItemType } from '@/../product/sections/ai-studio/types'

const props = defineProps<{
  activeTab: AiStudioItemType
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: AiStudioItemType): void
}>()

const TABS: { key: AiStudioItemType; label: string }[] = [
  { key: 'component', label: 'Component Builder' },
  { key: 'template', label: 'Template Builder' },
]
</script>

<template>
  <div>
    <!-- Page heading -->
    <div class="mb-4">
      <h2 class="text-2xl font-semibold text-slate-800">AI Studio</h2>
      <p class="mt-1 text-sm text-slate-500">
        Genereer Vue 3 components en kennisbank templates met Claude AI
      </p>
    </div>

    <!-- Tab switcher — same pattern as AdminGroeisysteemView -->
    <div class="flex border-b border-slate-200 gap-1">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="
          props.activeTab === tab.key
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
        "
        :aria-selected="props.activeTab === tab.key"
        role="tab"
        @click="emit('update:activeTab', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>
