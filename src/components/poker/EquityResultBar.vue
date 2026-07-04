<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EquityResult } from '@/types/poker'

/**
 * EquityResultBar — displays the player's win/tie/lose equity as a hero
 * win percentage plus a stacked probability bar. Shows a loading state
 * while a simulation is running, and a neutral empty state before the
 * player has entered their hole cards.
 */
const props = defineProps<{
  equity: EquityResult | null
  isCalculating: boolean
}>()

const { t } = useI18n()

const winPct = computed(() => (props.equity ? Math.round(props.equity.win) : 0))
const tiePct = computed(() => (props.equity ? Math.round(props.equity.tie) : 0))
const losePct = computed(() => (props.equity ? Math.max(0, 100 - winPct.value - tiePct.value) : 0))
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="isCalculating"
      data-testid="equity-calculating"
      class="text-center py-4"
      role="status"
      aria-live="polite"
    >
      <p class="text-sm font-medium text-slate-500 animate-pulse">{{ t('pokerOdds.results.calculating') }}</p>
    </div>

    <div v-else-if="equity" data-testid="equity-result" aria-live="polite">
      <div class="text-center mb-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-1">
          {{ t('pokerOdds.results.win') }}
        </p>
        <p
          data-testid="equity-win-pct"
          class="font-heading text-5xl font-bold text-emerald-600 tabular-nums leading-none"
        >{{ winPct }}%</p>
      </div>

      <div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div class="bg-emerald-500" :style="{ width: `${winPct}%` }" />
        <div class="bg-amber-400" :style="{ width: `${tiePct}%` }" />
        <div class="bg-rose-400" :style="{ width: `${losePct}%` }" />
      </div>

      <div class="flex justify-between text-xs font-medium text-slate-500 mt-2">
        <span>{{ t('pokerOdds.results.win') }} {{ winPct }}%</span>
        <span>{{ t('pokerOdds.results.tie') }} {{ tiePct }}%</span>
        <span>{{ t('pokerOdds.results.lose') }} {{ losePct }}%</span>
      </div>

      <p class="text-center text-xs text-slate-400 mt-2">
        {{ t('pokerOdds.results.simulatedHands', { count: equity.trials.toLocaleString() }) }}
      </p>
    </div>

    <div v-else data-testid="equity-empty-state" class="text-center py-4">
      <p class="text-sm text-slate-400">{{ t('pokerOdds.results.emptyState') }}</p>
    </div>
  </div>
</template>
