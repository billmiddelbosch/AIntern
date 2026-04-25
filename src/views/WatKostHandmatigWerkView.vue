<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppShell from '@/components/shell/AppShell.vue'
import IntakeModal from '@/components/ui/IntakeModal.vue'
import { useIntakeModal } from '@/composables/useIntakeModal'
import { useAnalytics } from '@/composables/useAnalytics'

const { t } = useI18n()
const { openIntakeModal } = useIntakeModal()
const { trackEvent } = useAnalytics()

// ---------------------------------------------------------------------------
// Input state
// ---------------------------------------------------------------------------

/** Hours per week spent on repetitive tasks (1–40) */
const hoursPerWeek = ref<number>(10)

/** Average hourly rate in euros (15–150, step 5) */
const hourlyRate = ref<number>(40)

/** Number of processes to automate (1–5) */
const processCount = ref<number>(2)

// ---------------------------------------------------------------------------
// Calculator constants
// ---------------------------------------------------------------------------

const AI_EFFICIENCY = 0.7 // AI handles ~70% of repetitive work
const WEEKS_PER_MONTH = 4.33
const MONTHS_PER_YEAR = 12
// ---------------------------------------------------------------------------
// Computed results — no watchers needed, purely derived
// ---------------------------------------------------------------------------

const weeklySavings = computed<number>(() =>
  hoursPerWeek.value * hourlyRate.value * AI_EFFICIENCY * processCount.value,
)

const monthlySavings = computed<number>(() => weeklySavings.value * WEEKS_PER_MONTH)

const annualSavings = computed<number>(() => monthlySavings.value * MONTHS_PER_YEAR)

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

// ---------------------------------------------------------------------------
// CTA
// ---------------------------------------------------------------------------

function handleCta() {
  trackEvent('cta_click', { location: 'gratis-tool' })
  openIntakeModal()
}

// ---------------------------------------------------------------------------
// Slider helpers — process count is shown as select-style buttons
// ---------------------------------------------------------------------------
const processCounts = [1, 2, 3, 4, 5]
</script>

<template>
  <AppShell>
    <div class="min-h-[calc(100vh-4rem)] bg-slate-50">

      <!-- Page header -->
      <section class="bg-white border-b border-slate-100 py-12 px-4 sm:px-6">
        <div class="max-w-4xl mx-auto text-center">
          <span class="inline-block text-xs font-semibold uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 mb-4">
            {{ t('gratisToolView.eyebrow') }}
          </span>
          <h1 class="font-heading text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
            {{ t('gratisToolView.headline') }}
          </h1>
          <p class="text-lg text-slate-500 max-w-xl mx-auto">
            {{ t('gratisToolView.subtext') }}
          </p>
        </div>
      </section>

      <!-- Calculator -->
      <section class="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div class="grid lg:grid-cols-2 gap-8 items-start">

          <!-- ----------------------------------------------------------------
               LEFT: Input panel
          ---------------------------------------------------------------- -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-8">
            <h2 class="text-lg font-semibold text-slate-800">
              {{ t('gratisToolView.inputPanel.heading') }}
            </h2>

            <!-- Hours per week slider -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label for="roi-hours" class="text-sm font-medium text-slate-700">
                  {{ t('gratisToolView.inputPanel.hoursLabel') }}
                </label>
                <span class="text-sm font-semibold text-indigo-600 tabular-nums">
                  {{ hoursPerWeek }} {{ t('gratisToolView.inputPanel.hoursUnit') }}
                </span>
              </div>
              <input
                id="roi-hours"
                v-model.number="hoursPerWeek"
                type="range"
                min="1"
                max="40"
                step="1"
                class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div class="flex justify-between text-xs text-slate-400">
                <span>1h</span>
                <span>40h</span>
              </div>
            </div>

            <!-- Hourly rate slider -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label for="roi-rate" class="text-sm font-medium text-slate-700">
                  {{ t('gratisToolView.inputPanel.rateLabel') }}
                </label>
                <span class="text-sm font-semibold text-indigo-600 tabular-nums">
                  {{ formatCurrency(hourlyRate) }}/uur
                </span>
              </div>
              <input
                id="roi-rate"
                v-model.number="hourlyRate"
                type="range"
                min="15"
                max="150"
                step="5"
                class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div class="flex justify-between text-xs text-slate-400">
                <span>€15</span>
                <span>€150</span>
              </div>
            </div>

            <!-- Process count select-buttons -->
            <div class="space-y-3">
              <label class="text-sm font-medium text-slate-700 block">
                {{ t('gratisToolView.inputPanel.processesLabel') }}
              </label>
              <div class="flex gap-2">
                <button
                  v-for="n in processCounts"
                  :key="n"
                  type="button"
                  class="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all"
                  :class="
                    processCount === n
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
                  "
                  @click="processCount = n"
                >
                  {{ n }}
                </button>
              </div>
            </div>
          </div>

          <!-- ----------------------------------------------------------------
               RIGHT: Results panel
          ---------------------------------------------------------------- -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col gap-6">
            <h2 class="text-lg font-semibold text-slate-800">
              {{ t('gratisToolView.resultsPanel.heading') }}
            </h2>

            <!-- Annual savings — hero number -->
            <div class="bg-emerald-50 rounded-xl p-6 text-center">
              <p class="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
                {{ t('gratisToolView.resultsPanel.annual') }}
              </p>
              <p class="font-heading text-5xl sm:text-6xl font-bold text-emerald-600 tabular-nums leading-none">
                {{ formatCurrency(annualSavings) }}
              </p>
            </div>

            <!-- Weekly + Monthly -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-50 rounded-xl p-4 text-center">
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  {{ t('gratisToolView.resultsPanel.weekly') }}
                </p>
                <p class="text-2xl font-bold text-slate-800 tabular-nums">
                  {{ formatCurrency(weeklySavings) }}
                </p>
              </div>
              <div class="bg-slate-50 rounded-xl p-4 text-center">
                <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  {{ t('gratisToolView.resultsPanel.monthly') }}
                </p>
                <p class="text-2xl font-bold text-slate-800 tabular-nums">
                  {{ formatCurrency(monthlySavings) }}
                </p>
              </div>
            </div>

            <!-- CTA -->
            <button
              type="button"
              class="w-full px-6 py-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm leading-snug"
              @click="handleCta"
            >
              {{ t('gratisToolView.resultsPanel.cta') }}
            </button>
            
            <!-- Social proof -->
            <p class="text-center text-sm text-slate-500 font-medium">
              {{ t('gratisToolView.resultsPanel.socialProof') }}
            </p>

            <!-- Disclaimer -->
            <p class="text-center text-xs text-slate-400 leading-relaxed">
              {{ t('gratisToolView.resultsPanel.disclaimer') }}
            </p>
          </div>

        </div>
      </section>

    </div>

    <!-- IntakeModal must be present on any page that calls openIntakeModal -->
    <IntakeModal />
  </AppShell>
</template>
