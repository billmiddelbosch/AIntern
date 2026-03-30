import { createPinia } from 'pinia'
import { ViteSSG } from 'vite-ssg'

import App from './App.vue'
import { routes } from './router'
import { i18n } from './lib/i18n'
import './assets/main.css'

export const createApp = ViteSSG(App, { routes }, ({ app }) => {
  app.use(createPinia())
  app.use(i18n)
})
