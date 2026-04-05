<script setup lang="ts">
import { OverAInternContactSection } from '@/components/sections/over-aintern-contact'
import type { BgColor } from '@/lib/brand'

defineProps<{ bg?: BgColor }>()
</script>

<template>
  <OverAInternContactSection :bg="bg" />
</template>
