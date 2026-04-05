<script setup lang="ts">
import { AppShell } from '@/components/shell'
import HeroSectionView from '@/views/sections/HeroSectionView.vue'
import HowItWorksSectionView from '@/views/sections/HowItWorksSectionView.vue'
import ProbleemOplossingSectionView from '@/views/sections/ProbleemOplossingSectionView.vue'
import GodfatherOfferSection from '@/components/sections/godfather-offer/GodfatherOfferSection.vue'
import ResultatenCasesSectionView from '@/views/sections/ResultatenCasesSectionView.vue'
import NoCureNoPayFaqSectionView from '@/views/sections/NoCureNoPayFaqSectionView.vue'
import KennisbankTeaserSection from '@/components/sections/kennisbank/KennisbankTeaserSection.vue'
import OverAInternContactSectionView from '@/views/sections/OverAInternContactSectionView.vue'
import BookingModal from '@/components/ui/BookingModal.vue'
import IntakeModal from '@/components/ui/IntakeModal.vue'
</script>

<template>
  <AppShell>
    <HeroSectionView              bg="light" />
    <HowItWorksSectionView     bg="dark" />
    <GodfatherOfferSection        bg="light" />
    <ProbleemOplossingSectionView bg="dark" />
    <ResultatenCasesSectionView   bg="light" />
    <NoCureNoPayFaqSectionView    bg="dark" />
    <OverAInternContactSectionView bg="light" />
    <!-- <KennisbankTeaserSection      bg="dark" /> -->
    <IntakeModal />
    <BookingModal />
  </AppShell>
</template>
