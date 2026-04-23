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
  {
    path: '/admin/kpi',
    name: 'admin-kpi',
    component: () => import('@/views/admin/AdminKpiView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'admin.kpi.pageTitle' },
  },
  {
    path: '/admin/kennisbank',
    name: 'admin-kennisbank',
    component: () => import('@/views/admin/KennisbankListView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'admin.kennisbank.pageTitle' },
  },
  {
    path: '/admin/kennisbank/new',
    name: 'admin-kennisbank-new',
    component: () => import('@/views/admin/KennisbankArticleFormView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'admin.articleForm.titleCreate' },
  },
  {
    path: '/admin/kennisbank/:slug/edit',
    name: 'admin-kennisbank-edit',
    component: () => import('@/views/admin/KennisbankArticleFormView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'admin.articleForm.titleEdit' },
  },
  {
    path: '/admin/organisation',
    name: 'admin-organisation',
    component: () => import('@/views/admin/AdminOrganisationView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'admin.organisation.pageTitle' },
  },
  {
    path: '/admin/leads',
    name: 'admin-leads',
    component: () => import('@/views/admin/AdminLeadBoardView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'leads.board.pageTitle' },
  },
  {
    path: '/admin/leads/:id',
    name: 'admin-lead-detail',
    component: () => import('@/views/admin/AdminLeadFormView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'leads.form.pageTitle' },
  },
  {
    path: '/admin/linkedin',
    name: 'admin-linkedin',
    component: () => import('@/views/admin/AdminLinkedInView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'linkedinPosts.pageTitle' },
  },
  {
    path: '/admin/linkedin/new',
    name: 'admin-linkedin-new',
    component: () => import('@/views/admin/AdminLinkedInPostFormView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'linkedinPosts.titleCreate' },
  },
  {
    path: '/admin/linkedin/:id/edit',
    name: 'admin-linkedin-edit',
    component: () => import('@/views/admin/AdminLinkedInPostFormView.vue'),
    meta: { layout: 'admin', requiresAuth: true, title: 'linkedinPosts.titleEdit' },
  },
]
