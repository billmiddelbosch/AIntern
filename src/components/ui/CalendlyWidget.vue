<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Full Calendly embed URL — driven by VITE_CALENDLY_URL */
  url: string
  /** Pixel height of the embed (default 630) */
  height?: number
  /** Primary accent colour passed to Calendly embed, hex without # (default 4f46e5) */
  primaryColor?: string
}>()

const resolvedHeight = computed(() => props.height ?? 630)
const resolvedColor = computed(() => props.primaryColor ?? '4f46e5')

const iframeSrc = computed(() => {
  if (!props.url) return ''
  const base = props.url.replace(/\/$/, '')
  return `${base}?embed_type=Inline&hide_event_type_details=0&hide_gdpr_banner=1&primary_color=${resolvedColor.value}`
})

const hasUrl = computed(() => Boolean(props.url))
</script>

<template>
  <!-- Calendly inline embed -->
  <div class="cw-root" :style="{ height: resolvedHeight + 'px' }">
    <iframe
      v-if="hasUrl"
      :src="iframeSrc"
      :height="resolvedHeight"
      class="cw-iframe"
      frameborder="0"
      scrolling="yes"
      title="Calendly booking widget"
      loading="lazy"
    />

    <!-- Placeholder when no URL is configured -->
    <div v-else class="cw-placeholder">
      <div class="cw-placeholder-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="3" y="5" width="26" height="24" rx="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <path d="M3 12h26" stroke="currentColor" stroke-width="1.5"/>
          <path d="M10 3v4M22 3v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <rect x="8" y="17" width="5" height="4" rx="1" fill="currentColor" opacity="0.4"/>
          <rect x="16" y="17" width="5" height="4" rx="1" fill="currentColor" opacity="0.6"/>
        </svg>
      </div>
      <p class="cw-placeholder-text">Calendly booking widget</p>
      <p class="cw-placeholder-sub">Configure <code>VITE_CALENDLY_URL</code> to enable inline scheduling.</p>
    </div>
  </div>
</template>

<style scoped>
.cw-root {
  width: 100%;
  overflow: hidden;
  border-radius: 0.75rem;
  background: #1e293b;
  position: relative;
}

.cw-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  border-radius: 0.75rem;
}

/* Placeholder state */
.cw-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.cw-placeholder-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
}

.cw-placeholder-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #94a3b8;
  margin: 0;
}

.cw-placeholder-sub {
  font-size: 0.8125rem;
  color: #475569;
  margin: 0;
  line-height: 1.5;
}

.cw-placeholder-sub code {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: ui-monospace, 'Cascadia Code', monospace;
}
</style>
