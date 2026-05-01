<script setup lang="ts">
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { bg } = defineProps<{ bg?: 'light' | 'dark' }>()

const { t } = useI18n()

const sectionRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

useIntersectionObserver(sectionRef, ([entry]) => {
  if (entry.isIntersecting) isVisible.value = true
}, { threshold: 0.15 })

const tags = ['Vue 3', 'AWS Lambda', 'Claude AI', 'Lightspeed API']
</script>

<template>
  <section
    ref="sectionRef"
    :class="[
      'py-20 px-6',
      bg === 'dark' ? 'bg-slate-900' : 'bg-white',
    ]"
  >
    <div class="max-w-4xl mx-auto">
      <!-- Heading -->
      <div
        :class="[
          'text-center mb-12 transition-all duration-700 ease-out',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        ]"
      >
        <p :class="['text-sm font-semibold uppercase tracking-widest mb-2', bg === 'dark' ? 'text-indigo-400' : 'text-indigo-600']">
          Case study
        </p>
        <h2 :class="['text-3xl font-bold mb-3', bg === 'dark' ? 'text-white' : 'text-slate-900']">
          {{ t('portfolio.heading') }}
        </h2>
        <p :class="['text-lg', bg === 'dark' ? 'text-slate-300' : 'text-slate-600']">
          {{ t('portfolio.subheading') }}
        </p>
      </div>

      <!-- Project card -->
      <div
        :class="[
          'rounded-2xl p-8 transition-all duration-700 ease-out delay-150',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          bg === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50 border border-slate-200',
        ]"
      >
        <!-- Card header -->
        <div class="flex items-start gap-5 mb-6">
          <!-- Inline SVG icon -->
          <div :class="['flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center', bg === 'dark' ? 'bg-indigo-900' : 'bg-indigo-100']">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <!-- Laptop body -->
              <rect x="4" y="6" width="24" height="16" rx="2" :fill="bg === 'dark' ? '#818cf8' : '#4f46e5'" opacity="0.2"/>
              <rect x="4" y="6" width="24" height="16" rx="2" :stroke="bg === 'dark' ? '#818cf8' : '#4f46e5'" stroke-width="1.5" fill="none"/>
              <!-- Screen -->
              <rect x="7" y="9" width="18" height="10" rx="1" :fill="bg === 'dark' ? '#818cf8' : '#4f46e5'" opacity="0.4"/>
              <!-- Base -->
              <path d="M2 22h28v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1z" :fill="bg === 'dark' ? '#818cf8' : '#4f46e5'" opacity="0.3"/>
              <!-- Gear -->
              <circle cx="25" cy="8" r="4" :fill="bg === 'dark' ? '#1e1b4b' : 'white'"/>
              <circle cx="25" cy="8" r="1.5" :fill="bg === 'dark' ? '#818cf8' : '#4f46e5'"/>
              <path d="M25 4.5v1M25 10.5v1M21.5 8h1M28.5 8h1M22.4 5.4l.7.7M27.2 10.2l.7.7M22.4 10.6l.7-.7M27.2 5.8l.7-.7"
                :stroke="bg === 'dark' ? '#818cf8' : '#4f46e5'" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
          </div>

          <div class="flex-1 min-w-0">
            <h3 :class="['text-xl font-bold mb-2', bg === 'dark' ? 'text-white' : 'text-slate-900']">
              {{ t('portfolio.project_title') }}
            </h3>
            <!-- Tags -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in tags"
                :key="tag"
                :class="[
                  'text-xs font-medium px-2.5 py-1 rounded-full',
                  bg === 'dark' ? 'bg-indigo-900/60 text-indigo-300' : 'bg-indigo-100 text-indigo-700',
                ]"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <p :class="['text-sm leading-relaxed mb-8', bg === 'dark' ? 'text-slate-300' : 'text-slate-600']">
          {{ t('portfolio.description') }}
        </p>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div :class="['rounded-xl p-4 text-center', bg === 'dark' ? 'bg-slate-700/50' : 'bg-white border border-slate-200']">
            <p :class="['text-2xl font-extrabold stat-count', bg === 'dark' ? 'text-indigo-400' : 'text-indigo-600']">
              {{ t('portfolio.stat1_value') }}
            </p>
            <p :class="['text-xs mt-1', bg === 'dark' ? 'text-slate-400' : 'text-slate-500']">
              {{ t('portfolio.stat1_label') }}
            </p>
          </div>
          <div :class="['rounded-xl p-4 text-center', bg === 'dark' ? 'bg-slate-700/50' : 'bg-white border border-slate-200']">
            <p :class="['text-2xl font-extrabold stat-count', bg === 'dark' ? 'text-indigo-400' : 'text-indigo-600']">
              {{ t('portfolio.stat2_value') }}
            </p>
            <p :class="['text-xs mt-1', bg === 'dark' ? 'text-slate-400' : 'text-slate-500']">
              {{ t('portfolio.stat2_label') }}
            </p>
          </div>
        </div>

        <!-- CTA -->
        <RouterLink
          to="/workflow-scan"
          :class="[
            'inline-flex items-center font-semibold text-sm transition-colors',
            bg === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800',
          ]"
        >
          {{ t('portfolio.cta') }}
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stat-count {
  animation: none;
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.stat-count {
  animation: countUp 0.6s ease-out both;
  animation-delay: 0.4s;
}
</style>
