<script setup lang="ts">
import { ref } from 'vue'
import data from '@/../product/sections/hero-value-proposition/data.json'
import type { MetricCard, AutomatedProcess } from '@/../product/sections/hero-value-proposition/types'
import { HeroSection } from '@/components/sections/hero-value-proposition'
import { useBookingPage } from '@/composables/useBookingPage'
import { useAnalytics } from '@/composables/useAnalytics'
import type { BgColor } from '@/lib/brand'

defineProps<{ bg?: BgColor }>()

const metricCards = ref(data.metricCards as MetricCard[])
const automatedProcesses = ref(data.automatedProcesses as AutomatedProcess[])

const { openBooking } = useBookingPage()
const { trackEvent } = useAnalytics()

function handleCtaClick() {
  trackEvent('cta_click', { location: 'hero' })
  openBooking()
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
