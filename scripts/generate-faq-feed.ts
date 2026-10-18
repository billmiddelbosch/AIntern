import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// NLWeb Schema Feeds: the homepage FAQ as JSONL (one schema.org Question per
// line) plus a schemamap.xml that points to it. Generated from nl.json so the
// feed never drifts from what the homepage shows.

const HOSTNAME = 'https://aintern.nl'

interface FaqItem {
  q: string
  a: string
}

function readFaqItems(rootDir: string): FaqItem[] {
  const raw = readFileSync(resolve(rootDir, 'src/locales/nl.json'), 'utf-8')
  const nl = JSON.parse(raw) as { pivot: { home: { faq: { items: Record<string, FaqItem> } } } }
  return Object.values(nl.pivot.home.faq.items)
}

export function buildFaqJsonl(items: FaqItem[]): string {
  return (
    items
      .map((item) =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Question',
          url: `${HOSTNAME}/#faq`,
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
          inLanguage: 'nl-NL',
        }),
      )
      .join('\n') + '\n'
  )
}

export function buildSchemamapXml(today: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${HOSTNAME}/feeds/faq.jsonl</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
  </url>
</urlset>
`
}

export function generateFaqFeed(publicDir: string): void {
  const rootDir = resolve(publicDir, '..')
  const items = readFaqItems(rootDir)
  const today = new Date().toISOString().slice(0, 10)

  mkdirSync(resolve(publicDir, 'feeds'), { recursive: true })
  writeFileSync(resolve(publicDir, 'feeds/faq.jsonl'), buildFaqJsonl(items), 'utf-8')
  writeFileSync(resolve(publicDir, 'schemamap.xml'), buildSchemamapXml(today), 'utf-8')
  console.log(`[faq-feed] ${items.length} vragen → feeds/faq.jsonl + schemamap.xml`)
}

// Allow running directly: node scripts/generate-faq-feed.js
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  generateFaqFeed(resolve(dirname(fileURLToPath(import.meta.url)), '../public'))
}
