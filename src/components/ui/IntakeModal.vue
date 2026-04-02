<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIntakeModal } from '@/composables/useIntakeModal'
import { useBookingModal } from '@/composables/useBookingModal'

const { t } = useI18n()
const { isOpen, closeIntakeModal } = useIntakeModal()
const { openBookingModal } = useBookingModal()

const TOTAL_STEPS = 5

const currentStep = ref(1)

// Form state — never persisted, cleared on close
const answers = ref({
  companySize: '' as string,
  processDescription: '' as string,
  processDuration: '' as string,
  triedBefore: '' as string,
  impact: '' as string,
})

const touched = ref(false)

const currentAnswer = computed(() => {
  switch (currentStep.value) {
    case 1: return answers.value.companySize
    case 2: return answers.value.processDescription
    case 3: return answers.value.processDuration
    case 4: return answers.value.triedBefore
    case 5: return answers.value.impact
    default: return ''
  }
})

const isCurrentStepValid = computed(() => currentAnswer.value.trim().length > 0)

const progressPercent = computed(() => ((currentStep.value - 1) / TOTAL_STEPS) * 100)

function resetForm() {
  currentStep.value = 1
  answers.value = {
    companySize: '',
    processDescription: '',
    processDuration: '',
    triedBefore: '',
    impact: '',
  }
  touched.value = false
}

function handleClose() {
  resetForm()
  closeIntakeModal()
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) handleClose()
}

function goNext() {
  touched.value = true
  if (!isCurrentStepValid.value) return
  touched.value = false
  if (currentStep.value < TOTAL_STEPS) {
    currentStep.value++
  } else {
    // Final step — close intake and open Calendly
    handleClose()
    openBookingModal()
  }
}

function goBack() {
  touched.value = false
  if (currentStep.value > 1) currentStep.value--
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') handleClose()
}

const companySizeOptions = ['xs', 's', 'm', 'l'] as const
const processDurationOptions = ['xs', 's', 'm', 'l'] as const
const triedBeforeOptions = ['yes', 'no', 'partial'] as const
</script>

<template>
  <Teleport to="body">
    <Transition name="im">
      <div
        v-if="isOpen"
        class="im-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="t('intakeModal.title')"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="im-panel" tabindex="-1">
          <!-- Header -->
          <div class="im-header">
            <div class="im-header-text">
              <h2 class="im-title">{{ t('intakeModal.title') }}</h2>
              <p class="im-progress-label">
                {{ t('intakeModal.progressStep', { current: currentStep, total: TOTAL_STEPS }) }}
              </p>
            </div>
            <button class="im-close" :aria-label="t('intakeModal.close')" @click="handleClose">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Progress bar -->
          <div class="im-progress-bar-wrap" :aria-label="t('intakeModal.progressBar')" role="progressbar" :aria-valuenow="currentStep" :aria-valuemin="1" :aria-valuemax="TOTAL_STEPS">
            <div class="im-progress-bar" :style="{ width: progressPercent + '%' }" />
          </div>

          <!-- Step content -->
          <div class="im-body">
            <!-- Step 1: Company size -->
            <Transition name="im-step" mode="out-in">
              <div v-if="currentStep === 1" key="step1" class="im-step">
                <p class="im-question">{{ t('intakeModal.step1.question') }}</p>
                <div class="im-options">
                  <button
                    v-for="opt in companySizeOptions"
                    :key="opt"
                    class="im-option"
                    :class="{ 'im-option--selected': answers.companySize === opt }"
                    @click="answers.companySize = opt"
                  >
                    {{ t(`intakeModal.step1.options.${opt}`) }}
                  </button>
                </div>
                <p v-if="touched && !isCurrentStepValid" class="im-error" role="alert">
                  {{ t('intakeModal.required') }}
                </p>
              </div>
            </Transition>

            <!-- Step 2: Process description -->
            <Transition name="im-step" mode="out-in">
              <div v-if="currentStep === 2" key="step2" class="im-step">
                <label class="im-question" for="im-process-description">
                  {{ t('intakeModal.step2.question') }}
                </label>
                <textarea
                  id="im-process-description"
                  v-model="answers.processDescription"
                  class="im-textarea"
                  :placeholder="t('intakeModal.step2.placeholder')"
                  rows="4"
                  :aria-required="true"
                />
                <p v-if="touched && !isCurrentStepValid" class="im-error" role="alert">
                  {{ t('intakeModal.required') }}
                </p>
              </div>
            </Transition>

            <!-- Step 3: Duration -->
            <Transition name="im-step" mode="out-in">
              <div v-if="currentStep === 3" key="step3" class="im-step">
                <p class="im-question">{{ t('intakeModal.step3.question') }}</p>
                <div class="im-options">
                  <button
                    v-for="opt in processDurationOptions"
                    :key="opt"
                    class="im-option"
                    :class="{ 'im-option--selected': answers.processDuration === opt }"
                    @click="answers.processDuration = opt"
                  >
                    {{ t(`intakeModal.step3.options.${opt}`) }}
                  </button>
                </div>
                <p v-if="touched && !isCurrentStepValid" class="im-error" role="alert">
                  {{ t('intakeModal.required') }}
                </p>
              </div>
            </Transition>

            <!-- Step 4: Tried before -->
            <Transition name="im-step" mode="out-in">
              <div v-if="currentStep === 4" key="step4" class="im-step">
                <p class="im-question">{{ t('intakeModal.step4.question') }}</p>
                <div class="im-options im-options--compact">
                  <button
                    v-for="opt in triedBeforeOptions"
                    :key="opt"
                    class="im-option"
                    :class="{ 'im-option--selected': answers.triedBefore === opt }"
                    @click="answers.triedBefore = opt"
                  >
                    {{ t(`intakeModal.step4.options.${opt}`) }}
                  </button>
                </div>
                <p v-if="touched && !isCurrentStepValid" class="im-error" role="alert">
                  {{ t('intakeModal.required') }}
                </p>
              </div>
            </Transition>

            <!-- Step 5: Impact -->
            <Transition name="im-step" mode="out-in">
              <div v-if="currentStep === 5" key="step5" class="im-step">
                <label class="im-question" for="im-impact">
                  {{ t('intakeModal.step5.question') }}
                </label>
                <textarea
                  id="im-impact"
                  v-model="answers.impact"
                  class="im-textarea"
                  :placeholder="t('intakeModal.step5.placeholder')"
                  rows="4"
                  :aria-required="true"
                />
                <p v-if="touched && !isCurrentStepValid" class="im-error" role="alert">
                  {{ t('intakeModal.required') }}
                </p>
              </div>
            </Transition>
          </div>

          <!-- Navigation -->
          <div class="im-nav">
            <button
              v-if="currentStep > 1"
              class="im-btn-back"
              @click="goBack"
            >
              {{ t('intakeModal.back') }}
            </button>
            <div v-else />

            <button
              class="im-btn-next"
              @click="goNext"
            >
              {{ currentStep < TOTAL_STEPS ? t('intakeModal.next') : t('intakeModal.submit') }}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <!-- GDPR notice -->
          <p class="im-gdpr">{{ t('intakeModal.gdprNotice') }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.im-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.im-panel {
  background: #1e293b;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 36rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 2rem;
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(79, 70, 229, 0.15);
}

/* Header */
.im-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.im-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.im-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
  line-height: 1.25;
}

.im-progress-label {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

.im-close {
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
  transition: background 0.15s ease, color 0.15s ease;
}

.im-close:hover {
  background: rgba(99, 102, 241, 0.18);
  color: #f1f5f9;
}

/* Progress bar */
.im-progress-bar-wrap {
  height: 4px;
  background: rgba(99, 102, 241, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.im-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #a78bfa);
  border-radius: 2px;
  transition: width 0.35s ease;
}

/* Body */
.im-body {
  min-height: 14rem;
  display: flex;
  flex-direction: column;
}

.im-step {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.im-question {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.4;
  margin: 0;
}

/* Options (multiple choice) */
.im-options {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.im-options--compact {
  flex-direction: row;
  flex-wrap: wrap;
}

.im-option {
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  border: 1.5px solid rgba(99, 102, 241, 0.2);
  background: rgba(99, 102, 241, 0.05);
  color: #94a3b8;
  font-size: 0.9375rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.im-option:hover {
  border-color: rgba(99, 102, 241, 0.5);
  background: rgba(99, 102, 241, 0.1);
  color: #e2e8f0;
}

.im-option--selected {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.18);
  color: #f1f5f9;
}

/* Textarea */
.im-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(99, 102, 241, 0.05);
  border: 1.5px solid rgba(99, 102, 241, 0.2);
  border-radius: 0.625rem;
  color: #f1f5f9;
  font-size: 0.9375rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.15s, background 0.15s;
  font-family: inherit;
  box-sizing: border-box;
}

.im-textarea::placeholder {
  color: #475569;
}

.im-textarea:focus {
  outline: none;
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

/* Error */
.im-error {
  font-size: 0.8125rem;
  color: #f87171;
  margin: 0;
}

/* Navigation */
.im-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.im-btn-back {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  border: 1.5px solid rgba(99, 102, 241, 0.2);
  background: transparent;
  color: #64748b;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.im-btn-back:hover {
  color: #94a3b8;
  border-color: rgba(99, 102, 241, 0.4);
}

.im-btn-next {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 0.625rem;
  border: none;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  margin-left: auto;
}

.im-btn-next:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
}

.im-btn-next:active {
  transform: translateY(0);
}

/* GDPR notice */
.im-gdpr {
  font-size: 0.75rem;
  color: #475569;
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

/* Transitions */
.im-enter-active,
.im-leave-active {
  transition: opacity 0.2s ease;
}

.im-enter-active .im-panel,
.im-leave-active .im-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.im-enter-from,
.im-leave-to {
  opacity: 0;
}

.im-enter-from .im-panel,
.im-leave-to .im-panel {
  transform: translateY(1.5rem);
  opacity: 0;
}

/* Step transition */
.im-step-enter-active,
.im-step-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.im-step-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}

.im-step-leave-to {
  opacity: 0;
  transform: translateX(-1rem);
}

@media (max-width: 639px) {
  .im-panel {
    padding: 1.5rem;
    gap: 1.25rem;
  }

  .im-title {
    font-size: 1.125rem;
  }

  .im-options--compact {
    flex-direction: column;
  }
}
</style>
