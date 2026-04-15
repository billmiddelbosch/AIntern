<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import data from '@/../product/sections/no-cure-no-pay-faq/data.json'
import type { FaqItem } from '@/../product/sections/no-cure-no-pay-faq/types'
import { NoCureNoPayFaqSection } from '@/components/sections/no-cure-no-pay-faq'
import type { BgColor } from '@/lib/brand'

defineProps<{ bg?: BgColor }>()

const faqs = ref(data.faqs as FaqItem[])
const { locale } = useI18n()

const faqSchema = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.value.map((faq) => ({
    '@type': 'Question',
    name: locale.value === 'nl' ? faq.nl.question : faq.en.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: locale.value === 'nl' ? faq.nl.answer : faq.en.answer,
    },
  })),
}))

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => JSON.stringify(faqSchema.value)),
    },
  ],
})
</script>

<template>
  <NoCureNoPayFaqSection :faqs="faqs" :bg="bg" />
</template>
