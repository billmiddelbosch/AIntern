<script setup lang="ts">
import { useBookingModal } from '@/composables/useBookingModal'
import CalendlyWidget from '@/components/ui/CalendlyWidget.vue'

const { isOpen, closeBookingModal } = useBookingModal()

const calendlyUrl = (import.meta.env.VITE_CALENDLY_URL as string | undefined) ?? ''

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) closeBookingModal()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bm">
      <div
        v-if="isOpen"
        class="bm-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Gratis kennismakingsgesprek inplannen"
        @click="handleBackdropClick"
        @keydown.esc="closeBookingModal"
      >
        <div class="bm-panel">
          <!-- Header -->
          <div class="bm-header">
            <div class="bm-header-text">
              <h2 class="bm-title">Plan een gratis kennismakingsgesprek</h2>
              <p class="bm-sub">Kies een moment dat jou uitkomt — geen verplichtingen.</p>
            </div>
            <button class="bm-close" aria-label="Sluiten" @click="closeBookingModal">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Calendly widget -->
          <CalendlyWidget :url="calendlyUrl" :height="700" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bm-backdrop {
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

.bm-panel {
  background: #1e293b;
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 1.25rem;
  width: 100%;
  max-width: 52rem;
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

.bm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.bm-header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bm-title {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.375rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
  line-height: 1.25;
}

.bm-sub {
  font-size: 0.9375rem;
  color: #64748b;
  margin: 0;
}

.bm-close {
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

.bm-close:hover {
  background: rgba(99, 102, 241, 0.18);
  color: #f1f5f9;
}

/* Transition */
.bm-enter-active,
.bm-leave-active {
  transition: opacity 0.2s ease;
}

.bm-enter-active .bm-panel,
.bm-leave-active .bm-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.bm-enter-from,
.bm-leave-to {
  opacity: 0;
}

.bm-enter-from .bm-panel,
.bm-leave-to .bm-panel {
  transform: translateY(1.5rem);
  opacity: 0;
}

@media (max-width: 639px) {
  .bm-panel {
    padding: 1.5rem;
    gap: 1.25rem;
  }

  .bm-title {
    font-size: 1.125rem;
  }
}
</style>
