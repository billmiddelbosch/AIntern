<script setup lang="ts">
  import { RouterLink } from 'vue-router'
  import { useI18n } from 'vue-i18n'

  const { t, locale } = useI18n()

  const productLinks = [
    { labelKey: 'pivot.nav.platform', to: '/platform' },
    { labelKey: 'pivot.nav.how', to: '/#hoe-werkt-het' },
    { labelKey: 'pivot.nav.pricing', to: '/#prijs' },
    { labelKey: 'pivot.nav.partners', to: '/partners' },
    { labelKey: 'nav.contact', to: '/#contact' },
  ]

  // Older tools and content stay reachable, but only from the footer.
  const resourceLinks = [
    { labelKey: 'nav.kennisbank', to: '/kennisbank' },
    { labelKey: 'pivot.footer.newsflow', to: '/newsflow' },
    { labelKey: 'nav.faq', to: '/veelgestelde-vragen' },
    { labelKey: 'nav.kostencalculator', to: '/wat-kost-handmatig-werk' },
    { labelKey: 'pivot.footer.workflowScan', to: '/workflow-scan' },
    { labelKey: 'pivot.footer.aiAgent', to: '/ai-agent-mkb' },
  ]

  const companyLinks = [
    { labelKey: 'pivot.footer.about', to: '/about' },
    { labelKey: 'pivot.footer.privacy', to: '/privacy' },
  ]

  function toggleLocale() {
    locale.value = locale.value === 'nl' ? 'en' : 'nl'
  }
</script>

<template>
  <footer class="bg-slate-900 text-slate-400">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div class="grid gap-10 sm:grid-cols-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <!-- Brand -->
        <div class="flex flex-col gap-3 sm:col-span-3 md:col-span-1">
          <span class="font-heading text-xl font-bold text-white tracking-tight">AIntern</span>
          <p class="text-sm text-slate-400 max-w-xs">{{ t('footer.tagline') }}</p>
        </div>

        <nav class="flex flex-col gap-2" :aria-label="t('pivot.footer.product')">
          <span class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">{{
            t('pivot.footer.product')
          }}</span>
          <RouterLink
            v-for="item in productLinks"
            :key="item.to"
            :to="item.to"
            class="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {{ t(item.labelKey) }}
          </RouterLink>
        </nav>

        <nav class="flex flex-col gap-2" :aria-label="t('pivot.footer.resources')">
          <span class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">{{
            t('pivot.footer.resources')
          }}</span>
          <RouterLink
            v-for="item in resourceLinks"
            :key="item.to"
            :to="item.to"
            class="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {{ t(item.labelKey) }}
          </RouterLink>
        </nav>

        <nav class="flex flex-col gap-2" :aria-label="t('pivot.footer.company')">
          <span class="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">{{
            t('pivot.footer.company')
          }}</span>
          <RouterLink
            v-for="item in companyLinks"
            :key="item.to"
            :to="item.to"
            class="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {{ t(item.labelKey) }}
          </RouterLink>
        </nav>
      </div>

      <!-- Bottom bar -->
      <div
        class="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3"
      >
        <p class="text-xs text-slate-500">
          © {{ new Date().getFullYear() }} AIntern. {{ t('footer.rights') }}
        </p>
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
