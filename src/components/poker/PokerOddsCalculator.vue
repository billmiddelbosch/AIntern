<script setup lang="ts">
import { computed } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import type { Card } from '@/types/poker'
import { usePokerEquity } from '@/composables/usePokerEquity'
import CardSlotRow from './CardSlotRow.vue'
import CardPickerGrid from './CardPickerGrid.vue'
import OpponentCountStepper from './OpponentCountStepper.vue'
import EquityResultBar from './EquityResultBar.vue'

/**
 * PokerOddsCalculator — organism composing the full single-player poker
 * equity calculator: hand + community card slots, the opponent-count
 * stepper, the live equity result, and the card picker used to fill every
 * slot. Owns no state itself — all state lives in `usePokerEquity`.
 */
const { t } = useI18n()

const {
  holeCards,
  flopCards,
  turnCard,
  riverCard,
  numOpponents,
  equity,
  isCalculating,
  usedCards,
  activeStreet,
  activeSlotIndex,
  editingSlot,
  isEditing,
  minOpponents,
  maxOpponents,
  selectCard,
  beginEdit,
  incrementOpponents,
  decrementOpponents,
  resetGame,
} = usePokerEquity()

// Keyboard shortcuts for the opponent count: "/" lowers it by 1, "°" raises it
// by 1. Registered globally (SSR-safe target omitted, per CardPickerGrid) so
// they work regardless of which slot is focused. Ignored while typing in a
// form field or with a modifier held.
useEventListener('keydown', (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (event.metaKey || event.ctrlKey || event.altKey) return

  if (event.key === '/') {
    event.preventDefault()
    decrementOpponents()
  } else if (event.key === '°') {
    event.preventDefault()
    incrementOpponents()
  }
})

// The 5 board slots (flop + turn + river) are rendered as a single combined
// row — simpler for a poker-table layout than three separately-labeled rows.
const boardCards = computed<(Card | null)[]>(() => [
  ...flopCards.value,
  turnCard.value,
  riverCard.value,
])

/** Index within `boardCards` that should be highlighted as "next", or -1. */
const boardActiveIndex = computed<number>(() => {
  switch (activeStreet.value) {
    case 'flop':
      return activeSlotIndex.value
    case 'turn':
      return 3
    case 'river':
      return 4
    default:
      return -1
  }
})

const isHandComplete = computed(() => activeStreet.value === 'done')

// While editing, only the slot being re-selected is highlighted (the normal
// "next slot" hint is suppressed to avoid two competing highlights).
const holeActiveIndex = computed(() =>
  !isEditing.value && activeStreet.value === 'hole' ? activeSlotIndex.value : -1,
)
const holeEditingIndex = computed(() =>
  editingSlot.value?.row === 'hole' ? editingSlot.value.index : -1,
)
const boardEditingIndex = computed(() =>
  editingSlot.value?.row === 'board' ? editingSlot.value.index : -1,
)

// The picker stays open while the hand is complete only if the player is
// mid-edit (re-selecting a card).
const showPicker = computed(() => !isHandComplete.value || isEditing.value)
</script>

<template>
  <div class="space-y-8">
    <div class="text-right">
      <button
        type="button"
        data-testid="new-game-button"
        class="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        @click="resetGame"
      >
        {{ t('pokerOdds.newGame') }}
      </button>
    </div>

    <div class="grid lg:grid-cols-2 gap-8">
      <div class="space-y-6">
        <CardSlotRow
          :label="t('pokerOdds.hand.label')"
          :cards="holeCards"
          :active-index="holeActiveIndex"
          :editing-index="holeEditingIndex"
          data-testid="hole-cards-row"
          @select="beginEdit('hole', $event)"
        />
        <CardSlotRow
          :label="t('pokerOdds.community.label')"
          :cards="boardCards"
          :active-index="isEditing ? -1 : boardActiveIndex"
          :editing-index="boardEditingIndex"
          data-testid="board-cards-row"
          @select="beginEdit('board', $event)"
        />
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {{ t('pokerOdds.opponents.label') }}
          </span>
          <OpponentCountStepper
            v-model="numOpponents"
            :min="minOpponents"
            :max="maxOpponents"
          />
          <span class="text-[11px] text-slate-400">{{ t('pokerOdds.opponents.shortcutHint') }}</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <EquityResultBar :equity="equity" :is-calculating="isCalculating" />
      </div>
    </div>

    <div v-if="showPicker" class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-3">
      <div>
        <h2 class="text-sm font-semibold text-slate-800">{{ t('pokerOdds.picker.heading') }}</h2>
        <p v-if="isEditing" class="text-xs font-semibold text-indigo-600 mt-1">
          {{ t('pokerOdds.picker.editingHint') }}
        </p>
        <p v-else class="text-xs text-slate-400 mt-1">{{ t('pokerOdds.picker.hint') }}</p>
      </div>
      <CardPickerGrid :used-cards="usedCards" :active="showPicker" @pick="selectCard" />
    </div>
    <div v-else class="text-center py-6">
      <p class="text-sm text-slate-500">{{ t('pokerOdds.handComplete') }}</p>
    </div>
  </div>
</template>
