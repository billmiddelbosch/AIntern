<script setup lang="ts">
import { AppShell } from '@/components/shell'
import HeroSectionView from '@/views/sections/HeroSectionView.vue'
import HowItWorksSectionView from '@/views/sections/HowItWorksSectionView.vue'
import ProbleemOplossingSectionView from '@/views/sections/ProbleemOplossingSectionView.vue'
import ResultatenCasesSectionView from '@/views/sections/ResultatenCasesSectionView.vue'
import NoCureNoPayFaqSectionView from '@/views/sections/NoCureNoPayFaqSectionView.vue'
import OverAInternContactSectionView from '@/views/sections/OverAInternContactSectionView.vue'
import BookingModal from '@/components/ui/BookingModal.vue'
</script>

<template>
  <AppShell>
    <HeroSectionView />
    <HowItWorksSectionView />
    <ProbleemOplossingSectionView />
    <ResultatenCasesSectionView />
    <NoCureNoPayFaqSectionView />
    <OverAInternContactSectionView />
    <BookingModal />
  </AppShell>
</template>
