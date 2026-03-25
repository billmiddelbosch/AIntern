<script setup lang="ts">
import { ref } from 'vue'
import data from '@/../product/sections/resultaten-cases/data.json'
import type { ResultaatCase } from '@/../product/sections/resultaten-cases/types'
import { ResultatenCasesSection } from '@/components/sections/resultaten-cases'

const cases = ref(data.cases as ResultaatCase[])
</script>

<template>
  <ResultatenCasesSection :cases="cases" />
</template>
