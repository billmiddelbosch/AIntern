<script setup lang="ts">
import { ref } from 'vue'
import data from '@/../product/sections/no-cure-no-pay-faq/data.json'
import type { FaqItem } from '@/../product/sections/no-cure-no-pay-faq/types'
import { NoCureNoPayFaqSection } from '@/components/sections/no-cure-no-pay-faq'
import type { BgColor } from '@/lib/brand'

defineProps<{ bg?: BgColor }>()

const faqs = ref(data.faqs as FaqItem[])
</script>

<template>
  <NoCureNoPayFaqSection :faqs="faqs" :bg="bg" />
</template>
