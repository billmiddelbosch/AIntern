import type { RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: 'public' | 'admin' | 'none'
    requiresAuth?: boolean
    title?: string
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { layout: 'public' },
  },
  {
    path: '/kennisbank',
    name: 'kennisbank',
    component: () => import('@/views/KennisbankView.vue'),
    meta: { layout: 'public' },
  },
  {
    path: '/kennisbank/:slug',
    name: 'kennisbank-artikel',
    component: () => import('@/views/KennisbankArtikelView.vue'),
    meta: { layout: 'public' },
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/AdminLoginView.vue'),
    meta: { layout: 'none' },
  },
  {
    path: '/admin/register',
    name: 'admin-register',
    component: () => import('@/views/admin/AdminRegisterView.vue'),
    meta: { layout: 'none' },
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('@/views/admin/AdminDashboardView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'admin.dashboard.pageTitle' },
  },
]
