#!/usr/bin/env node
// One-time backfill of qa.json in the aintern-newsflow bucket.
// Reads the public index.json, fetches every posts/<slug>.json, aggregates
// all FAQ items into { items: [...] } (kennisbank qa.json pattern) and
// writes qa.json via the S3 SDK with local AWS credentials.
// Usage: node lambda/scripts/backfill-newsflow-qa.mjs [--dry-run]

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const REGION = 'eu-west-2'
const BUCKET = 'aintern-newsflow'
const BUCKET_URL = `https://${BUCKET}.s3.${REGION}.amazonaws.com`
const DRY_RUN = process.argv.includes('--dry-run')

const s3 = new S3Client({ region: REGION })

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function main() {
  const index = await fetchJson(`${BUCKET_URL}/index.json`)
  if (!Array.isArray(index)) throw new Error('index.json is not an array')
  console.log(`[backfill] ${index.length} posts in index.json`)

  const items = []
  for (const entry of index) {
    const slug = String(entry.slug ?? '')
    if (!/^[a-z0-9-]{3,80}$/.test(slug)) {
      console.warn(`[backfill] ⚠ skipping invalid slug: '${slug}'`)
      continue
    }
    let post
    try {
      post = await fetchJson(`${BUCKET_URL}/posts/${slug}.json`)
    } catch (err) {
      console.warn(`[backfill] ⚠ ${slug}: ${err.message}`)
      continue
    }
    const faq = Array.isArray(post.faq) ? post.faq : []
    const seen = new Set()
    let added = 0
    for (const f of faq) {
      const question = typeof f?.question === 'string' ? f.question.trim() : ''
      const answer = typeof f?.answer === 'string' ? f.answer.trim() : ''
      if (!question || !answer || seen.has(question)) continue
      seen.add(question)
      items.push({
        question,
        answer,
        slug,
        title: String(post.title ?? entry.title ?? ''),
        publishedAt: String(post.publishedAt ?? entry.publishedAt ?? ''),
      })
      added++
    }
    console.log(`  - ${slug}: ${added} Q&A items`)
  }

  console.log(`[backfill] Total: ${items.length} Q&A items from ${index.length} posts`)

  if (DRY_RUN) {
    console.log('[backfill] Dry run — qa.json NOT written.')
    return
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: 'qa.json',
      Body: JSON.stringify({ items }, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=300',
    }),
  )
  console.log(`[backfill] ✅ qa.json written: ${BUCKET_URL}/qa.json`)
}

main().catch((err) => {
  console.error('[backfill] Error:', err.message)
  process.exit(1)
})
