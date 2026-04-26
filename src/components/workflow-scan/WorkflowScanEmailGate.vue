<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ loading: boolean }>()
const emit = defineEmits<{ submit: [email: string] }>()

const email = ref('')

function handleSubmit() {
  const trimmed = email.value.trim()
  if (!trimmed || !trimmed.includes('@')) return
  emit('submit', trimmed)
}
</script>

<template>
  <div class="space-y-6">
    <div class="text-center space-y-2">
      <h2 class="text-2xl font-bold text-slate-900">Ontvang jouw volledige analyse</h2>
      <p class="text-slate-500 text-sm">We sturen je het rapport — geen spam, geen verplichtingen.</p>
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="scan-email" class="block text-sm font-medium text-slate-700 mb-1">
          E-mailadres
        </label>
        <input
          id="scan-email"
          v-model="email"
          type="email"
          required
          placeholder="naam@bedrijf.nl"
          class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        :disabled="props.loading"
        class="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
      >
        <span v-if="props.loading">Rapport genereren...</span>
        <span v-else>Bekijk mijn volledige rapport →</span>
      </button>

      <p class="text-xs text-slate-400 text-center">
        Jouw gegevens worden niet gedeeld met derden.
      </p>
    </form>
  </div>
</template>
