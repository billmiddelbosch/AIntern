<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useHead } from '@unhead/vue'
  import { AppShell } from '@/components/shell'
  import PivotHeroSection from '@/components/sections/pivot/PivotHeroSection.vue'
  import PivotProblemSection from '@/components/sections/pivot/PivotProblemSection.vue'
  import PivotHowSection from '@/components/sections/pivot/PivotHowSection.vue'
  import PivotPillarsSection from '@/components/sections/pivot/PivotPillarsSection.vue'
  import PivotReplaceSection from '@/components/sections/pivot/PivotReplaceSection.vue'
  import PivotCompareSection from '@/components/sections/pivot/PivotCompareSection.vue'
  import PivotPricingSection from '@/components/sections/pivot/PivotPricingSection.vue'
  import PivotPartnersTeaserSection from '@/components/sections/pivot/PivotPartnersTeaserSection.vue'
  import PivotFaqSection from '@/components/sections/pivot/PivotFaqSection.vue'
  import PivotCtaSection from '@/components/sections/pivot/PivotCtaSection.vue'

  const { t } = useI18n()

  const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const

  useHead({
    script: [
      {
        type: 'application/ld+json',
        key: 'home-faq',
        innerHTML: computed(() =>
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_KEYS.map((key) => ({
              '@type': 'Question',
              name: t(`pivot.home.faq.items.${key}.q`),
              acceptedAnswer: { '@type': 'Answer', text: t(`pivot.home.faq.items.${key}.a`) },
            })),
          }).replace(/</g, '\\u003c'),
        ),
      },
    ],
  })
</script>

<template>
  <AppShell>
    <PivotHeroSection />
    <PivotProblemSection />
    <PivotHowSection />
    <PivotPillarsSection />
    <PivotReplaceSection />
    <PivotCompareSection />
    <PivotPricingSection />
    <PivotPartnersTeaserSection />
    <PivotFaqSection />
    <PivotCtaSection
      :heading="t('pivot.home.cta.heading')"
      :subtext="t('pivot.home.cta.subtext')"
      :button="t('pivot.home.cta.button')"
      :secondary-label="t('pivot.home.cta.secondary')"
      secondary-to="/platform"
      location="home-cta"
    />
  </AppShell>
</template>
