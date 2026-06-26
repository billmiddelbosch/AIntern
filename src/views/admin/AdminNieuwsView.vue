<script setup lang="ts">
type Tab = 'agents' | 'paginas' | 'acties'
import { ref } from 'vue'

const activeTab = ref<Tab>('agents')
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div>
      <h2 class="text-2xl font-semibold text-slate-800">NewsFlow</h2>
      <p class="mt-1 text-sm text-slate-500">Dagelijks nieuws-naar-landingspagina flywheel</p>
    </div>

    <div class="flex border-b border-slate-200 gap-1">
      <button
        v-for="tab in (['agents', 'paginas', 'acties'] as const)"
        :key="tab"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeTab === tab
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="activeTab = tab"
      >
        {{ { agents: 'Agents', paginas: "Pagina's", acties: 'Acties' }[tab] }}
      </button>
    </div>

    <div v-if="activeTab === 'agents'" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
      Agent overzicht (NewsAnalyzer / ContentBuilder / SEOOptimizer) — nog niet geïmplementeerd (A-20)
    </div>

    <div v-else-if="activeTab === 'paginas'" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
      Landingspagina's overzicht — nog niet geïmplementeerd (I-10)
    </div>

    <div v-else-if="activeTab === 'acties'" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
      Actieve acties — nog niet geïmplementeerd (I-11 t/m I-13)
    </div>
  </div>
</template>
