<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProbleemOplossingPairProps } from '@/../product/sections/problemen-oplossingen/types'
import ProbleemOplossingCard from './ProbleemOplossingCard.vue'

const props = defineProps<ProbleemOplossingPairProps>()

const { t, locale } = useI18n()

const content = computed(() =>
  locale.value === 'nl' ? props.pair.nl : props.pair.en
)

// Even index (0-based) → problem left; odd index → problem right (reversed)
const isReversed = computed(() => props.index % 2 !== 0)
</script>

<template>
  <div
    class="poc-pair"
    :class="{ 'poc-pair--reversed': isReversed }"
  >
    <!-- Problem card -->
    <ProbleemOplossingCard
      :title="content.problemTitle"
      :description="content.problemDescription"
      :icon="pair.problemIcon"
      variant="problem"
    >
      <template #label>{{ t('problemsSolutions.problemLabel') }}</template>
    </ProbleemOplossingCard>

    <!-- Divider / arrow -->
    <div class="poc-pair__divider" aria-hidden="true">
      <svg class="poc-pair__arrow" width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path
          d="M6 16 H26 M18 8 L26 16 L18 24"
          stroke="#6366f1"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.5"
        />
      </svg>
    </div>

    <!-- Solution card -->
    <ProbleemOplossingCard
      :title="content.solutionTitle"
      :description="content.solutionDescription"
      :icon="pair.solutionIcon"
      variant="solution"
    >
      <template #label>{{ t('problemsSolutions.solutionLabel') }}</template>
    </ProbleemOplossingCard>
  </div>
</template>

<style scoped>
.poc-pair {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1.25rem;
}

/* Reverse grid order for alternating layout */
.poc-pair--reversed {
  direction: rtl;
}

.poc-pair--reversed > * {
  direction: ltr;
}

/* Divider arrow */
.poc-pair__divider {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.poc-pair__arrow {
  opacity: 0.7;
}

/* Mobile: single column, arrow becomes vertical */
@media (max-width: 767px) {
  .poc-pair {
    grid-template-columns: 1fr;
    direction: ltr;
  }

  .poc-pair--reversed {
    direction: ltr;
  }

  .poc-pair__divider {
    transform: rotate(90deg);
    height: 2rem;
  }
}
</style>
