<script setup lang="ts">
import { ref } from 'vue'
import data from '@/../product/sections/problemen-oplossingen/data.json'
import type { ProbleemOplossingPair } from '@/../product/sections/problemen-oplossingen/types'
import { ProbleemOplossingSection } from '@/components/sections/problemen-oplossingen'

const pairs = ref(data.pairs as ProbleemOplossingPair[])
</script>

<template>
  <ProbleemOplossingSection :pairs="pairs" />
</template>
