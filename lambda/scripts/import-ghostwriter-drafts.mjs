#!/usr/bin/env node
// Import ghostwriter draft .md files from .claude/cmo/ghostwriter_drafts/ into DynamoDB.
// Idempotent: skips episodes already present (matched by serie + episode).
// Usage: node lambda/scripts/import-ghostwriter-drafts.mjs [--alias=dev|prod]

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const DRAFTS_DIR = join(ROOT, '.claude', 'cmo', 'ghostwriter_drafts')
const REGION = 'eu-west-2'

const aliasArg = process.argv.find((a) => a.startsWith('--alias='))
const ALIAS = aliasArg ? aliasArg.split('=')[1] : (process.env.AINTERN_ALIAS ?? 'dev')

const ssm = new SSMClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

async function getTableName() {
  const result = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${ALIAS}/dynamodb/table-name` }),
  )
  const name = result.Parameter?.Value
  if (!name) throw new Error(`Table name SSM param not found for alias: ${ALIAS}`)
  return name
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: raw }
  const fm = {}
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const val = line.slice(colonIdx + 1).trim()
    if (key) fm[key] = val
  }
  return { frontmatter: fm, body: match[2].trim() }
}

function extractHashtags(body) {
  const match = body.match(/\[Hashtags:\s*([^\]]+)\]/)
  return match ? match[1].trim() : undefined
}

function extractContent(body) {
  let content = body
  content = content.replace(/^#[^\n]*\n\n/, '')
  content = content.replace(/\*\*Draft:\*\*\n\n/, '')
  content = content.replace(/\n\n---\n\n\*\[Hashtags:[^\]]*\]\*/s, '')
  return content.trim()
}

function parseScheduledFor(postVoor) {
  if (!postVoor) return undefined
  const match = postVoor.match(/(\d{4}-\d{2}-\d{2})/)
  return match ? `${match[1]}T00:00:00.000Z` : undefined
}

async function main() {
  const tableName = await getTableName()
  console.log(`[import] alias=${ALIAS} table=${tableName}`)

  const existing = await ddb.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'begins_with(pk, :prefix) AND sk = :sk',
      ExpressionAttributeValues: { ':prefix': 'LINKEDIN#', ':sk': 'POST' },
      ProjectionExpression: 'serie, episode',
    }),
  )

  const existingKeys = new Set(
    (existing.Items ?? []).map((item) => `${item.serie}||${item.episode}`),
  )

  const files = readdirSync(DRAFTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()

  let imported = 0
  let skipped = 0

  for (const file of files) {
    const raw = readFileSync(join(DRAFTS_DIR, file), 'utf-8')
    const { frontmatter, body } = parseFrontmatter(raw)

    const serie = frontmatter['serie']
    const episode = parseInt(frontmatter['episode'], 10)

    if (!serie || isNaN(episode)) {
      console.warn(`[import] Skipping ${file} — missing serie or episode in frontmatter`)
      skipped++
      continue
    }

    const key = `${serie}||${episode}`
    if (existingKeys.has(key)) {
      console.log(`[import] Already exists: ${file} (${serie} ep.${episode}) — skip`)
      skipped++
      continue
    }

    const now = new Date().toISOString()
    const id = randomUUID()
    const title = frontmatter['titel'] ?? `Episode ${episode}`
    const content = extractContent(body)
    const hashtags = extractHashtags(body)
    const scheduledFor = parseScheduledFor(frontmatter['post_voor'])

    const item = {
      pk: `LINKEDIN#${id}`,
      sk: 'POST',
      id,
      title,
      content,
      status: 'draft',
      serie,
      episode,
      ...(hashtags !== undefined && { hashtags }),
      ...(scheduledFor !== undefined && { scheduledFor }),
      createdAt: now,
      updatedAt: now,
    }

    await ddb.send(new PutCommand({ TableName: tableName, Item: item }))
    console.log(`[import] ✅ ${file} → id=${id} title="${title}"`)
    imported++
  }

  console.log(`\n[import] Done: ${imported} imported, ${skipped} skipped`)
}

main().catch((err) => {
  console.error('[import] Error:', err.message)
  process.exit(1)
})
