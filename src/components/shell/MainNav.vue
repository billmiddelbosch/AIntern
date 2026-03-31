<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBookingModal } from '@/composables/useBookingModal'
import { useAnalytics } from '@/composables/useAnalytics'

const { t, locale } = useI18n()
const { openBookingModal } = useBookingModal()
const { trackEvent } = useAnalytics()

const mobileMenuOpen = ref(false)

const navItems = [
  { labelKey: 'nav.about', anchor: '#over-aintern' },
  { labelKey: 'nav.nocurenopay', anchor: '#no-cure-no-pay' },
]

const routeNavItems = [{ labelKey: 'nav.kennisbank', to: '/kennisbank' }]

function scrollTo(anchor: string) {
  mobileMenuOpen.value = false
  if (typeof document === 'undefined') return
  const el = document.querySelector(anchor)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function handleCta() {
  mobileMenuOpen.value = false
  trackEvent('cta_click', { location: 'nav' })
  openBookingModal()
}

function toggleLocale() {
  locale.value = locale.value === 'nl' ? 'en' : 'nl'
}
</script>

<template>
  <header class="fixed top-0 inset-x-0 z-50 h-16 bg-white/90 backdrop-blur border-b border-slate-100">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-8">

      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2 shrink-0">
        <img src="@/assets/brand/mascot-nav.png" alt="AIntern" class="h-8 w-auto" />
        <span class="font-heading text-xl font-bold text-indigo-600 tracking-tight">AIntern</span>
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="hidden lg:flex items-center gap-6">
        <button
          v-for="item in navItems"
          :key="item.anchor"
          class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
          @click="scrollTo(item.anchor)"
        >
          {{ t(item.labelKey) }}
        </button>
        <RouterLink
          v-for="item in routeNavItems"
          :key="item.to"
          :to="item.to"
          class="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          {{ t(item.labelKey) }}
        </RouterLink>
      </nav>

      <!-- Right side: locale + CTA -->
      <div class="hidden lg:flex items-center gap-4">
        <button
          class="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wide"
          @click="toggleLocale"
        >
          {{ locale === 'nl' ? 'EN' : 'NL' }}
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          @click="handleCta"
        >
          {{ t('nav.cta') }}
        </button>
      </div>

      <!-- Mobile hamburger -->
      <button
        class="lg:hidden flex flex-col gap-1.5 p-1"
        :aria-label="t('nav.menu')"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <span
          class="block w-6 h-0.5 bg-slate-700 transition-all"
          :class="{ 'rotate-45 translate-y-2': mobileMenuOpen }"
        />
        <span
          class="block w-6 h-0.5 bg-slate-700 transition-all"
          :class="{ 'opacity-0': mobileMenuOpen }"
        />
        <span
          class="block w-6 h-0.5 bg-slate-700 transition-all"
          :class="{ '-rotate-45 -translate-y-2': mobileMenuOpen }"
        />
      </button>
    </div>

    <!-- Mobile menu -->
    <div
      v-if="mobileMenuOpen"
      class="lg:hidden bg-white border-b border-slate-100 px-4 pb-4 flex flex-col gap-3"
    >
      <button
        v-for="item in navItems"
        :key="item.anchor"
        class="text-sm font-medium text-slate-700 hover:text-indigo-600 text-left py-2 border-b border-slate-50 transition-colors"
        @click="scrollTo(item.anchor)"
      >
        {{ t(item.labelKey) }}
      </button>
      <RouterLink
        v-for="item in routeNavItems"
        :key="item.to"
        :to="item.to"
        class="text-sm font-medium text-slate-700 hover:text-indigo-600 text-left py-2 border-b border-slate-50 last:border-0 transition-colors"
        @click="mobileMenuOpen = false"
      >
        {{ t(item.labelKey) }}
      </RouterLink>
      <div class="flex items-center gap-3 pt-1">
        <button
          class="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wide"
          @click="toggleLocale"
        >
          {{ locale === 'nl' ? 'EN' : 'NL' }}
        </button>
        <button
          class="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          @click="handleCta"
        >
          {{ t('nav.cta') }}
        </button>
      </div>
    </div>
  </header>
</template>
