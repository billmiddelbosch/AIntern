import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import generateSitemap from 'vite-ssg-sitemap'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  ssgOptions: {
    onFinished() {
      generateSitemap({ hostname: 'https://aintern.nl' })
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
