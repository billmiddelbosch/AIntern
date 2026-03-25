<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MetricCard, AutomatedProcess } from '@/../product/sections/hero-value-proposition/types'

defineProps<{
  metricCards: MetricCard[]
  automatedProcesses: AutomatedProcess[]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="mockup-frame">
    <!-- Window chrome -->
    <div class="mockup-header">
      <div class="mockup-dots">
        <span class="dot dot-red" />
        <span class="dot dot-yellow" />
        <span class="dot dot-green" />
      </div>
      <span class="mockup-title">{{ t('hero.mockupTitle') }}</span>
      <span class="mockup-live">
        <span class="live-dot" />
        {{ t('hero.mockupLive') }}
      </span>
    </div>

    <!-- Metric cards grid -->
    <div class="metrics-grid">
      <div
        v-for="card in metricCards"
        :key="card.id"
        class="metric-card"
      >
        <span class="metric-value">{{ card.value }}</span>
        <span class="metric-label">{{ card.label }}</span>
        <span class="metric-desc">{{ card.description }}</span>
      </div>
    </div>

    <!-- Automated processes list -->
    <div class="processes-section">
      <p class="processes-title">{{ t('hero.processesTitle') }}</p>
      <ul class="processes-list">
        <li
          v-for="process in automatedProcesses.filter(p => p.status === 'active')"
          :key="process.id"
          class="process-item"
        >
          <span class="process-name">{{ process.name }}</span>
          <span class="process-meta">
            <span class="process-badge">{{ t('hero.statusActive') }}</span>
            <span class="process-tasks">{{ process.tasksPerWeek }} {{ t('hero.tasksPerWeek') }}</span>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.mockup-frame {
  background: #0f172a;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08),
    0 32px 64px -12px rgba(0,0,0,0.5),
    0 16px 32px -8px rgba(99,102,241,0.15);
}

.mockup-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: #1e293b;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.mockup-dots {
  display: flex;
  gap: 0.375rem;
}

.dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
}

.dot-red    { background: #ef4444; }
.dot-yellow { background: #f59e0b; }
.dot-green  { background: #22c55e; }

.mockup-title {
  flex: 1;
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  letter-spacing: 0.025em;
}

.mockup-live {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #4ade80;
}

.live-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #4ade80;
  animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* Metric cards */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.25rem;
  background: #0f172a;
}

.metric-value {
  font-family: var(--font-heading, 'Space Grotesk', sans-serif);
  font-size: 1.375rem;
  font-weight: 700;
  color: #818cf8;
  line-height: 1.2;
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-desc {
  font-size: 0.6875rem;
  color: #64748b;
}

/* Processes */
.processes-section {
  padding: 1rem 1.25rem;
}

.processes-title {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 0.625rem;
}

.processes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.process-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.process-name {
  font-size: 0.8125rem;
  color: #cbd5e1;
}

.process-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.process-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: rgba(74,222,128,0.12);
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.process-tasks {
  font-size: 0.75rem;
  color: #475569;
  min-width: 5rem;
  text-align: right;
}
</style>
