<script setup lang="ts">
import { AppShell } from '@/components/shell'
import HeroSectionView from '@/views/sections/HeroSectionView.vue'
import HowItWorksSectionView from '@/views/sections/HowItWorksSectionView.vue'
</script>

<template>
  <AppShell>
    <HeroSectionView />
    <HowItWorksSectionView />
    <!-- Additional sections will be added here -->
  </AppShell>
</template>
