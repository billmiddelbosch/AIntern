<script setup lang="ts">
defineEmits<{ start: [] }>()
</script>

<template>
  <div class="max-w-lg mx-auto text-center space-y-6">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-600" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </div>
    <div>
      <h1 class="text-3xl font-bold text-slate-900">AI Workflow Scanner</h1>
      <p class="mt-3 text-lg text-slate-600">Ontdek in 3 minuten hoeveel tijd automatisering je bedrijf kan besparen.</p>
    </div>
    <ul class="text-left space-y-2 text-sm text-slate-600">
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">7</span>
        vragen over jouw werkprocessen
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">3</span>
        minuten — geen aanmelding vereist
      </li>
      <li class="flex items-center gap-2">
        <span class="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
        directe score + top-3 knelpunten
      </li>
    </ul>
    <button
      class="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
      @click="$emit('start')"
    >
      Start de scan →
    </button>
  </div>
</template>
