import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import jwt from 'jsonwebtoken'

const ssm = new SSMClient({ region: 'eu-west-2' })
const s3 = new S3Client({ region: 'eu-west-2' })

let cachedJwtSecret: string | null = null

const PROD_ORIGINS = new Set(['https://aintern.nl', 'https://www.aintern.nl'])

function resolveAlias(context: Context): string {
  const arn = context.invokedFunctionArn
  const alias = arn.split(':').pop() ?? 'dev'
  console.log('[lead-crud] resolveAlias | arn=%s alias=%s', arn, alias)
  return alias
}

function corsOrigin(alias: string, requestOrigin?: string): string {
  if (alias === 'prod') {
    if (requestOrigin && PROD_ORIGINS.has(requestOrigin)) return requestOrigin
    return 'https://aintern.nl'
  }
  if (alias === 'dev') {
    if (requestOrigin === 'http://localhost:5173') return requestOrigin
    return 'https://test.aintern.nl'
  }
  return 'http://localhost:5173'
}

function respond(
  statusCode: number,
  body: unknown,
  alias: string,
  requestOrigin?: string,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': corsOrigin(alias, requestOrigin),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  }
}

async function getJwtSecret(alias: string): Promise<string> {
  if (cachedJwtSecret) return cachedJwtSecret
  const path = `${process.env.JWT_SECRET_SSM_PREFIX}/${alias}`
  console.log('[lead-crud] getJwtSecret | fetching SSM path=%s', path)
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: true }))
  const secret = result.Parameter?.Value
  if (!secret) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = secret
  return secret
}

async function requireAuth(event: APIGatewayProxyEvent, alias: string): Promise<void> {
  const authHeader = event.headers['Authorization'] ?? event.headers['authorization'] ?? ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
  const secret = await getJwtSecret(alias)
  try {
    jwt.verify(token, secret, { algorithms: ['HS256'] })
  } catch {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
}

type LeadStatus =
  | 'new'
  | 'enriched'
  | 'connection_sent'
  | 'connected'
  | 'dm_sent'
  | 'dm_responded'
  | 'discovery_booked'
  | 'won'
  | 'lost'
  | 'not_found'

interface Lead {
  id: string
  website: string
  linkedinUrl?: string
  linkedinName?: string
  status: LeadStatus
  connectionSentAt?: string
  connectionMessage?: string
  connectionVariant?: string
  dmSentAt?: string
  dmMessage?: string
  dmVariant?: string
  dmResponse?: string
  source: string
  createdAt: string
  updatedAt: string
}

const VALID_STATUSES = new Set<string>([
  'new', 'enriched', 'connection_sent', 'connected',
  'dm_sent', 'dm_responded', 'discovery_booked', 'won', 'lost', 'not_found',
])

function mapCsvStatus(raw: string): LeadStatus {
  const s = raw.trim().toLowerCase()
  if (VALID_STATUSES.has(s)) return s as LeadStatus
  if (s === 'excluded') return 'lost'
  if (s === 'needs_enrichment' || s === 'not_contacted') return 'new'
  return 'new'
}

function parseCsv(text: string): Lead[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const idx = (name: string) => headers.indexOf(name)

  const leads: Lead[] = []
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV split — values in this file do not contain commas
    const cols = lines[i].split(',')
    const get = (name: string) => (cols[idx(name)] ?? '').trim()

    const website = get('website')
    if (!website) continue

    leads.push({
      id: `csv-${encodeURIComponent(website)}`,
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

// Mock data returned when S3 key does not exist yet
const MOCK_LEADS: Lead[] = [
  {
    id: 'mock-tschuurtje-nl',
    website: 'tschuurtje.nl',
    linkedinName: 'Bram Hofman',
    linkedinUrl: 'https://www.linkedin.com/in/bram-hofman-b0376a87/',
    status: 'dm_sent',
    source: 'mock',
    createdAt: '2026-04-08T00:00:00.000Z',
    updatedAt: '2026-04-11T00:00:00.000Z',
  },
]

async function fetchLeadsFromS3(): Promise<Lead[]> {
  // Real data lives at s3://aintern-kennisbank/admin-assets/outreach-log.csv
  // Upload it with: aws s3 cp product/marketing/leads/outreach-log.csv s3://aintern-kennisbank/admin-assets/outreach-log.csv
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: 'aintern-kennisbank',
        Key: 'admin-assets/outreach-log.csv',
      }),
    )
    const body = await result.Body?.transformToString('utf-8')
    if (!body) return MOCK_LEADS
    console.log('[lead-crud] fetchLeadsFromS3 | fetched CSV, length=%d', body.length)
    return parseCsv(body)
  } catch (err: unknown) {
    const code = (err as { name?: string }).name
    if (code === 'NoSuchKey' || code === 'NoSuchBucket') {
      console.warn('[lead-crud] fetchLeadsFromS3 | S3 key not found — returning mock data')
      return MOCK_LEADS
    }
    throw err
  }
}

async function handleGet(
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']
  console.log('[lead-crud] GET /leads')
  const leads = await fetchLeadsFromS3()
  console.log('[lead-crud] GET /leads | returning %d leads', leads.length)
  return respond(200, leads, alias, requestOrigin)
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  console.log(
    '[lead-crud] handler | requestId=%s method=%s path=%s',
    context.awsRequestId,
    event.httpMethod,
    event.path,
  )

  const alias = resolveAlias(context)
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']

  try {
    await requireAuth(event, alias)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode ?? 401
    return respond(code, { error: (err as Error).message }, alias, requestOrigin)
  }

  try {
    if (event.httpMethod === 'GET') {
      return await handleGet(event, alias)
    }
    return respond(405, { error: 'Method not allowed' }, alias, requestOrigin)
  } catch (err: unknown) {
    console.error('[lead-crud] unhandled error | %s', (err as Error).message, err)
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
