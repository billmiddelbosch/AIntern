<script setup lang="ts">
type Tab = 'issues' | 'agents' | 'acties'
import { ref } from 'vue'

const activeTab = ref<Tab>('issues')
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div>
      <h2 class="text-2xl font-semibold text-slate-800">AInternLoop</h2>
      <p class="mt-1 text-sm text-slate-500">Agent orkestratie — issues, agents en acties</p>
    </div>

    <div class="flex border-b border-slate-200 gap-1">
      <button
        v-for="tab in (['issues', 'agents', 'acties'] as const)"
        :key="tab"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeTab === tab
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-slate-500 hover:text-slate-700'"
        @click="activeTab = tab"
      >
        {{ { issues: 'Issues', agents: 'Agents', acties: 'Acties' }[tab] }}
      </button>
    </div>

    <div v-if="activeTab === 'issues'" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
      Issues-paneel — nog niet geïmplementeerd (I-06, I-07)
    </div>

    <div v-else-if="activeTab === 'agents'" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
      Agents-paneel — nog niet geïmplementeerd (I-08)
    </div>

    <div v-else-if="activeTab === 'acties'" class="py-12 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
      Acties-paneel — nog niet geïmplementeerd (A-19)
    </div>
  </div>
</template>
