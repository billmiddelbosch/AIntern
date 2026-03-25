<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="ncnp-prop">
    <!-- Badge -->
    <div class="ncnp-prop__badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>{{ t('noCureNoPay.proposition.badge') }}</span>
    </div>

    <!-- Heading -->
    <h3 class="ncnp-prop__heading">{{ t('noCureNoPay.proposition.heading') }}</h3>

    <!-- Key points -->
    <ul class="ncnp-prop__points">
      <li v-for="n in 3" :key="n" class="ncnp-prop__point">
        <svg class="ncnp-prop__check" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>{{ t(`noCureNoPay.proposition.point${n}`) }}</span>
      </li>
    </ul>

    <!-- CTA -->
    <RouterLink to="#contact" class="ncnp-prop__cta">
      {{ t('noCureNoPay.proposition.cta') }}
    </RouterLink>
  </div>
</template>

<style scoped>
.ncnp-prop {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Badge */
.ncnp-prop__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  font-size: 0.8125rem;
  font-weight: 600;
  width: fit-content;
}

/* Heading */
.ncnp-prop__heading {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

/* Points */
.ncnp-prop__points {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.ncnp-prop__point {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.9375rem;
  color: #cbd5e1;
  line-height: 1.5;
}

.ncnp-prop__check {
  flex-shrink: 0;
  margin-top: 0.1rem;
  color: #818cf8;
}

/* CTA */
.ncnp-prop__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.75rem;
  border-radius: 0.625rem;
  background: #6366f1;
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  width: fit-content;
  transition: background 0.2s ease, transform 0.15s ease;
}

.ncnp-prop__cta:hover {
  background: #4f46e5;
  transform: translateY(-1px);
}
</style>
