<script setup lang="ts">
import { AppShell } from '@/components/shell'
import HeroSectionView from '@/views/sections/HeroSectionView.vue'
import HowItWorksSectionView from '@/views/sections/HowItWorksSectionView.vue'
import ProbleemOplossingSectionView from '@/views/sections/ProbleemOplossingSectionView.vue'
import GodfatherOfferSection from '@/components/sections/godfather-offer/GodfatherOfferSection.vue'
import ResultatenCasesSectionView from '@/views/sections/ResultatenCasesSectionView.vue'
import NoCureNoPayFaqSectionView from '@/views/sections/NoCureNoPayFaqSectionView.vue'
import OverAInternContactSectionView from '@/views/sections/OverAInternContactSectionView.vue'
import BookingModal from '@/components/ui/BookingModal.vue'
import IntakeModal from '@/components/ui/IntakeModal.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <AppShell>
    <HeroSectionView              bg="light" />
    <HowItWorksSectionView     bg="dark" />
    <GodfatherOfferSection        bg="light" />
    <ProbleemOplossingSectionView bg="dark" />

    <!-- B-54: AI Workflow Scanner CTA -->
    <section class="py-16 bg-indigo-600">
      <div class="max-w-4xl mx-auto px-6 text-center space-y-4">
        <h2 class="text-2xl font-bold text-white">Hoeveel tijd verlies jij aan handmatig werk?</h2>
        <p class="text-indigo-200 max-w-xl mx-auto">
          Doe de gratis AI Workflow Scan en ontdek in 3 minuten je top-3 knelpunten + concrete aanbevelingen.
        </p>
        <RouterLink
          to="/workflow-scan"
          class="inline-block mt-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
        >
          Scan je workflow gratis →
        </RouterLink>
      </div>
    </section>

    <ResultatenCasesSectionView   bg="light" />
    <NoCureNoPayFaqSectionView    bg="dark" />
    <OverAInternContactSectionView bg="light" />
    <!-- <KennisbankTeaserSection      bg="dark" /> -->
    <IntakeModal />
    <BookingModal />
  </AppShell>
</template>
