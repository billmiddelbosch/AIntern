<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, createApp, defineComponent, reactive } from 'vue'
import type { App } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ code: string }>()
const { t } = useI18n()

const containerRef = ref<HTMLElement>()
const previewError = ref<string | null>(null)
let previewApp: App | null = null
let styleEl: HTMLStyleElement | null = null

function unmountPreview() {
  if (previewApp) { previewApp.unmount(); previewApp = null }
  if (styleEl) { styleEl.remove(); styleEl = null }
}

function extractTemplate(code: string): string {
  const match = code.match(/<template[\s\S]*?>([\s\S]*?)<\/template>/)
  return match
    ? match[1].trim()
    : '<div style="color:#94a3b8;font-size:13px">No template block found.</div>'
}

function extractMockProps(code: string): Record<string, unknown> {
  const scriptMatch = code.match(/<script\b[^>]*\bsetup\b[^>]*>([\s\S]*?)<\/script>/)
  const scriptContent = scriptMatch ? scriptMatch[1] : ''
  const mockProps: Record<string, unknown> = {}

  let propLines: string[] = []
  const inlineM = scriptContent.match(/defineProps<\{([\s\S]*?)\}>/)
  if (inlineM) {
    propLines = inlineM[1].split(/[\n;]/)
  } else {
    const typeNameM = scriptContent.match(/defineProps<(\w+)>/)
    if (typeNameM) {
      const re = new RegExp(
        `(?:interface|type)\\s+${typeNameM[1]}\\s*(?:=\\s*)?\\{([\\s\\S]*?)\\}`,
      )
      const im = scriptContent.match(re)
      if (im) propLines = im[1].split(/[\n;]/)
    }
  }

  for (const line of propLines) {
    const m = line.trim().match(/^(\w+)\??:\s*([\w|\s<>[\]&]+?)\s*$/)
    if (!m) continue
    const [, name, type] = m
    const t = type.trim()
    mockProps[name] = t.includes('string')
      ? `[${name}]`
      : t.includes('number')
        ? 42
        : t.includes('boolean')
          ? true
          : null
  }

  const withDefaultsM = scriptContent.match(/withDefaults\s*\([\s\S]*?,\s*\{([\s\S]*?)\}\s*\)/)
  if (withDefaultsM) {
    const dText = withDefaultsM[1]
    for (const [, k, sq, dq] of [...dText.matchAll(/(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)")/g)])
      mockProps[k] = sq !== undefined ? sq : (dq ?? '')
    for (const [, k, v] of [...dText.matchAll(/(\w+)\s*:\s*(\d+(?:\.\d+)?)/g)])
      if (!(k in mockProps)) mockProps[k] = Number(v)
    for (const [, k, v] of [...dText.matchAll(/(\w+)\s*:\s*(true|false)/g)])
      if (!(k in mockProps)) mockProps[k] = v === 'true'
  }

  return mockProps
}

function mountPreview(code: string) {
  unmountPreview()
  previewError.value = null

  if (!containerRef.value || !code.trim()) return

  try {
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    if (styleMatch) {
      styleEl = document.createElement('style')
      styleEl.textContent = styleMatch[1]
      document.head.appendChild(styleEl)
    }

    const template = extractTemplate(code)
    const mockProps = extractMockProps(code)

    const component = defineComponent({
      template,
      setup() {
        const p = reactive(mockProps)
        return { ...p, props: p }
      },
    })

    previewApp = createApp(component)
    previewApp.mount(containerRef.value)
  } catch (e) {
    previewError.value = String(e)
  }
}

onMounted(() => mountPreview(props.code))
watch(() => props.code, (code) => mountPreview(code))
onUnmounted(unmountPreview)
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
      <span class="text-xs font-medium text-slate-600 uppercase tracking-wide">
        {{ t('admin.aiStudio.previewLabel') }}
      </span>
      <span class="text-xs text-slate-400">
        {{ t('admin.aiStudio.previewSandboxNote') }}
      </span>
    </div>

    <div class="flex-1 relative bg-white overflow-auto">
      <div
        v-if="!code.trim()"
        class="absolute inset-0 flex items-center justify-center bg-slate-50"
      >
        <p class="text-sm text-slate-400">{{ t('admin.aiStudio.previewEmpty') }}</p>
      </div>

      <div
        v-if="previewError"
        class="m-4 p-3 text-xs font-mono text-red-600 bg-red-50 border border-red-200 rounded-lg"
      >{{ previewError }}</div>

      <div ref="containerRef" />
    </div>
  </div>
</template>
