<script setup lang="ts">
import { AppShell } from '@/components/shell'
import HeroSectionView from '@/views/sections/HeroSectionView.vue'
import HowItWorksSectionView from '@/views/sections/HowItWorksSectionView.vue'
import ProbleemOplossingSectionView from '@/views/sections/ProbleemOplossingSectionView.vue'
import ResultatenCasesSectionView from '@/views/sections/ResultatenCasesSectionView.vue'
import NoCureNoPayFaqSectionView from '@/views/sections/NoCureNoPayFaqSectionView.vue'
</script>

<template>
  <AppShell>
    <HeroSectionView />
    <HowItWorksSectionView />
    <ProbleemOplossingSectionView />
    <ResultatenCasesSectionView />
    <NoCureNoPayFaqSectionView />
    <!-- Additional sections will be added here -->
  </AppShell>
</template>
