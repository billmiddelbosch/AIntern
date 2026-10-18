<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import { useBookingModal } from '@/composables/useBookingModal'
  import { useAnalytics } from '@/composables/useAnalytics'

  const props = withDefaults(
    defineProps<{
      heading: string
      subtext: string
      button: string
      location: string
      secondaryLabel?: string
      secondaryTo?: string
    }>(),
    { secondaryLabel: undefined, secondaryTo: undefined },
  )

  const { openBookingModal } = useBookingModal()
  const { trackEvent } = useAnalytics()

  function handleCta() {
    trackEvent('cta_click', { location: props.location })
    openBookingModal()
  }
</script>

<template>
  <section id="contact" class="bg-slate-950 py-20 px-4 sm:px-6 scroll-mt-16">
    <div class="max-w-3xl mx-auto text-center">
      <h2 class="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">{{ heading }}</h2>
      <p class="text-lg text-slate-400 mb-8">{{ subtext }}</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          class="px-7 py-4 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors"
          @click="handleCta"
        >
          {{ button }}
        </button>
        <RouterLink
          v-if="secondaryLabel && secondaryTo"
          :to="secondaryTo"
          class="px-7 py-4 rounded-xl border border-slate-700 text-slate-200 font-semibold hover:border-slate-500 hover:text-white transition-colors"
        >
          {{ secondaryLabel }}
        </RouterLink>
      </div>
      <p class="mt-6 text-sm text-slate-500">
        <a href="mailto:info@aintern.nl" class="hover:text-slate-300">info@aintern.nl</a>
      </p>
    </div>
  </section>
</template>
