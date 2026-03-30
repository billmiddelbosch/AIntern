import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead, renderSSRHead } from '@unhead/vue/server'
import { renderToString } from 'vue/server-renderer'

import App from './App.vue'
import { createAppRouter } from './router'
import { i18n } from './lib/i18n'

export async function render(url: string) {
  const app = createSSRApp(App)
  const pinia = createPinia()
  const router = createAppRouter(url)
  const head = createHead()

  app.use(pinia)
  app.use(router)
  app.use(i18n)
  app.use(head)

  await router.push(url)
  await router.isReady()

  const ctx: { teleports?: Record<string, string> } = {}
  const html = await renderToString(app, ctx)
  const headPayload = await renderSSRHead(head)

  return { html, headPayload, teleports: ctx.teleports ?? {} }
}
