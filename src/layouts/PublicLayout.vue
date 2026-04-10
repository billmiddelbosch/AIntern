<script setup lang="ts">
// Public layout — wraps all public-facing pages.
// Currently a transparent pass-through; extend with nav/footer here.
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <slot />
  </div>
</template>
