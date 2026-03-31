import type { RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/kennisbank',
    name: 'kennisbank',
    component: () => import('@/views/KennisbankView.vue'),
  },
  {
    path: '/kennisbank/:slug',
    name: 'kennisbank-artikel',
    component: () => import('@/views/KennisbankArtikelView.vue'),
  },
]
