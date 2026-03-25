<script setup lang="ts">
import { ref } from 'vue'
import data from '@/../product/sections/hero-value-proposition/data.json'
import type { MetricCard, AutomatedProcess } from '@/../product/sections/hero-value-proposition/types'
import { HeroSection } from '@/components/sections/hero-value-proposition'

const metricCards = ref(data.metricCards as MetricCard[])
const automatedProcesses = ref(data.automatedProcesses as AutomatedProcess[])

function handleCtaClick() {
  console.log('CTA clicked — scroll to contact')
}
</script>

<template>
  <HeroSection
    :metric-cards="metricCards"
    :automated-processes="automatedProcesses"
    @cta-click="handleCtaClick"
  />
</template>
