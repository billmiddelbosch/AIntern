<!--
  AiGalleryCard.vue [MOLECULE]

  Atomic Level: Molecule
  Atomic Rationale: Composes a component name heading, instruction excerpt,
  date badge, "active" pill (template only), and two action buttons (Load,
  Delete) into a single gallery-item unit. Single responsibility: display one
  AiGeneratedItem and bubble load/delete events up. No store imports.

  Layout (8pt grid):
  ┌───────────────────────────────────────────────────────┐
  │ PricingCard                            [Actief] ●     │ ← flex justify-between
  │ Create a pricing card with a title, price…            │ ← text-xs text-slate-500 line-clamp-2
  │ ─────────────────────────────────────────────────────  │
  │ src/components/ai-generated/PricingCard.vue           │ ← text-xs text-slate-400 font-mono
  │                    6 mei 2026  [Laden]  [Verwijderen] │ ← flex justify-between items-center
  └───────────────────────────────────────────────────────┘

  Card: bg-white border border-slate-200 rounded-xl p-4
  Hover: hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors
  Delete button: text-red-600, tertiary style to avoid visual noise in the list.
-->
<script setup lang="ts">
import type { AiGeneratedItem } from '@/../product/sections/ai-studio/types'

const props = defineProps<{
  item: AiGeneratedItem
  isActive?: boolean
}>()

const emit = defineEmits<{
  (e: 'load', item: AiGeneratedItem): void
  (e: 'delete', id: string): void
}>()

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(iso))
}

function truncate(str: string, max = 120): string {
  return str.length > max ? str.slice(0, max).trimEnd() + '…' : str
}
</script>

<template>
  <div
    class="group flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
  >
    <!-- Header: name + active badge -->
    <div class="flex items-start justify-between gap-2">
      <span class="text-sm font-semibold text-slate-800 leading-tight break-all">
        {{ props.item.name }}
      </span>
      <span
        v-if="props.isActive"
        class="shrink-0 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
      >
        Actief
      </span>
    </div>

    <!-- Instruction excerpt -->
    <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">
      {{ truncate(props.item.instruction) }}
    </p>

    <!-- File path -->
    <p class="text-xs text-slate-400 font-mono truncate">
      {{ props.item.filePath }}
    </p>

    <!-- Footer: date + actions -->
    <div class="flex items-center justify-between gap-2 pt-0.5 border-t border-slate-100">
      <span class="text-xs text-slate-400">{{ formatDate(props.item.createdAt) }}</span>

      <div class="flex gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          @click="emit('load', props.item)"
        >
          <!-- Download / restore icon -->
          <svg
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
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Laden
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          @click="emit('delete', props.item.id)"
        >
          <!-- Trash icon -->
          <svg
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
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
          </svg>
          Verwijderen
        </button>
      </div>
    </div>
  </div>
</template>
