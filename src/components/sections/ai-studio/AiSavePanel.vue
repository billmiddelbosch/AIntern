<!--
  AiSavePanel.vue [MOLECULE]

  Atomic Level: Molecule
  Atomic Rationale: Composes a text input (component name), a primary save
  button, an optional "Set as active" toggle (template type only), and a last-
  saved confirmation label into a single "persist" unit. Single responsibility:
  collect a name and emit save/setActive events. No store imports.

  Layout (8pt grid):
  ┌──────────────────────────────────────────────────────────────┐
  │ Component name (PascalCase)                                  │ ← label, text-sm
  │ ┌─────────────────────────────────┐  ┌─────────────────────┐│
  │ │ PricingCard                     │  │  Opslaan in repo    ││ ← flex gap-3
  │ └─────────────────────────────────┘  └─────────────────────┘│
  │ ● Naam moet PascalCase zijn                                  │ ← validation error, text-xs red
  │                                                              │
  │ [template only] □ Instellen als actief kennisbank template  │ ← checkbox row
  │                                                              │
  │ ✓ Opgeslagen als PricingCard.vue                            │ ← success confirmation, text-xs green
  └──────────────────────────────────────────────────────────────┘

  409 conflict: "Een component met deze naam bestaat al — kies een andere naam."
  OQ-5 resolved: no overwrite; user must rename.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AiStudioItemType } from '@/../product/sections/ai-studio/types'

const props = defineProps<{
  type: AiStudioItemType
  saving: boolean
  savedName?: string
  isActive?: boolean
  conflictError?: boolean
}>()

const emit = defineEmits<{
  (e: 'save', name: string): void
  (e: 'setActive'): void
}>()

const name = ref(props.savedName ?? '')

// PascalCase validation: starts with uppercase, only letters and digits
const PASCAL_RE = /^[A-Z][a-zA-Z0-9]+$/
const touched = ref(false)
const isValidName = computed(() => PASCAL_RE.test(name.value.trim()))
const showValidationError = computed(() => touched.value && !isValidName.value && name.value.length > 0)

const canSave = computed(
  () => isValidName.value && !props.saving,
)

const label = computed(() =>
  props.type === 'component' ? 'Componentnaam (PascalCase)' : 'Templatenaam (PascalCase)',
)

const placeholder = computed(() =>
  props.type === 'component' ? 'bijv. PricingCard' : 'bijv. KennisbankArtikelViewMinimal',
)

function handleSave() {
  touched.value = true
  if (!canSave.value) return
  emit('save', name.value.trim())
}
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-slate-700" for="ai-save-name">
        {{ label }}
      </label>

      <!-- Name input + save button row -->
      <div class="flex gap-3">
        <input
          id="ai-save-name"
          v-model="name"
          type="text"
          :placeholder="placeholder"
          :disabled="props.saving"
          class="flex-1 rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          :class="
            showValidationError || props.conflictError
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100 text-red-900'
              : 'border-slate-200 focus:border-indigo-400 text-slate-800'
          "
          @blur="touched = true"
          @keyup.enter="handleSave"
        />

        <button
          type="button"
          :disabled="!canSave"
          class="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          :class="
            canSave
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'cursor-not-allowed bg-slate-100 text-slate-400'
          "
          @click="handleSave"
        >
          <!-- Save / loading state -->
          <svg
            v-if="props.saving"
            class="w-4 h-4 animate-spin shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <svg
            v-else
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
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {{ props.saving ? 'Bezig...' : 'Opslaan in repo' }}
        </button>
      </div>

      <!-- Validation error -->
      <p v-if="showValidationError" class="text-xs text-red-600">
        Naam moet PascalCase zijn (begint met hoofdletter, alleen letters en cijfers).
      </p>

      <!-- 409 conflict error (OQ-5: no overwrite) -->
      <p v-else-if="props.conflictError" class="text-xs text-red-600">
        Een bestand met deze naam bestaat al in de repo — kies een andere naam.
      </p>
    </div>

    <!-- "Set as active" toggle — template type only -->
    <div
      v-if="props.type === 'template' && props.savedName"
      class="flex items-center gap-3 pt-1 border-t border-slate-100"
    >
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          role="switch"
          :aria-checked="props.isActive"
          class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          :class="props.isActive ? 'bg-indigo-600' : 'bg-slate-200'"
          @click="emit('setActive')"
        >
          <span
            class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            :class="props.isActive ? 'translate-x-4' : 'translate-x-0'"
          />
        </button>
        <span class="text-sm text-slate-700">
          Instellen als actief kennisbank template
        </span>
        <span
          v-if="props.isActive"
          class="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600"
        >
          Actief
        </span>
      </div>
    </div>

    <!-- Last saved confirmation -->
    <p
      v-if="props.savedName && !props.saving"
      class="flex items-center gap-1.5 text-xs text-green-700"
    >
      <svg
        class="w-3.5 h-3.5 shrink-0"
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
      Opgeslagen als <strong class="font-medium">{{ props.savedName }}.vue</strong>
    </p>
  </div>
</template>
