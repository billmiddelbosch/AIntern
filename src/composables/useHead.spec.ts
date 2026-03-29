import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { createHead, renderDOMHead } from '@unhead/vue/client'
import { useHead } from '@/composables/useHead'
import { i18n } from '@/lib/i18n'

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildWrapper() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })

  const TestComponent = defineComponent({
    setup() {
      useHead()
      return () => null
    },
  })

  const head = createHead()

  const wrapper = mount(TestComponent, {
    global: {
      plugins: [i18n, router, head],
    },
  })

  return { wrapper, head }
}

// Flush @unhead/vue v2 DOM updates
async function flushHead(head: ReturnType<typeof createHead>) {
  await nextTick()
  await renderDOMHead(head)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useHead', () => {
  let wrapper: ReturnType<typeof buildWrapper>['wrapper']
  let head: ReturnType<typeof createHead>

  beforeEach(async () => {
    // Reset locale to NL (the app default)
    i18n.global.locale.value = 'nl'
    ;({ wrapper, head } = buildWrapper())
    await flushHead(head)
  })

  afterEach(() => {
    wrapper.unmount()
    // Clean up any appended meta tags between tests
    document.querySelectorAll('meta[data-test], link[data-test]').forEach((el) => el.remove())
  })

  it('sets document.title to the NL SEO title', async () => {
    expect(document.title).toContain('AIntern')
    expect(document.title.length).toBeGreaterThan(10)
  })

  it('sets <html lang> to "nl" when locale is NL', async () => {
    expect(document.documentElement.getAttribute('lang')).toBe('nl')
  })

  it('sets <meta name="description"> with non-empty content', async () => {
    const el = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    expect(el).not.toBeNull()
    expect(el!.content.length).toBeGreaterThan(20)
  })

  it('sets <meta name="robots"> to "index, follow"', async () => {
    const el = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    expect(el).not.toBeNull()
    expect(el!.content).toBe('index, follow')
  })

  it('sets og:title meta tag', async () => {
    const el = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
    expect(el).not.toBeNull()
    expect(el!.getAttribute('content')).toContain('AIntern')
  })

  it('sets og:description meta tag', async () => {
    const el = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')
    expect(el).not.toBeNull()
    expect(el!.getAttribute('content')!.length).toBeGreaterThan(20)
  })

  it('sets og:type to "website"', async () => {
    const el = document.querySelector<HTMLMetaElement>('meta[property="og:type"]')
    expect(el).not.toBeNull()
    expect(el!.getAttribute('content')).toBe('website')
  })

  it('sets og:url meta tag', async () => {
    const el = document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
    expect(el).not.toBeNull()
    expect(el!.getAttribute('content')).toBeTruthy()
  })

  it('sets og:image meta tag', async () => {
    const el = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
    expect(el).not.toBeNull()
    expect(el!.getAttribute('content')).toContain('og-image.png')
  })

  it('sets twitter:card meta tag', async () => {
    const el = document.querySelector<HTMLMetaElement>('meta[name="twitter:card"]')
    expect(el).not.toBeNull()
    expect(el!.content).toBe('summary_large_image')
  })

  it('sets twitter:title meta tag', async () => {
    const el = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')
    expect(el).not.toBeNull()
    expect(el!.content).toContain('AIntern')
  })

  it('sets <link rel="canonical"> with a non-empty href', async () => {
    const el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    expect(el).not.toBeNull()
    expect(el!.href).toBeTruthy()
  })

  it('updates document.title when locale changes to EN', async () => {
    const nlTitle = document.title

    i18n.global.locale.value = 'en'
    await flushHead(head)

    const enTitle = document.title
    expect(enTitle).not.toBe(nlTitle)
    expect(enTitle).toContain('AIntern')
  })

  it('updates <html lang> to "en" when locale changes to EN', async () => {
    i18n.global.locale.value = 'en'
    await flushHead(head)
    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })
})
