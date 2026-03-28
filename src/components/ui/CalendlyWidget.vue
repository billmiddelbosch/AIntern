<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  url: string
  height?: number
}>()

onMounted(() => {
  if (!props.url) return
  if (document.getElementById('calendly-widget-script')) return
  const script = document.createElement('script')
  script.id = 'calendly-widget-script'
  script.type = 'text/javascript'
  script.src = 'https://assets.calendly.com/assets/external/widget.js'
  script.async = true
  document.head.appendChild(script)
})
</script>

<template>
  <!-- Calendly inline widget -->
  <div
    v-if="url"
    class="calendly-inline-widget"
    :data-url="`${url}?hide_event_type_details=1&hide_gdpr_banner=1`"
    :style="{ minWidth: '320px', height: (height ?? 700) + 'px' }"
  />

  <!-- Placeholder when no URL configured -->
  <div v-else class="cw-placeholder" :style="{ height: (height ?? 700) + 'px' }">
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
</template>

<style scoped>
.cw-placeholder {
  width: 100%;
  border-radius: 0.75rem;
  background: #1e293b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
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
