import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOSTNAME = 'https://aintern.nl'
const BUCKET = 'aintern-kennisbank'
const REGION = 'eu-west-2'
const SLUG_PATTERN = /^posts\/([a-z0-9-]+)\.json$/

const STATIC_ROUTES = ['/', '/kennisbank']

export async function getSlugsFromS3(): Promise<string[]> {
  const client = new S3Client({ region: REGION })
  const slugs: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: 'posts/',
        ContinuationToken: continuationToken,
      }),
    )
    for (const obj of response.Contents ?? []) {
      const match = (obj.Key ?? '').match(SLUG_PATTERN)
      if (match) slugs.push(match[1])
    }
    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return slugs
}

function buildXml(routes: string[]): string {
  const today = new Date().toISOString().split('T')[0]
  const urls = routes
    .map((route) => {
      const priority = route === '/' ? '1.0' : route === '/kennisbank' ? '0.9' : '0.8'
      const changefreq = route === '/' ? 'weekly' : 'monthly'
      return `  <url>
    <loc>${HOSTNAME}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export async function generateSitemapXml(outDir: string): Promise<void> {
  const routes = [...STATIC_ROUTES]

  try {
    const slugs = await getSlugsFromS3()
    routes.push(...slugs.map((slug) => `/kennisbank/${slug}`))
    console.log(`[sitemap] ${slugs.length} artikelen opgehaald uit S3`)
  } catch (err) {
    console.warn('[sitemap] S3 ListObjectsV2 mislukt — alleen statische routes worden opgenomen:', err)
  }

  const dest = resolve(outDir, 'sitemap.xml')
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, buildXml(routes), 'utf-8')
  console.log(`[sitemap] Geschreven naar ${dest} (${routes.length} routes)`)
}

// CLI-entrypoint: tsx scripts/generate-sitemap.ts
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const publicDir = resolve(process.cwd(), 'public')
  generateSitemapXml(publicDir).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
