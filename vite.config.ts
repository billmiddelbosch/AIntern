import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import type {} from 'vite-ssg'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { generateSitemapXml, getSlugsFromS3, getNewsflowSlugsFromS3 } from './scripts/generate-sitemap'
import { generateLlmsFullTxt } from './scripts/generate-llms-full'

function sitemapPlugin(): Plugin {
  return {
    name: 'generate-sitemap',
    apply: 'build',
    async buildStart() {
      const publicDir = fileURLToPath(new URL('./public', import.meta.url))
      await generateSitemapXml(publicDir)
    },
  }
}

function llmsFullPlugin(): Plugin {
  return {
    name: 'generate-llms-full',
    apply: 'build',
    async buildStart() {
      const publicDir = fileURLToPath(new URL('./public', import.meta.url))
      await generateLlmsFullTxt(publicDir)
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    sitemapPlugin(),
    llmsFullPlugin(),
  ],
  ssgOptions: {
    // NewsFlowView's SSG-fetched article content is sanitized with DOMPurify
    // during renderToString; DOMPurify needs a `window` global to self-init.
    mock: true,
    async includedRoutes(paths: string[]) {
      const staticPaths = paths.filter((p: string) => !p.includes(':') && !p.startsWith('/admin'))
      let articleRoutes: string[] = []
      try {
        const slugs = await getSlugsFromS3()
        articleRoutes = slugs.map((slug) => `/kennisbank/${slug}`)
      } catch {
        // S3 unreachable — build continues without article routes
      }
      let newsflowRoutes: string[] = []
      try {
        const slugs = await getNewsflowSlugsFromS3()
        newsflowRoutes = slugs.map((slug) => `/newsflow/${slug}`)
      } catch (err) {
        console.warn('[vite-ssg] Newsflow S3 onbereikbaar — newsflow routes worden overgeslagen:', err)
      }
      return [...staticPaths, ...articleRoutes, ...newsflowRoutes]
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
