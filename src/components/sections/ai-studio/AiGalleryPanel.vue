<!--
  AiGalleryPanel.vue [ORGANISM]

  Atomic Level: Organism
  Atomic Rationale: Owns the gallery's collapsible state and renders a list of
  AiGalleryCard molecules. It is an organism because it coordinates multiple
  molecules (cards), manages its own open/collapsed UI state, and handles the
  empty/loading/list rendering logic. No store imports — data flows in via props.

  Layout (8pt grid):
  ┌───────────────────────────────────────────────────────────┐
  │ Eerder gegenereerd  (3)       ▼ Inklappen / ▶ Uitklappen │ ← collapsible header
  ├───────────────────────────────────────────────────────────┤  (only when open)
  │ ┌─────────────────────────────────────────────────────┐   │
  │ │ AiGalleryCard — PricingCard         6 mei 2026      │   │
  │ └─────────────────────────────────────────────────────┘   │
  │ ┌─────────────────────────────────────────────────────┐   │
  │ │ AiGalleryCard — TestimonialCard    6 mei 2026       │   │
  │ └─────────────────────────────────────────────────────┘   │
  │  [Lege staat] "Nog geen items gegenereerd"                │
  └───────────────────────────────────────────────────────────┘

  Gap between cards: 8px (gap-2).
  The panel starts collapsed if there are no items; starts open if items exist.
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import AiGalleryCard from './AiGalleryCard.vue'
import type { AiGeneratedItem } from '@/../product/sections/ai-studio/types'

const props = defineProps<{
  items: AiGeneratedItem[]
  loading: boolean
  activeTemplateName?: string
}>()

const emit = defineEmits<{
  (e: 'load', item: AiGeneratedItem): void
  (e: 'delete', id: string): void
}>()

// Start open when items are present, collapsed when empty
const isOpen = ref(props.items.length > 0)

// Auto-open when items first arrive
watch(() => props.items.length, (len) => {
  if (len > 0 && !isOpen.value) isOpen.value = true
})
</script>

<template>
  <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
    <!-- Collapsible header -->
    <button
      type="button"
      class="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-slate-800">Eerder gegenereerd</span>
        <span
          v-if="props.items.length > 0"
          class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
        >
          {{ props.items.length }}
        </span>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">
          {{ isOpen ? 'Inklappen' : 'Uitklappen' }}
        </span>
        <!-- Chevron icon rotates on expand/collapse -->
        <svg
          class="w-4 h-4 text-slate-400 transition-transform duration-200"
          :class="isOpen ? 'rotate-180' : 'rotate-0'"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </button>

    <!-- Panel body — shown when open -->
    <div v-if="isOpen" class="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100">
      <!-- Loading state -->
      <div v-if="props.loading" class="flex items-center gap-2 py-4 text-slate-400">
        <svg class="w-4 h-4 animate-spin shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span class="text-sm">Gallery laden...</span>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="props.items.length === 0"
        class="py-6 text-center"
      >
        <p class="text-sm text-slate-400">Nog geen items gegenereerd</p>
        <p class="mt-1 text-xs text-slate-300">Gegenereerde en opgeslagen items verschijnen hier</p>
      </div>

      <!-- Gallery cards -->
      <AiGalleryCard
        v-else
        v-for="item in props.items"
        :key="item.id"
        :item="item"
        :is-active="item.name === props.activeTemplateName"
        @load="emit('load', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>
