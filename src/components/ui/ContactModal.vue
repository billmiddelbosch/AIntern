<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useContactForm } from '@/composables/useContactForm'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { name, email, message, status, submit, reset } = useContactForm()

function close() {
  reset()
  emit('close')
}

async function handleSubmit() {
  await submit()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="cm-backdrop" role="dialog" aria-modal="true" :aria-label="t('contactModal.title')" @click.self="close">
        <div class="cm-panel">
          <!-- Header -->
          <div class="cm-header">
            <h2 class="cm-title">{{ t('contactModal.title') }}</h2>
            <button class="cm-close" :aria-label="t('contactModal.close')" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Success state -->
          <div v-if="status === 'success'" class="cm-success">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="20" fill="#ecfdf5"/>
              <path d="M12 20.5l6 6 10-12" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>{{ t('contactModal.success') }}</p>
            <button class="cm-btn-primary" @click="close">{{ t('contactModal.close') }}</button>
          </div>

          <!-- Form state -->
          <form v-else class="cm-form" @submit.prevent="handleSubmit">
            <div class="cm-field">
              <input
                v-model="name"
                type="text"
                required
                :placeholder="t('contactModal.namePlaceholder')"
                class="cm-input"
                :disabled="status === 'loading'"
              />
            </div>
            <div class="cm-field">
              <input
                v-model="email"
                type="email"
                required
                :placeholder="t('contactModal.emailPlaceholder')"
                class="cm-input"
                :disabled="status === 'loading'"
              />
            </div>
            <div class="cm-field">
              <textarea
                v-model="message"
                required
                rows="4"
                :placeholder="t('contactModal.messagePlaceholder')"
                class="cm-input cm-textarea"
                :disabled="status === 'loading'"
              />
            </div>

            <p v-if="status === 'error'" class="cm-error">{{ t('contactModal.error') }}</p>

            <button type="submit" class="cm-btn-primary" :disabled="status === 'loading'">
              {{ status === 'loading' ? t('contactModal.submitting') : t('contactModal.submit') }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.cm-panel {
  background: #ffffff;
  border-radius: 1.25rem;
  width: 100%;
  max-width: 28rem;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  overflow: hidden;
}

.cm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0;
}

.cm-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.cm-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 0.25rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background 0.15s ease;
}

.cm-close:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.cm-form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1.25rem 1.5rem 1.5rem;
}

.cm-field {
  display: flex;
  flex-direction: column;
}

.cm-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.625rem;
  font-size: 0.9375rem;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.cm-input::placeholder {
  color: #94a3b8;
}

.cm-input:focus {
  border-color: #6366f1;
  background: #ffffff;
}

.cm-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cm-textarea {
  resize: vertical;
  min-height: 7rem;
}

.cm-error {
  font-size: 0.875rem;
  color: #ef4444;
  margin: 0;
}

.cm-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 700;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
  width: 100%;
  font-family: inherit;
}

.cm-btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.cm-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cm-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
}

.cm-success p {
  font-size: 1rem;
  color: #334155;
  margin: 0;
  line-height: 1.6;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .cm-panel,
.modal-leave-active .cm-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .cm-panel,
.modal-leave-to .cm-panel {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
