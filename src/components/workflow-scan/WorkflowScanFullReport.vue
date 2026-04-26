<script setup lang="ts">
import type { ScanRecommendation } from '@/types/workflowScan'

defineProps<{
  score: number
  topIssues: string[]
  recommendations: ScanRecommendation[]
}>()

function scoreLabel(score: number): string {
  if (score >= 70) return 'Relatief geoptimaliseerd'
  if (score >= 40) return 'Geïdentificeerde gaps'
  return 'Hoog automatiserings-potentieel'
}
</script>

<template>
  <div class="space-y-8">
    <div class="text-center space-y-2">
      <h2 class="text-2xl font-bold text-slate-900">Jouw volledige analyse</h2>
      <p class="text-slate-500 text-sm">Score: {{ score }}/100 — {{ scoreLabel(score) }}</p>
    </div>

    <!-- Aanbevelingen per knelpunt -->
    <div class="space-y-4">
      <h3 class="font-semibold text-slate-800">Aanbevelingen</h3>
      <div
        v-for="(rec, i) in recommendations"
        :key="i"
        class="p-5 bg-white border border-slate-200 rounded-xl space-y-3"
      >
        <div class="flex items-start gap-3">
          <span class="shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
            {{ i + 1 }}
          </span>
          <div class="space-y-2">
            <p class="font-medium text-slate-800 text-sm">{{ rec.issue }}</p>
            <p class="text-slate-600 text-sm">{{ rec.recommendation }}</p>
            <div class="pt-1 border-t border-slate-100">
              <p class="text-xs font-semibold text-indigo-600 mb-1">Wat AIntern hiermee doet:</p>
              <p class="text-xs text-slate-500">{{ rec.ainternApproach }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="recommendations.length === 0" class="p-5 bg-green-50 rounded-xl text-sm text-green-700">
        Goed nieuws — je processen zijn grotendeels geoptimaliseerd. Wil je toch sparren? Plan een gratis gesprek.
      </div>
    </div>

    <!-- CTA -->
    <div class="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white space-y-4">
      <h3 class="font-bold text-lg">Klaar om te automatiseren?</h3>
      <p class="text-indigo-100 text-sm">
        Plan een gratis 15-minuten gesprek. We laten zien welke knelpunten we als eerste aanpakken.
      </p>
      <a
        href="https://calendly.com/aintern/kennismaking"
        target="_blank"
        rel="noopener noreferrer"
        class="block w-full py-3 px-6 bg-white text-indigo-600 font-semibold rounded-xl text-center hover:bg-indigo-50 transition-colors"
      >
        Plan een gratis gesprek →
      </a>
    </div>
  </div>
</template>
