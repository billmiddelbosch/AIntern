<script setup lang="ts">
defineProps<{ current: number; total: number }>()
</script>

<template>
  <div class="space-y-1">
    <div class="flex justify-between text-xs text-slate-500">
      <span>Vraag {{ current }} van {{ total }}</span>
      <span>{{ Math.round((current / total) * 100) }}%</span>
    </div>
    <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        class="h-full bg-indigo-500 rounded-full transition-all duration-300"
        :style="{ width: `${(current / total) * 100}%` }"
      />
    </div>
  </div>
</template>
