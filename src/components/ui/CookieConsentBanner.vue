<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useConsentStore } from '@/stores/useConsentStore'

const { t } = useI18n()
const consentStore = useConsentStore()
</script>

<template>
  <Transition name="ccb">
    <div
      v-if="!consentStore.hasDecided"
      class="ccb-banner"
      role="region"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <div class="ccb-inner">
        <!-- Icon -->
        <div class="ccb-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 6v4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="10" cy="14" r="1" fill="currentColor"/>
          </svg>
        </div>

        <!-- Message -->
        <p class="ccb-message">{{ t('cookieConsent.message') }}</p>

        <!-- Actions -->
        <div class="ccb-actions">
          <button
            class="ccb-btn ccb-btn--decline"
            type="button"
            @click="consentStore.decline()"
          >
            {{ t('cookieConsent.declineLabel') }}
          </button>
          <button
            class="ccb-btn ccb-btn--accept"
            type="button"
            @click="consentStore.accept()"
          >
            {{ t('cookieConsent.acceptLabel') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ccb-banner {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9000;
  width: calc(100% - 2rem);
  max-width: 52rem;
  background: #0f172a;
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 1rem;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(79, 70, 229, 0.12);
  padding: 1rem 1.25rem;
}

.ccb-inner {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-wrap: wrap;
}

.ccb-icon {
  flex-shrink: 0;
  color: #6366f1;
  display: flex;
  align-items: center;
}

.ccb-message {
  flex: 1;
  min-width: 14rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #94a3b8;
  margin: 0;
}

.ccb-actions {
  display: flex;
  gap: 0.625rem;
  flex-shrink: 0;
}

.ccb-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  white-space: nowrap;
}

.ccb-btn--decline {
  background: transparent;
  border: 1px solid rgba(99, 102, 241, 0.2);
  color: #64748b;
}

.ccb-btn--decline:hover {
  background: rgba(99, 102, 241, 0.06);
  border-color: rgba(99, 102, 241, 0.35);
  color: #94a3b8;
}

.ccb-btn--accept {
  background: #6366f1;
  border: 1px solid transparent;
  color: #ffffff;
}

.ccb-btn--accept:hover {
  background: #4f46e5;
}

/* Transition */
.ccb-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.ccb-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.ccb-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}

.ccb-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(0.5rem);
}

@media (max-width: 480px) {
  .ccb-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .ccb-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
