import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import generateSitemap from 'vite-ssg-sitemap'
import 'vite-ssg'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  ssgOptions: {
    async includedRoutes(paths) {
      // Strip dynamic route patterns and admin routes from the sitemap
      const staticPaths = paths.filter((p) => !p.includes(':') && !p.startsWith('/admin'))
      let articleRoutes: string[] = []
      try {
        const res = await fetch('https://aintern-kennisbank.s3.eu-west-2.amazonaws.com/index.json')
        const data = (await res.json()) as { posts: Array<{ slug: string }> }
        articleRoutes = data.posts
          .filter((post) => /^[a-z0-9-]+$/.test(post.slug))
          .map((post) => `/kennisbank/${post.slug}`)
      } catch {
        // S3 unreachable — build continues without article routes
      }
      return [...staticPaths, ...articleRoutes]
    },
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
