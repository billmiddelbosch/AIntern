<!--
  AiCodeEditor.vue [MOLECULE]

  Atomic Level: Molecule
  Atomic Rationale: Composes a "Code" label, a monospace textarea, a copy-to-
  clipboard button, and a line-count badge into a single code-entry unit.
  Single responsibility: display and edit raw SFC source. No store or composable
  imports. Plain textarea chosen over Monaco to keep the bundle lean; upgrade
  path is an in-place swap of this molecule.

  Layout (8pt grid):
  ┌─────────────────────────────────────────┐
  │ Code  ●vue           [Copy]             │ ← flex justify-between items-center, mb-2
  ├─────────────────────────────────────────┤
  │                                         │
  │  <script setup lang="ts">              │ ← textarea, font-mono text-xs, h-full
  │  …                                      │
  │                                         │
  └─────────────────────────────────────────┘
  │  312 lines                              │ ← text-xs text-slate-400, px-3 py-1.5
  └─────────────────────────────────────────┘

  Minimum height 320px; grows to fill available space in the builder grid
  via the parent's CSS (h-full on the outer wrapper).
  Tailwind: bg-slate-900 text-slate-100 for the code surface — dark by design,
  contrasting against the surrounding white admin cards.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue: string
  language?: 'vue'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const lineCount = computed(() => {
  if (!props.modelValue) return 0
  return props.modelValue.split('\n').length
})

// Copy to clipboard
const copied = ref(false)
async function copyCode() {
  if (!props.modelValue) return
  try {
    await navigator.clipboard.writeText(props.modelValue)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard API unavailable — silently ignore
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-slate-700">Code</span>
        <span class="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
          .vue
        </span>
      </div>

      <button
        type="button"
        :disabled="!props.modelValue"
        class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
        :class="
          props.modelValue
            ? 'text-slate-600 hover:bg-slate-200'
            : 'cursor-not-allowed text-slate-300'
        "
        :aria-label="copied ? 'Gekopieerd' : 'Kopieer code'"
        @click="copyCode"
      >
        <!-- Clipboard icon -->
        <svg
          v-if="!copied"
          class="w-3.5 h-3.5 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
        <!-- Check icon when copied -->
        <svg
          v-else
          class="w-3.5 h-3.5 shrink-0 text-green-600"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd"
          />
        </svg>
        {{ copied ? 'Gekopieerd' : 'Kopieer' }}
      </button>
    </div>

    <!-- Code textarea — dark surface, monospace -->
    <div class="relative flex-1 bg-slate-900">
      <textarea
        :value="props.modelValue"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        placeholder="<!-- Gegenereerde code verschijnt hier -->"
        class="absolute inset-0 h-full w-full resize-none bg-transparent px-4 py-3 font-mono text-xs leading-relaxed text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <!-- Footer: line count -->
    <div class="shrink-0 bg-slate-900 border-t border-slate-700 px-4 py-1.5 flex items-center justify-between">
      <span class="text-xs text-slate-500">
        {{ lineCount > 0 ? `${lineCount} regels` : 'Leeg' }}
      </span>
      <span class="text-xs text-slate-600 font-mono">Vue 3 SFC</span>
    </div>
  </div>
</template>
