<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="py-16 bg-indigo-600">
    <div class="max-w-4xl mx-auto px-6 text-center space-y-4">
      <h2 class="text-2xl font-bold text-white">Hoeveel tijd verlies jij aan handmatig werk?</h2>
      <p class="text-indigo-200 max-w-xl mx-auto">
        Doe de gratis AI Workflow Scan en ontdek in 3 minuten je top-3 knelpunten + concrete
        aanbevelingen.
      </p>
      <RouterLink
        to="/workflow-scan"
        class="inline-block mt-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
      >
        Scan je workflow gratis →
      </RouterLink>
    </div>
  </section>
</template>
