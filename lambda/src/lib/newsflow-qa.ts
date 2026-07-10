/**
 * newsflow-qa.ts
 *
 * Maintains the aggregated Q&A index (qa.json) in the aintern-newsflow bucket,
 * mirroring the kennisbank qa.json pattern so consumers (MCP server, FAQ page)
 * can read one aggregate per content source.
 *
 * Shape: { items: [{ question, answer, slug, title, publishedAt }] }
 * (no category — NewsFlow pages have none)
 *
 * Callers: contentbuilder (after publish), seooptimizer (after rewrite —
 * it regenerates faq), and lambda/scripts/backfill-newsflow-qa.mjs.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export interface NewsflowQaEntry {
  question: string
  answer: string
  slug: string
  title: string
  publishedAt: string
}

export interface NewsflowQaIndex {
  items: NewsflowQaEntry[]
}

export interface NewsflowFaqItem {
  question: string
  answer: string
}

export async function readNewsflowQaJson(bucketUrl: string): Promise<NewsflowQaIndex> {
  try {
    const res = await fetch(`${bucketUrl}/qa.json`, { signal: AbortSignal.timeout(8_000) })
    if (res.status === 404 || res.status === 403) return { items: [] }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const parsed = (await res.json()) as NewsflowQaIndex
    return Array.isArray(parsed?.items) ? parsed : { items: [] }
  } catch {
    return { items: [] }
  }
}

/** Pure merge: drop existing entries for the slug, append its fresh faq (deduped by question). */
export function mergeNewsflowQa(
  existing: NewsflowQaIndex,
  slug: string,
  title: string,
  publishedAt: string,
  faq: NewsflowFaqItem[],
): NewsflowQaIndex {
  const kept = existing.items.filter((e) => e.slug !== slug)
  const seen = new Set<string>()
  const fresh: NewsflowQaEntry[] = []
  for (const f of faq) {
    const question = typeof f?.question === 'string' ? f.question.trim() : ''
    const answer = typeof f?.answer === 'string' ? f.answer.trim() : ''
    if (!question || !answer || seen.has(question)) continue
    seen.add(question)
    fresh.push({ question, answer, slug, title, publishedAt })
  }
  return { items: [...kept, ...fresh] }
}

/**
 * Read-merge-write qa.json for one slug. Returns the total item count.
 * Callers must treat failures as non-fatal (the post itself is already live).
 */
export async function upsertNewsflowQa(
  s3: S3Client,
  bucketName: string,
  bucketUrl: string,
  slug: string,
  title: string,
  publishedAt: string,
  faq: NewsflowFaqItem[],
): Promise<number> {
  const existing = await readNewsflowQaJson(bucketUrl)
  const merged = mergeNewsflowQa(existing, slug, title, publishedAt, faq)
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: 'qa.json',
      Body: JSON.stringify(merged, null, 2),
      ContentType: 'application/json',
      CacheControl: 'public, max-age=300',
    }),
  )
  return merged.items.length
}
