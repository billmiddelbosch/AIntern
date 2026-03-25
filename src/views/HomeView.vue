<script setup lang="ts">
import { AppShell } from '@/components/shell'
import HeroSectionView from '@/views/sections/HeroSectionView.vue'
import HowItWorksSectionView from '@/views/sections/HowItWorksSectionView.vue'
import ProbleemOplossingSectionView from '@/views/sections/ProbleemOplossingSectionView.vue'
import ResultatenCasesSectionView from '@/views/sections/ResultatenCasesSectionView.vue'
</script>

<template>
  <AppShell>
    <HeroSectionView />
    <HowItWorksSectionView />
    <ProbleemOplossingSectionView />
    <ResultatenCasesSectionView />
    <!-- Additional sections will be added here -->
  </AppShell>
</template>
