<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const navItems = [
  { labelKey: 'nav.about', anchor: '#over-aintern' },
  { labelKey: 'nav.nocurenopay', anchor: '#no-cure-no-pay' },
  { labelKey: 'nav.contact', anchor: '#contact' },
]

function scrollTo(anchor: string) {
  const el = document.querySelector(anchor)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function toggleLocale() {
  locale.value = locale.value === 'nl' ? 'en' : 'nl'
}
</script>

<template>
  <footer class="bg-slate-900 text-slate-400">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div class="flex flex-col md:flex-row justify-between gap-8">

        <!-- Brand -->
        <div class="flex flex-col gap-3">
          <span class="font-heading text-xl font-bold text-white tracking-tight">AIntern</span>
          <p class="text-sm text-slate-400 max-w-xs">{{ t('footer.tagline') }}</p>
        </div>

        <!-- Nav links -->
        <nav class="flex flex-col gap-2">
          <button
            v-for="item in navItems"
            :key="item.anchor"
            class="text-sm text-slate-400 hover:text-white text-left transition-colors"
            @click="scrollTo(item.anchor)"
          >
            {{ t(item.labelKey) }}
          </button>
        </nav>
      </div>

      <!-- Bottom bar -->
      <div class="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
        <p class="text-xs text-slate-500">© {{ new Date().getFullYear() }} AIntern. {{ t('footer.rights') }}</p>
        <button
          class="text-xs font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wide"
          @click="toggleLocale"
        >
          {{ locale === 'nl' ? 'EN' : 'NL' }}
        </button>
      </div>
    </div>
  </footer>
</template>
