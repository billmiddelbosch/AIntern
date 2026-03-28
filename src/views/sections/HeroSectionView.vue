<script setup lang="ts">
import { ref } from 'vue'
import data from '@/../product/sections/hero-value-proposition/data.json'
import type { MetricCard, AutomatedProcess } from '@/../product/sections/hero-value-proposition/types'
import { HeroSection } from '@/components/sections/hero-value-proposition'
import { useBookingModal } from '@/composables/useBookingModal'

const metricCards = ref(data.metricCards as MetricCard[])
const automatedProcesses = ref(data.automatedProcesses as AutomatedProcess[])

const { openBookingModal } = useBookingModal()
</script>

<template>
  <HeroSection
    :metric-cards="metricCards"
    :automated-processes="automatedProcesses"
    @cta-click="openBookingModal"
  />
</template>
