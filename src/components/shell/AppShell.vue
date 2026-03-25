<script setup lang="ts">
import MainNav from '@/components/shell/MainNav.vue'
import AppFooter from '@/components/shell/AppFooter.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <MainNav />
    <main class="flex-1 pt-16">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
