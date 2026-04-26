<script setup lang="ts">
defineProps<{
  score: number
  topIssues: string[]
}>()

function scoreColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'Relatief geoptimaliseerd'
  if (score >= 40) return 'Geïdentificeerde gaps'
  return 'Hoog automatiserings-potentieel'
}

defineEmits<{ requestReport: [] }>()
</script>

<template>
  <div class="space-y-8">
    <div class="text-center space-y-2">
      <h2 class="text-2xl font-bold text-slate-900">Jouw efficiency score</h2>
      <p class="text-slate-500 text-sm">Gebaseerd op jouw antwoorden</p>
    </div>

    <!-- Score gauge -->
    <div class="flex flex-col items-center gap-3">
      <div
        class="w-32 h-32 rounded-full border-8 flex items-center justify-center"
        :style="{ borderColor: scoreColor(score) }"
      >
        <span class="text-4xl font-bold" :style="{ color: scoreColor(score) }">{{ score }}</span>
      </div>
      <span
        class="text-sm font-semibold px-3 py-1 rounded-full"
        :style="{ color: scoreColor(score), backgroundColor: scoreColor(score) + '20' }"
      >
        {{ scoreLabel(score) }}
      </span>
    </div>

    <!-- Top-3 knelpunten -->
    <div class="space-y-3">
      <h3 class="font-semibold text-slate-800">Jouw top-3 knelpunten</h3>
      <ul class="space-y-2">
        <li
          v-for="(issue, i) in topIssues"
          :key="i"
          class="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-slate-700"
        >
          <span class="shrink-0 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
            {{ i + 1 }}
          </span>
          {{ issue }}
        </li>
        <li
          v-if="topIssues.length === 0"
          class="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700"
        >
          Geen kritieke knelpunten gedetecteerd — goed bezig!
        </li>
      </ul>
    </div>

    <!-- CTA naar volledig rapport -->
    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4">
      <p class="text-sm text-slate-700 font-medium">
        Zie je jezelf hierin? Ontvang je volledige analyse + concrete aanbevelingen →
      </p>
      <button
        class="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
        @click="$emit('requestReport')"
      >
        Ontvang gratis volledig rapport
      </button>
    </div>
  </div>
</template>
