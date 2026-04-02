<script setup lang="ts">
import { ref } from 'vue'
import data from '@/../product/sections/hero-value-proposition/data.json'
import type { MetricCard, AutomatedProcess } from '@/../product/sections/hero-value-proposition/types'
import { HeroSection } from '@/components/sections/hero-value-proposition'
import { useIntakeModal } from '@/composables/useIntakeModal'
import { useAnalytics } from '@/composables/useAnalytics'

defineProps<{ bg?: string }>()

const metricCards = ref(data.metricCards as MetricCard[])
const automatedProcesses = ref(data.automatedProcesses as AutomatedProcess[])

const { openIntakeModal } = useIntakeModal()
const { trackEvent } = useAnalytics()

function handleCtaClick() {
  trackEvent('cta_click', { location: 'hero' })
  openIntakeModal()
}
</script>

<template>
  <HeroSection
    :metric-cards="metricCards"
    :automated-processes="automatedProcesses"
    :bg="bg"
    @cta-click="handleCtaClick"
  />
</template>
