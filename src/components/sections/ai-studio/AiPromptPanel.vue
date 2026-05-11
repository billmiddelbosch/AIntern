<!--
  AiPromptPanel.vue [MOLECULE]

  Atomic Level: Molecule
  Atomic Rationale: Composes a label, a textarea, a character counter, and a
  generate button into a single "prompt entry" unit. Has a single
  responsibility — capture a natural language instruction and emit a generate
  event. No store or composable imports; all state flows in via props.

  Layout (8pt grid):
  ┌────────────────────────────────────────────────────────┐
  │ Label: "Describe what you want to build"               │ ← text-sm font-medium text-slate-700
  │                                                        │ ← gap 6px (label → input)
  │ ┌────────────────────────────────────────────────────┐ │
  │ │ textarea  — min-h-[96px], resize-y, monospace off  │ │ ← border-slate-200, rounded-lg, p-3
  │ │ placeholder: "e.g. A pricing card with…"           │ │
  │ └────────────────────────────────────────────────────┘ │
  │                                          128 / 500 chars│ ← text-xs text-slate-400, text-right
  │ ┌──────────────────┐  ● Generated        │             │
  │ │  Generate ▶      │  AiGenerationStatus │             │ ← flex items-center gap-3
  │ └──────────────────┘                     │             │ ← button: indigo-600, px-4 py-2
  └────────────────────────────────────────────────────────┘

  Design tokens: primary = indigo, neutral = slate. Button height 36px (py-2).
  Textarea border-slate-200 → focus:border-indigo-400 + focus:ring-2 focus:ring-indigo-100.
-->
<script setup lang="ts">
import { computed } from 'vue'
import AiGenerationStatus from '@/components/ui/AiGenerationStatus.vue'
import type { AiGenerationStatusValue } from '@/components/ui/AiGenerationStatus.vue'

const props = defineProps<{
  modelValue: string
  loading: boolean
  status: AiGenerationStatusValue
  statusMessage?: string
  hasGenerated: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'generate'): void
}>()

const MAX_CHARS = 500
const charCount = computed(() => props.modelValue.length)
const isOverLimit = computed(() => charCount.value > MAX_CHARS)
const canGenerate = computed(
  () => props.modelValue.trim().length >= 10 && !props.loading && !isOverLimit.value,
)
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
    <!-- Label -->
    <label class="block text-sm font-medium text-slate-700" for="ai-prompt">
      Beschrijf wat je wilt bouwen
    </label>

    <!-- Textarea -->
    <textarea
      id="ai-prompt"
      :value="props.modelValue"
      :disabled="props.loading"
      rows="4"
      placeholder="Bijv. een pricing card met een titel, prijs en een CTA knop"
      class="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      style="min-height: 96px"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />

    <!-- Character count -->
    <div class="flex justify-end">
      <span
        class="text-xs"
        :class="isOverLimit ? 'text-red-500 font-medium' : 'text-slate-400'"
      >
        {{ charCount }} / {{ MAX_CHARS }}
      </span>
    </div>

    <!-- Actions row: Generate button + status -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        :disabled="!canGenerate"
        class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        :class="
          canGenerate
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'cursor-not-allowed bg-slate-100 text-slate-400'
        "
        @click="emit('generate')"
      >
        <!-- Spark icon -->
        <svg
          class="w-4 h-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        {{ props.hasGenerated ? 'Regenereren' : 'Genereren' }}
      </button>

      <!-- Inline status atom -->
      <AiGenerationStatus
        :status="props.status"
        :message="props.statusMessage"
      />
    </div>
  </div>
</template>
