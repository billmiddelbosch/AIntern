import express from 'express'
import compression from 'compression'
import sirv from 'sirv'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const port = process.env.PORT ?? 5173

async function createServer() {
  const app = express()
  app.use(compression())

  let vite: import('vite').ViteDevServer | undefined

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite')
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })
    app.use(vite.middlewares)
  } else {
    app.use(sirv(path.resolve(__dirname, 'dist/client'), { extensions: [] }))
  }

  app.use('/{*path}', async (req, res) => {
    try {
      const url = req.originalUrl

      let template: string
      let render: (url: string) => Promise<{
        html: string
        headPayload: { headTags: string }
        teleports: Record<string, string>
      }>

      if (!isProd) {
        template = await vite!.transformIndexHtml(
          url,
          await fs.readFile(path.resolve(__dirname, 'index.html'), 'utf-8'),
        )
        render = (await vite!.ssrLoadModule('/src/entry-server.ts')).render
      } else {
        template = await fs.readFile(
          path.resolve(__dirname, 'dist/client/index.html'),
          'utf-8',
        )
        render = (await import('./dist/server/entry-server.js')).render
      }

      const { html: appHtml, headPayload, teleports } = await render(url)

      let finalHtml = template
        .replace('<!--head-tags-->', headPayload.headTags ?? '')
        .replace('<!--app-html-->', appHtml)

      if (teleports.body) {
        finalHtml = finalHtml.replace('</body>', `${teleports.body}</body>`)
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).send(finalHtml)
    } catch (e) {
      if (!isProd && vite) vite.ssrFixStacktrace(e as Error)
      console.error(e)
      res.status(500).end((e as Error).message)
    }
  })

  app.listen(port, () => {
    console.log(`SSR server listening on http://localhost:${port}`)
  })
}

createServer()
