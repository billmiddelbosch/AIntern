#!/usr/bin/env node
// Seeds DynamoDB table with leads from outreach-log.csv
// Usage: node lambda/scripts/import-leads.mjs
// Requires: AWS credentials in environment (same region: eu-west-2)

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const REGION = 'eu-west-2'
const SSM_PATH = '/aintern/dev/dynamodb/table-name'

const ssm = new SSMClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

const VALID_STATUSES = new Set([
  'new', 'enriched', 'connection_sent', 'connected',
  'dm_sent', 'dm_responded', 'discovery_booked', 'won', 'lost', 'not_found',
])

function mapCsvStatus(raw) {
  const s = (raw ?? '').trim().toLowerCase()
  if (VALID_STATUSES.has(s)) return s
  if (s === 'excluded') return 'lost'
  if (s === 'needs_enrichment' || s === 'not_contacted') return 'new'
  return 'new'
}

function parseCsv(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const idx = (name) => headers.indexOf(name)

  const leads = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const get = (name) => (cols[idx(name)] ?? '').trim()

    const website = get('website')
    if (!website) continue

    leads.push({
      id: encodeURIComponent(website),
      website,
      linkedinUrl: get('linkedin_url') || undefined,
      linkedinName: get('linkedin_name') || undefined,
      status: mapCsvStatus(get('status')),
      connectionSentAt: get('connection_sent_at') || undefined,
      connectionMessage: get('connection_message') || undefined,
      connectionVariant: get('connection_variant') || undefined,
      dmSentAt: get('dm_sent_at') || undefined,
      dmMessage: get('dm_message') || undefined,
      dmVariant: get('dm_variant') || undefined,
      dmResponse: get('dm_response') || undefined,
      source: 'csv_import',
      createdAt: '2026-04-08T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    })
  }
  return leads
}

async function getTableName() {
  const result = await ssm.send(new GetParameterCommand({ Name: SSM_PATH, WithDecryption: false }))
  const name = result.Parameter?.Value
  if (!name) throw new Error(`DynamoDB table name not found at ${SSM_PATH}`)
  return name
}

async function main() {
  const csvPath = resolve(process.cwd(), 'product/marketing/leads/outreach-log.csv')
  console.log(`Reading CSV: ${csvPath}`)
  const text = readFileSync(csvPath, 'utf-8')
  const leads = parseCsv(text)
  console.log(`Parsed ${leads.length} leads`)

  const tableName = await getTableName()
  console.log(`Table: ${tableName}`)

  let imported = 0
  let skipped = 0

  for (const lead of leads) {
    if (!lead.website) {
      console.log(`⚠️ Skipped: empty website`)
      skipped++
      continue
    }

    const pk = `LEAD#${encodeURIComponent(lead.website)}`
    const sk = 'METADATA'

    const item = Object.fromEntries(
      Object.entries({ ...lead, pk, sk }).filter(([, v]) => v !== undefined && v !== ''),
    )

    await ddb.send(new PutCommand({ TableName: tableName, Item: item }))
    console.log(`✅ Imported: ${lead.website}`)
    imported++
  }

  console.log(`\nDone — imported: ${imported}, skipped: ${skipped}`)
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
