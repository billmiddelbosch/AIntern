<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { onKeyStroke } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminHeader from '@/components/admin/AdminHeader.vue'

const { t } = useI18n()
const route = useRoute()

/** Mobile drawer state; from md up the sidebar is always visible. */
const sidebarOpen = ref(false)
watch(() => route.fullPath, () => (sidebarOpen.value = false))
onKeyStroke('Escape', () => (sidebarOpen.value = false))
</script>

<template>
  <div class="min-h-screen flex bg-slate-50">
    <AdminSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <button
      v-if="sidebarOpen"
      type="button"
      class="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
      :aria-label="t('admin.header.closeMenu')"
      data-testid="admin-backdrop"
      @click="sidebarOpen = false"
    />
    <div class="flex-1 flex flex-col min-w-0">
      <AdminHeader :menu-open="sidebarOpen" @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 min-w-0 p-4 md:p-6 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
