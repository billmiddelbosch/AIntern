<script setup lang="ts">
import { ref } from 'vue'
import data from '@/../product/sections/hoe-werkt-het/data.json'
import { HowItWorksSection } from '@/components/sections/hoe-werkt-het'
import type { BgColor } from '@/lib/brand'

defineProps<{ bg?: BgColor }>()

const steps = ref(data.steps)
</script>

<template>
  <HowItWorksSection :steps="steps" :bg="bg" />
</template>
