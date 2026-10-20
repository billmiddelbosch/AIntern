<script setup lang="ts">
  import { computed, nextTick, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useSavingsModal } from '@/composables/useSavingsModal'
  import { useBookingPage } from '@/composables/useBookingPage'
  import { useAnalytics } from '@/composables/useAnalytics'
  import {
    AINTERN_FROM_PER_MONTH,
    MAX_AMOUNT,
    MAX_EXTRA_TOOLS,
    MAX_TOOL_NAME_LENGTH,
    monthlySaving,
    monthlyTotal,
    sanitizeAmount,
    sanitizeToolName,
    type ToolLine,
  } from '@/utils/savings'

  const { t, locale } = useI18n()
  const { isOpen, closeSavingsModal } = useSavingsModal()
  const { openBooking, openBookingWithNote } = useBookingPage()
  const { trackEvent } = useAnalytics()

  const toolKeys = [
    'crm',
    'quotes',
    'planning',
    'hours',
    'invoicing',
    'service',
    'website',
    'mail',
  ] as const
  type ToolKey = (typeof toolKeys)[number]

  interface ExtraTool {
    id: number
    name: string
    amount: number | null
  }

  const selected = reactive<Record<ToolKey, boolean>>(blankSelection())
  const amounts = reactive<Record<ToolKey, number | null>>(blankAmounts())
  const extras = ref<ExtraTool[]>([])
  let nextExtraId = 1
  const panelRef = ref<HTMLElement | null>(null)

  function blankSelection(): Record<ToolKey, boolean> {
    return Object.fromEntries(toolKeys.map((k) => [k, false])) as Record<ToolKey, boolean>
  }
  function blankAmounts(): Record<ToolKey, number | null> {
    return Object.fromEntries(toolKeys.map((k) => [k, null])) as Record<ToolKey, number | null>
  }

  function reset() {
    Object.assign(selected, blankSelection())
    Object.assign(amounts, blankAmounts())
    extras.value = []
  }

  // Start fresh every time the calculator opens and move focus into the dialog
  watch(isOpen, async (open) => {
    if (!open) return
    reset()
    await nextTick()
    panelRef.value?.focus()
  })

  function addExtra() {
    if (extras.value.length >= MAX_EXTRA_TOOLS) return
    extras.value.push({ id: nextExtraId++, name: '', amount: null })
  }
  function removeExtra(id: number) {
    extras.value = extras.value.filter((e) => e.id !== id)
  }

  const lines = computed<ToolLine[]>(() => {
    const known = toolKeys
      .filter((k) => selected[k])
      .map((k) => ({
        name: t(`pivot.home.replace.items.${k}.title`),
        amount: sanitizeAmount(amounts[k]),
      }))
    const custom = extras.value
      .map((e) => ({ name: sanitizeToolName(e.name), amount: sanitizeAmount(e.amount) }))
      .filter((e) => e.name !== '' || e.amount > 0)
      .map((e) => ({ ...e, name: e.name || t('pivot.savings.otherFallback') }))
    return [...known, ...custom]
  })

  const total = computed(() => monthlyTotal(lines.value))
  const saving = computed(() => monthlySaving(total.value))
  const hasInput = computed(() => total.value > 0)

  const euro = computed(
    () =>
      new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'nl-NL', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
  )
  function fmt(n: number): string {
    return euro.value.format(n)
  }

  function buildNote(): string {
    const items = lines.value.map((l) => `${l.name} ${fmt(l.amount)}`).join('; ')
    return t('pivot.savings.note', {
      tools: items,
      total: fmt(total.value),
      saving: fmt(saving.value),
    })
  }

  function planWithNumbers() {
    trackEvent('savings_calculated', {
      tool_count: lines.value.length,
      monthly_total: total.value,
    })
    const note = buildNote()
    closeSavingsModal()
    openBookingWithNote(note)
  }

  function planDirect() {
    trackEvent('cta_click', { location: 'savings_skip' })
    closeSavingsModal()
    openBooking()
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) closeSavingsModal()
  }
</script>

<template>
  <Teleport to="body">
    <Transition name="sm">
      <div
        v-if="isOpen"
        class="sm-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="t('pivot.savings.title')"
        @click="handleBackdropClick"
        @keydown.esc="closeSavingsModal"
      >
        <div ref="panelRef" class="sm-panel" tabindex="-1">
          <div class="sm-header">
            <div>
              <h2 class="sm-title">{{ t('pivot.savings.title') }}</h2>
              <p class="sm-sub">{{ t('pivot.savings.sub') }}</p>
            </div>
            <button
              type="button"
              class="sm-close"
              :aria-label="t('bookingModal.close')"
              @click="closeSavingsModal"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M2 2l14 14M16 2L2 16"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <fieldset class="sm-fieldset">
            <legend class="sm-legend">{{ t('pivot.savings.toolsLegend') }}</legend>
            <div class="sm-grid">
              <div
                v-for="key in toolKeys"
                :key="key"
                class="sm-row"
                :class="{ 'sm-row--on': selected[key] }"
              >
                <label class="sm-check">
                  <input v-model="selected[key]" type="checkbox" />
                  <span>{{ t(`pivot.home.replace.items.${key}.title`) }}</span>
                </label>
                <label v-if="selected[key]" class="sm-amount">
                  <span class="sr-only">{{
                    t('pivot.savings.amountLabel', {
                      tool: t(`pivot.home.replace.items.${key}.title`),
                    })
                  }}</span>
                  <span aria-hidden="true">€</span>
                  <input
                    v-model.number="amounts[key]"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    :max="MAX_AMOUNT"
                    step="1"
                    :placeholder="t('pivot.savings.amountPlaceholder')"
                  />
                  <span class="sm-per">{{ t('pivot.savings.perMonthShort') }}</span>
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset class="sm-fieldset">
            <legend class="sm-legend">{{ t('pivot.savings.otherLegend') }}</legend>
            <div v-for="extra in extras" :key="extra.id" class="sm-extra">
              <label class="sm-extra-name">
                <span class="sr-only">{{ t('pivot.savings.otherNameLabel') }}</span>
                <input
                  v-model="extra.name"
                  type="text"
                  :maxlength="MAX_TOOL_NAME_LENGTH"
                  :placeholder="t('pivot.savings.otherNamePlaceholder')"
                />
              </label>
              <label class="sm-amount">
                <span class="sr-only">{{ t('pivot.savings.otherAmountLabel') }}</span>
                <span aria-hidden="true">€</span>
                <input
                  v-model.number="extra.amount"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  :max="MAX_AMOUNT"
                  step="1"
                  :placeholder="t('pivot.savings.amountPlaceholder')"
                />
                <span class="sm-per">{{ t('pivot.savings.perMonthShort') }}</span>
              </label>
              <button
                type="button"
                class="sm-remove"
                :aria-label="t('pivot.savings.removeOther')"
                @click="removeExtra(extra.id)"
              >
                ×
              </button>
            </div>
            <button
              v-if="extras.length < MAX_EXTRA_TOOLS"
              type="button"
              class="sm-add"
              @click="addExtra"
            >
              + {{ t('pivot.savings.addOther') }}
            </button>
          </fieldset>

          <div class="sm-result" aria-live="polite">
            <template v-if="!hasInput">
              <p class="sm-hint">{{ t('pivot.savings.empty') }}</p>
            </template>
            <template v-else>
              <dl class="sm-figures">
                <div>
                  <dt>{{ t('pivot.savings.currentLabel') }}</dt>
                  <dd>
                    {{ fmt(total) }}<span>{{ t('pivot.savings.perMonthShort') }}</span>
                  </dd>
                </div>
                <div>
                  <dt>{{ t('pivot.savings.ainternLabel') }}</dt>
                  <dd>
                    {{ t('pivot.savings.from') }} {{ fmt(AINTERN_FROM_PER_MONTH)
                    }}<span>{{ t('pivot.savings.perMonthShort') }}</span>
                  </dd>
                </div>
                <div class="sm-figure--saving">
                  <dt>{{ t('pivot.savings.savingLabel') }}</dt>
                  <dd data-testid="savings-monthly">
                    {{ fmt(saving) }}<span>{{ t('pivot.savings.perMonthShort') }}</span>
                  </dd>
                </div>
              </dl>
              <p v-if="saving > 0" class="sm-year">
                {{ t('pivot.savings.perYear', { amount: fmt(saving * 12) }) }}
              </p>
              <p v-else class="sm-hint">{{ t('pivot.savings.lowTotal') }}</p>
            </template>
            <p class="sm-disclaimer">{{ t('pivot.savings.disclaimer') }}</p>
          </div>

          <div class="sm-actions">
            <button type="button" class="sm-primary" :disabled="!hasInput" @click="planWithNumbers">
              {{ t('pivot.savings.planWithNumbers') }}
            </button>
            <button type="button" class="sm-secondary" @click="planDirect">
              {{ t('pivot.savings.planDirect') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
  .sm-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .sm-panel {
    background: #1e293b;
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 1.25rem;
    width: 100%;
    max-width: 44rem;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    outline: none;
    box-shadow:
      0 25px 60px rgba(0, 0, 0, 0.5),
      0 8px 24px rgba(79, 70, 229, 0.15);
  }

  .sm-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .sm-title {
    font-family: var(--font-heading, 'Space Grotesk', sans-serif);
    font-size: 1.375rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0;
    line-height: 1.25;
  }

  .sm-sub {
    font-size: 0.9375rem;
    color: #94a3b8;
    margin: 0.25rem 0 0;
  }

  .sm-close {
    flex-shrink: 0;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(99, 102, 241, 0.2);
    background: rgba(99, 102, 241, 0.08);
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .sm-close:hover {
    background: rgba(99, 102, 241, 0.18);
    color: #f1f5f9;
  }

  .sm-fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .sm-legend {
    font-size: 0.875rem;
    font-weight: 600;
    color: #cbd5e1;
    margin-bottom: 0.625rem;
  }

  .sm-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.625rem;
  }

  .sm-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 1px solid #334155;
    border-radius: 0.75rem;
    padding: 0.75rem 0.875rem;
    background: rgba(15, 23, 42, 0.5);
  }

  .sm-row--on {
    border-color: rgba(99, 102, 241, 0.6);
  }

  .sm-check {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    color: #e2e8f0;
    cursor: pointer;
    font-size: 0.9375rem;
  }

  .sm-check input {
    width: 1.05rem;
    height: 1.05rem;
    accent-color: #6366f1;
  }

  .sm-amount {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .sm-amount input,
  .sm-extra-name input {
    width: 100%;
    min-width: 0;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 0.5rem;
    padding: 0.45rem 0.6rem;
    color: #f1f5f9;
    font-size: 0.9375rem;
  }

  .sm-amount input {
    max-width: 7rem;
  }

  .sm-amount input:focus,
  .sm-extra-name input:focus {
    outline: 2px solid #6366f1;
    outline-offset: 1px;
  }

  .sm-per {
    white-space: nowrap;
  }

  .sm-extra {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }

  .sm-extra-name {
    flex: 1;
  }

  .sm-remove {
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    border-radius: 0.5rem;
    border: 1px solid #334155;
    background: transparent;
    color: #94a3b8;
    font-size: 1.125rem;
    cursor: pointer;
  }

  .sm-remove:hover {
    color: #f1f5f9;
  }

  .sm-add {
    align-self: flex-start;
    background: none;
    border: 0;
    padding: 0;
    color: #a5b4fc;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
  }

  .sm-add:hover {
    color: #c7d2fe;
  }

  .sm-result {
    border-radius: 1rem;
    border: 1px solid rgba(99, 102, 241, 0.3);
    background: rgba(15, 23, 42, 0.6);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sm-figures {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin: 0;
  }

  .sm-figures dt {
    font-size: 0.8125rem;
    color: #94a3b8;
  }

  .sm-figures dd {
    margin: 0.25rem 0 0;
    font-family: var(--font-heading, 'Space Grotesk', sans-serif);
    font-size: 1.375rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .sm-figures dd span {
    font-size: 0.8125rem;
    font-weight: 500;
    color: #94a3b8;
    margin-left: 0.125rem;
  }

  .sm-figure--saving dd {
    color: #34d399;
  }

  .sm-year {
    margin: 0;
    color: #34d399;
    font-weight: 600;
  }

  .sm-hint {
    margin: 0;
    color: #cbd5e1;
    font-size: 0.9375rem;
  }

  .sm-disclaimer {
    margin: 0;
    color: #64748b;
    font-size: 0.8125rem;
  }

  .sm-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .sm-primary {
    padding: 0.875rem 1.5rem;
    border-radius: 0.75rem;
    border: 0;
    background: #6366f1;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }

  .sm-primary:hover:not(:disabled) {
    background: #818cf8;
  }

  .sm-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .sm-secondary {
    padding: 0.875rem 1.5rem;
    border-radius: 0.75rem;
    border: 1px solid #334155;
    background: transparent;
    color: #cbd5e1;
    font-weight: 600;
    cursor: pointer;
  }

  .sm-secondary:hover {
    color: #f1f5f9;
    border-color: #475569;
  }

  .sm-enter-active,
  .sm-leave-active {
    transition: opacity 0.2s ease;
  }

  .sm-enter-from,
  .sm-leave-to {
    opacity: 0;
  }

  @media (max-width: 639px) {
    .sm-panel {
      padding: 1.5rem;
      gap: 1.25rem;
    }

    .sm-grid,
    .sm-figures {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
