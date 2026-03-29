import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export function createAppRouter(url = '/') {
  return createRouter({
    history: import.meta.env.SSR
      ? createMemoryHistory(url)
      : createWebHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/',
        name: 'home',
        component: HomeView,
      },
    ],
  })
}
