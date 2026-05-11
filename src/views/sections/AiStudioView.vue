<!--
  AiStudioView.vue — design-stage router view

  Renders the AdminAiStudioScreen prototype inside the admin layout.
  In the IMPLEMENT stage this is replaced by AdminAiStudioView.vue at
  src/views/admin/AdminAiStudioView.vue, which uses the real useAiStudio
  composable and live API calls.
-->
<script setup lang="ts">
import AdminAiStudioScreen from '@/components/sections/ai-studio/AdminAiStudioScreen.vue'
</script>

<template>
  <AdminAiStudioScreen />
</template>
