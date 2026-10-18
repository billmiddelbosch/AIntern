<script setup lang="ts">
  withDefaults(
    defineProps<{
      eyebrow: string
      heading: string
      intro?: string
      dark?: boolean
      center?: boolean
    }>(),
    { intro: undefined, dark: false, center: true },
  )
</script>

<template>
  <div class="mb-10 sm:mb-12" :class="center ? 'text-center max-w-3xl mx-auto' : 'max-w-2xl'">
    <span
      class="inline-block text-xs font-semibold uppercase tracking-widest rounded-full px-3 py-1 mb-4"
      :class="dark ? 'text-indigo-300 bg-indigo-500/10' : 'text-indigo-600 bg-indigo-50'"
    >
      {{ eyebrow }}
    </span>
    <h2
      class="font-heading text-2xl sm:text-4xl font-bold leading-tight"
      :class="dark ? 'text-white' : 'text-slate-900'"
    >
      {{ heading }}
    </h2>
    <p v-if="intro" class="mt-4 text-lg" :class="dark ? 'text-slate-400' : 'text-slate-500'">
      {{ intro }}
    </p>
  </div>
</template>
