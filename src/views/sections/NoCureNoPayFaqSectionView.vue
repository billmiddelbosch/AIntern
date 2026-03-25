<script setup lang="ts">
import { ref } from 'vue'
import data from '@/../product/sections/no-cure-no-pay-faq/data.json'
import type { FaqItem } from '@/../product/sections/no-cure-no-pay-faq/types'
import { NoCureNoPayFaqSection } from '@/components/sections/no-cure-no-pay-faq'

const faqs = ref(data.faqs as FaqItem[])
</script>

<template>
  <NoCureNoPayFaqSection :faqs="faqs" />
</template>
