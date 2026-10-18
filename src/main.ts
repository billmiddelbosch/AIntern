import { createPinia } from 'pinia'
import { ViteSSG } from 'vite-ssg'

import App from './App.vue'
import { routes } from './router'
import { i18n } from './lib/i18n'
import { useAuthStore } from './stores/useAuthStore'
import './assets/main.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior(to, _from, savedPosition) {
      // Skip during SSG prerender (jsdom has no scrollTo)
      if (import.meta.env.SSR) return false
      if (savedPosition) return savedPosition
      // Header is fixed (h-16); offset anchor jumps so the section title stays visible.
      // Only plain ids: a malformed hash would make querySelector throw.
      if (/^#[\w-]+$/.test(to.hash)) return { el: to.hash, top: 64, behavior: 'smooth' }
      return { top: 0 }
    },
  },
  ({ app, router }) => {
    app.use(createPinia())
    app.use(i18n)

    router.beforeEach((to) => {
      const auth = useAuthStore()

      // Hydrate token from localStorage on first navigation (SSR-safe)
      if (auth.token === null) auth.initFromStorage()

      // Redirect unauthenticated users away from protected routes
      if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return { name: 'admin-login', query: { redirect: to.fullPath } }
      }

      // Redirect authenticated users away from the login page
      if (to.name === 'admin-login' && auth.isAuthenticated) {
        return { name: 'admin-dashboard' }
      }
    })
  },
)
