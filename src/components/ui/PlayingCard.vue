<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Card } from '@/types/poker'
import { SUIT_SYMBOL } from '@/utils/poker'

/**
 * PlayingCard — visual atom rendering a single playing card face, an empty
 * placeholder slot (card === null), or a compact interactive picker cell.
 *
 * Pure presentational component: no store, composable, or project-specific
 * imports beyond shared types/utils.
 */
const props = withDefaults(
  defineProps<{
    card: Card | null
    size?: 'sm' | 'md' | 'lg'
    /** Renders as a clickable picker cell (hover/focus affordance, emits click). */
    interactive?: boolean
    /** Card is already in play elsewhere — greyed out and unclickable. */
    disabled?: boolean
    /** Visually marks this slot as the next one the player should fill. */
    highlight?: boolean
    /** Keyboard shortcut for this card (e.g. "Ah"), shown as a hint on picker cells. */
    shortcut?: string
  }>(),
  {
    size: 'md',
    interactive: false,
    disabled: false,
    highlight: false,
    shortcut: undefined,
  },
)

const emit = defineEmits<{
  click: []
}>()

const { t } = useI18n()

const isRed = computed(() => props.card?.suit === 'hearts' || props.card?.suit === 'diamonds')

const ariaLabel = computed(() => {
  if (!props.card) return t('pokerOdds.card.emptySlot')
  const suitLabel = t(`pokerOdds.suits.${props.card.suit}`)
  const base = `${props.card.rank} ${t('pokerOdds.card.of')} ${suitLabel}`
  return props.disabled ? `${base} (${t('pokerOdds.card.alreadyInPlay')})` : base
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-9 h-12 text-sm rounded-md'
    case 'lg':
      return 'w-16 h-24 text-2xl rounded-xl'
    default:
      return 'w-12 h-16 text-lg rounded-lg'
  }
})

const suitSymbol = computed(() => (props.card ? SUIT_SYMBOL[props.card.suit] : ''))

function handleClick() {
  if (props.disabled || !props.interactive) return
  emit('click')
}
</script>

<template>
  <button
    type="button"
    :disabled="!interactive || disabled"
    :aria-label="ariaLabel"
    class="relative flex flex-col items-center justify-center border font-heading font-bold select-none transition-all"
    :class="[
      sizeClasses,
      card
        ? 'bg-white border-slate-200 shadow-sm'
        : 'bg-slate-50 border-dashed border-slate-300',
      isRed ? 'text-rose-600' : 'text-slate-900',
      interactive && !disabled ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5' : '',
      disabled ? 'opacity-30 cursor-not-allowed' : '',
      highlight ? 'ring-2 ring-indigo-500 ring-offset-1' : '',
    ]"
    @click="handleClick"
  >
    <template v-if="card">
      <span class="leading-none">{{ card.rank }}</span>
      <span class="leading-none">{{ suitSymbol }}</span>
      <span
        v-if="shortcut"
        class="absolute inset-x-0 bottom-0.5 text-center text-[8px] font-normal uppercase tracking-wide leading-none text-slate-400"
        aria-hidden="true"
        >{{ shortcut }}</span
      >
    </template>
  </button>
</template>
