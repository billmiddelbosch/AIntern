<script setup lang="ts">
import type { Card } from '@/types/poker'
import PlayingCard from '@/components/ui/PlayingCard.vue'

/**
 * CardSlotRow — labeled row of card slots for one street (hole cards, or
 * the 5-card board). Shows filled cards and empty placeholders, highlighting
 * whichever slot is next to be filled. Filled slots are clickable so the
 * player can re-select (edit) a card they already picked.
 */
withDefaults(
  defineProps<{
    label: string
    cards: (Card | null)[]
    /** Index within `cards` that should be visually highlighted as "next", or -1 for none. */
    activeIndex?: number
    /** Index within `cards` currently being re-selected, or -1 for none. */
    editingIndex?: number
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    activeIndex: -1,
    editingIndex: -1,
    size: 'md',
  },
)

const emit = defineEmits<{
  /** A filled slot was clicked — request to re-select (edit) it. */
  select: [index: number]
}>()

function onSelect(index: number, card: Card | null) {
  if (card) emit('select', index)
}
</script>

<template>
  <div class="space-y-2">
    <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">{{ label }}</p>
    <div class="flex gap-2">
      <PlayingCard
        v-for="(card, index) in cards"
        :key="index"
        :card="card"
        :size="size"
        :interactive="card !== null"
        :highlight="index === activeIndex || index === editingIndex"
        @click="onSelect(index, card)"
      />
    </div>
  </div>
</template>
