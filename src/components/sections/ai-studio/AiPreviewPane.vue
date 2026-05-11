<!--
  AiPreviewPane.vue [ORGANISM]

  Atomic Level: Organism
  Atomic Rationale: Owns the compilation domain logic — it compiles the SFC
  code string into an iframe srcdoc, handles compile errors, manages the
  debounce watcher, and injects mock data for template previews. It is an
  organism because it encapsulates complex behaviour (Vue runtime compiler,
  iframe management, error handling) that no molecule or atom should carry.

  Technical decisions from spec (OQ-3 resolved):
  - iframe srcdoc includes Tailwind CDN play CDN for accurate styling preview
  - sandbox="allow-scripts" — NO allow-same-origin (XSS mitigation per spec)
  - The error display in the compile-error state uses textContent assignment,
    not innerHTML, to prevent XSS from compiler error messages.
  - srcdoc is a static HTML string — Vue compiler errors are shown in the
    Vue layer (compileError ref), not injected into the srcdoc.
  - Debounce 300ms on code watcher to avoid thrashing

  Layout (8pt grid):
  ┌──────────────────────────────────────────────────────┐
  │ Preview                              [Vernieuwen]    │ ← toolbar, bg-slate-50 border-b
  ├──────────────────────────────────────────────────────┤
  │                                                      │
  │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │
  │  │       iframe — compiled component renders here  │  │ ← flex-1, w-full, bg-white
  │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
  │                                                      │
  │  [empty state] "Genereer een component om een       │ ← centered, slate-400
  │   preview te zien"                                   │
  │                                                      │
  │  [error state] red border + error message           │ ← compile error display (textContent)
  └──────────────────────────────────────────────────────┘

  The iframe min-height is 320px so the pane always occupies meaningful space
  even before generation.
-->
<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { MockArticleData } from '@/../product/sections/ai-studio/types'

const props = defineProps<{
  code: string
  mockData?: MockArticleData
}>()

// ── State ────────────────────────────────────────────────────────────────────

const iframeRef = ref<HTMLIFrameElement | null>(null)
const compileError = ref<string | null>(null)
const isCompiling = ref(false)

// ── Srcdoc builder ────────────────────────────────────────────────────────────
//
// Builds a standalone HTML page that:
//   1. Loads Tailwind CDN play CDN (OQ-3 resolved)
//   2. Loads Vue 3 from unpkg ESM
//   3. Runs the SFC component in the page
//
// Security: sandbox="allow-scripts" only — no allow-same-origin.
// Error display inside the srcdoc page uses textContent assignment (not
// innerHTML) so compiler error strings cannot be interpreted as HTML.
//
function buildSrcdoc(sfcCode: string, mockData?: MockArticleData): string {
  // Escape characters that would break the template literal inside the
  // script block embedded in the srcdoc string.
  const escaped = sfcCode
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${')

  const mockJson = mockData ? JSON.stringify(mockData) : 'null'

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" />
  <style>
    body { margin: 0; padding: 16px; font-family: Inter, system-ui, sans-serif; }
    #compile-error {
      color: #dc2626; font-family: monospace; font-size: 12px;
      padding: 12px; background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 8px; white-space: pre-wrap; display: none;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <pre id="compile-error"></pre>
  <script type="module">
    import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

    const MOCK_DATA = ${mockJson};

    function extractTemplate(sfc) {
      const m = sfc.match(/<template[^>]*>([\\s\\S]*?)<\\/template>/);
      return m ? m[1].trim() : '<div>No template block found</div>';
    }

    try {
      const sfcSource = \`${escaped}\`;
      const template = extractTemplate(sfcSource);

      const componentOptions = MOCK_DATA
        ? { template, setup() { return { ...MOCK_DATA }; } }
        : { template };

      createApp(componentOptions).mount('#app');
    } catch (err) {
      const errorEl = document.getElementById('compile-error');
      errorEl.style.display = 'block';
      // Use textContent to prevent XSS from error message strings
      errorEl.textContent = 'Compile error:\\n' + String(err);
    }
  <\/script>
</body>
</html>`
}

// ── Debounced re-render ───────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRender(code: string) {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!code.trim()) {
    compileError.value = null
    return
  }
  isCompiling.value = true
  debounceTimer = setTimeout(() => {
    try {
      compileError.value = null
      if (iframeRef.value) {
        iframeRef.value.srcdoc = buildSrcdoc(code, props.mockData)
      }
    } catch (err) {
      compileError.value = String(err)
    } finally {
      isCompiling.value = false
    }
  }, 300)
}

watch(() => props.code, (newCode) => scheduleRender(newCode), { immediate: true })
watch(() => props.mockData, () => { if (props.code) scheduleRender(props.code) })

onMounted(() => { if (props.code) scheduleRender(props.code) })

function manualRefresh() {
  scheduleRender(props.code)
}
</script>

<template>
  <div class="flex flex-col h-full border border-slate-200 rounded-xl overflow-hidden bg-white">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-slate-700">Preview</span>
        <span v-if="isCompiling" class="inline-flex items-center gap-1 text-xs text-slate-400">
          <svg class="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Compileren...
        </span>
        <span
          v-if="compileError"
          class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600"
        >
          Compile error
        </span>
        <span
          v-if="props.mockData && !compileError"
          class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600"
        >
          Mock data
        </span>
      </div>

      <button
        type="button"
        :disabled="!props.code"
        class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-300"
        aria-label="Preview vernieuwen"
        @click="manualRefresh"
      >
        <svg
          class="w-3.5 h-3.5 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
        </svg>
        Vernieuwen
      </button>
    </div>

    <!-- Content area -->
    <div class="relative flex-1" style="min-height: 320px">
      <!-- Empty state: no code yet -->
      <div
        v-if="!props.code"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50"
      >
        <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <svg
            class="w-6 h-6 text-slate-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <p class="text-sm text-slate-400 text-center max-w-[200px]">
          Genereer een component om de preview te zien
        </p>
      </div>

      <!-- Vue-level compile error (caught before srcdoc assignment) -->
      <div
        v-else-if="compileError"
        class="absolute inset-0 overflow-auto bg-red-50 p-4"
      >
        <div class="border border-red-200 rounded-lg p-3">
          <p class="text-xs font-semibold text-red-700 mb-2">Compile error</p>
          <!-- textContent equivalent in Vue: {{ }} binding, not v-html -->
          <pre class="text-xs text-red-600 whitespace-pre-wrap font-mono leading-relaxed">{{ compileError }}</pre>
        </div>
      </div>

      <!--
        iframe — sandbox="allow-scripts" only, NO allow-same-origin.
        srcdoc is assigned programmatically after successful build.
        Runtime errors inside the srcdoc page are caught by the inline
        try/catch and displayed via textContent (not innerHTML).
      -->
      <iframe
        v-else
        ref="iframeRef"
        sandbox="allow-scripts"
        class="absolute inset-0 h-full w-full border-0 bg-white"
        title="Component preview"
        aria-label="Rendered component preview"
      />
    </div>
  </div>
</template>
