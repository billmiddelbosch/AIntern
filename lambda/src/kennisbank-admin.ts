import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import jwt from 'jsonwebtoken'

const ssm = new SSMClient({ region: 'eu-west-2' })
const s3 = new S3Client({ region: 'eu-west-2' })

const KENNISBANK_BUCKET = 'aintern-kennisbank'

let cachedJwtSecret: string | null = null

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveAlias(context: Context): string {
  const arn = context.invokedFunctionArn
  const alias = arn.split(':').pop() ?? 'dev'
  console.log('[kennisbank-admin] resolveAlias | arn=%s alias=%s', arn, alias)
  return alias
}

const PROD_ORIGINS = new Set(['https://aintern.nl', 'https://www.aintern.nl'])

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
  console.log('[kennisbank-admin] getJwtSecret | fetching SSM path=%s', path)
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: true }),
  )
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
  } catch (err: unknown) {
    console.warn('[kennisbank-admin] requireAuth | JWT failed: %s', (err as Error).message)
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
}

// ── Data types ────────────────────────────────────────────────────────────────

interface KennisbankArticle {
  slug: string
  title: string
  status: 'published' | 'draft'
  lastModified: string
}

interface IndexPost {
  slug: string
  title: string
}

interface KennisbankIndex {
  posts: IndexPost[]
}

// ── S3 helpers ────────────────────────────────────────────────────────────────

async function readIndex(): Promise<Map<string, string>> {
  console.log('[kennisbank-admin] readIndex | fetching s3://%s/index.json', KENNISBANK_BUCKET)
  const resp = await s3.send(
    new GetObjectCommand({ Bucket: KENNISBANK_BUCKET, Key: 'index.json' }),
  )
  const raw = (await resp.Body?.transformToString('utf-8')) ?? '{}'
  const index = JSON.parse(raw) as KennisbankIndex
  const map = new Map<string, string>()
  for (const post of index.posts ?? []) {
    map.set(post.slug, post.title)
  }
  console.log('[kennisbank-admin] readIndex | %d published articles', map.size)
  return map
}

async function listS3Posts(): Promise<Array<{ slug: string; lastModified: string }>> {
  const items: Array<{ slug: string; lastModified: string }> = []
  let continuationToken: string | undefined

  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: KENNISBANK_BUCKET,
        Prefix: 'posts/',
        ContinuationToken: continuationToken,
      }),
    )
    for (const obj of resp.Contents ?? []) {
      if (!obj.Key?.endsWith('.json')) continue
      const slug = obj.Key.slice('posts/'.length, -'.json'.length)
      if (!slug) continue
      items.push({
        slug,
        lastModified: obj.LastModified?.toISOString() ?? new Date(0).toISOString(),
      })
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined
  } while (continuationToken)

  console.log('[kennisbank-admin] listS3Posts | found %d objects', items.length)
  return items
}

// ── Route handler ─────────────────────────────────────────────────────────────

async function handleGet(
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']

  const [titleMap, s3Posts] = await Promise.all([readIndex(), listS3Posts()])

  const articles: KennisbankArticle[] = s3Posts.map(({ slug, lastModified }) => ({
    slug,
    title: titleMap.get(slug) ?? slug,
    status: titleMap.has(slug) ? 'published' : 'draft',
    lastModified,
  }))

  articles.sort((a, b) => b.lastModified.localeCompare(a.lastModified))

  console.log('[kennisbank-admin] handleGet | returning %d articles', articles.length)
  return respond(200, { articles }, alias, requestOrigin)
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  console.log(
    '[kennisbank-admin] handler | requestId=%s method=%s path=%s',
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

  if (event.httpMethod !== 'GET') {
    return respond(405, { error: 'Method not allowed' }, alias, requestOrigin)
  }

  try {
    return await handleGet(event, alias)
  } catch (err: unknown) {
    console.error('[kennisbank-admin] unhandled error | %s', (err as Error).message, err)
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
