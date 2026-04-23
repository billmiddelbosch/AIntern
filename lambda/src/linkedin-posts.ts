import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

let cachedJwtSecret: string | null = null
let cachedTableName: string | null = null

function resolveAlias(context: Context): string {
  return context.invokedFunctionArn.split(':').pop() ?? 'dev'
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
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: true }))
  const secret = result.Parameter?.Value
  if (!secret) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = secret
  return secret
}

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const path = `${process.env.DYNAMODB_TABLE_SSM_PREFIX}/${alias}/dynamodb/table-name`
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: false }))
  const name = result.Parameter?.Value
  if (!name) throw new Error(`DynamoDB table name not found at ${path}`)
  cachedTableName = name
  return name
}

async function requireAuth(event: APIGatewayProxyEvent, alias: string): Promise<void> {
  const authHeader = event.headers['Authorization'] ?? event.headers['authorization'] ?? ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
  const secret = await getJwtSecret(alias)
  jwt.verify(token, secret, { algorithms: ['HS256'] })
}

type LinkedInPostStatus = 'draft' | 'approved' | 'published' | 'archived'

interface LinkedInPost {
  id: string
  title: string
  content: string
  status: LinkedInPostStatus
  episode?: number
  serie?: string
  hashtags?: string
  scheduledFor?: string
  publishedAt?: string
  engagementNotes?: string
  createdAt: string
  updatedAt: string
}

interface DdbLinkedInPost extends LinkedInPost {
  pk: string
  sk: string
}

const VALID_STATUSES = new Set<string>(['draft', 'approved', 'published', 'archived'])

function toPost(raw: DdbLinkedInPost): LinkedInPost {
  const { pk: _pk, sk: _sk, ...post } = raw
  return post
}

async function handleList(
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const tableName = await getTableName(alias)

  const result = await ddb.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'begins_with(pk, :prefix) AND sk = :sk',
      ExpressionAttributeValues: {
        ':prefix': 'LINKEDIN#',
        ':sk': 'POST',
      },
    }),
  )

  const posts = ((result.Items ?? []) as DdbLinkedInPost[])
    .map(toPost)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return respond(200, posts, alias, requestOrigin)
}

async function handleGetOne(
  id: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const tableName = await getTableName(alias)

  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: `LINKEDIN#${id}`, sk: 'POST' },
    }),
  )

  if (!result.Item) {
    return respond(404, { error: `Post ${id} not found` }, alias, requestOrigin)
  }

  return respond(200, toPost(result.Item as DdbLinkedInPost), alias, requestOrigin)
}

function parseCreateBody(raw: string | null): Pick<LinkedInPost, 'title' | 'content'> & Partial<LinkedInPost> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  const p = parsed as Record<string, unknown>
  if (typeof p['title'] !== 'string' || !p['title']) {
    throw Object.assign(new Error('title is required'), { statusCode: 400 })
  }
  if (typeof p['content'] !== 'string' || !p['content']) {
    throw Object.assign(new Error('content is required'), { statusCode: 400 })
  }

  return {
    title: p['title'] as string,
    content: p['content'] as string,
    serie: typeof p['serie'] === 'string' ? p['serie'] : undefined,
    episode: typeof p['episode'] === 'number' ? p['episode'] : undefined,
    hashtags: typeof p['hashtags'] === 'string' ? p['hashtags'] : undefined,
    scheduledFor: typeof p['scheduledFor'] === 'string' ? p['scheduledFor'] : undefined,
    engagementNotes: typeof p['engagementNotes'] === 'string' ? p['engagementNotes'] : undefined,
  }
}

async function handleCreate(
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']
  const fields = parseCreateBody(event.body)
  const tableName = await getTableName(alias)

  const now = new Date().toISOString()
  const id = randomUUID()

  const item: DdbLinkedInPost = {
    pk: `LINKEDIN#${id}`,
    sk: 'POST',
    id,
    title: fields.title,
    content: fields.content,
    status: 'draft',
    serie: fields.serie,
    episode: fields.episode,
    hashtags: fields.hashtags,
    scheduledFor: fields.scheduledFor,
    engagementNotes: fields.engagementNotes,
    createdAt: now,
    updatedAt: now,
  }

  // Remove undefined fields before writing to DynamoDB
  const cleanItem = Object.fromEntries(
    Object.entries(item).filter(([, v]) => v !== undefined),
  ) as DdbLinkedInPost

  await ddb.send(new PutCommand({ TableName: tableName, Item: cleanItem }))

  return respond(201, toPost(cleanItem), alias, requestOrigin)
}

const UPDATABLE_FIELDS = [
  'title', 'content', 'status', 'serie', 'episode',
  'hashtags', 'scheduledFor', 'publishedAt', 'engagementNotes',
] as const

type UpdatableField = (typeof UPDATABLE_FIELDS)[number]

function parseUpdateBody(raw: string | null): Partial<Pick<LinkedInPost, UpdatableField>> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  const p = parsed as Record<string, unknown>
  const patch: Partial<Pick<LinkedInPost, UpdatableField>> = {}

  for (const field of UPDATABLE_FIELDS) {
    if (!(field in p)) continue
    if (field === 'status') {
      if (!VALID_STATUSES.has(p[field] as string)) {
        throw Object.assign(
          new Error(`status must be one of: ${Array.from(VALID_STATUSES).join(', ')}`),
          { statusCode: 400 },
        )
      }
      patch.status = p[field] as LinkedInPostStatus
    } else if (field === 'episode') {
      patch.episode = p[field] !== null && p[field] !== undefined ? Number(p[field]) : undefined
    } else {
      ;(patch as Record<string, unknown>)[field] = p[field] !== null ? p[field] : undefined
    }
  }

  if (Object.keys(patch).length === 0) {
    throw Object.assign(new Error('At least one updatable field is required'), { statusCode: 400 })
  }

  return patch
}

async function handleUpdate(
  id: string,
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']
  const patch = parseUpdateBody(event.body)
  const tableName = await getTableName(alias)

  const pk = `LINKEDIN#${id}`
  const sk = 'POST'

  const existing = await ddb.send(new GetCommand({ TableName: tableName, Key: { pk, sk } }))
  if (!existing.Item) {
    return respond(404, { error: `Post ${id} not found` }, alias, requestOrigin)
  }

  const setClauses: string[] = ['#updatedAt = :updatedAt']
  const expressionNames: Record<string, string> = { '#updatedAt': 'updatedAt' }
  const expressionValues: Record<string, unknown> = { ':updatedAt': new Date().toISOString() }
  const removeClauses: string[] = []

  for (const field of UPDATABLE_FIELDS) {
    if (!(field in patch)) continue
    const val = (patch as Record<string, unknown>)[field]
    const nameToken = `#${field}`
    const valueToken = `:${field}`

    if (val === undefined || val === null) {
      removeClauses.push(nameToken)
      expressionNames[nameToken] = field
    } else {
      setClauses.push(`${nameToken} = ${valueToken}`)
      expressionNames[nameToken] = field
      expressionValues[valueToken] = val
    }
  }

  let updateExpression = `SET ${setClauses.join(', ')}`
  if (removeClauses.length > 0) {
    updateExpression += ` REMOVE ${removeClauses.join(', ')}`
  }

  const result = await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    }),
  )

  return respond(200, toPost(result.Attributes as DdbLinkedInPost), alias, requestOrigin)
}

async function handleDelete(
  id: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const tableName = await getTableName(alias)

  const pk = `LINKEDIN#${id}`
  const sk = 'POST'

  const existing = await ddb.send(new GetCommand({ TableName: tableName, Key: { pk, sk } }))
  if (!existing.Item) {
    return respond(404, { error: `Post ${id} not found` }, alias, requestOrigin)
  }

  const result = await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk },
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status', '#updatedAt': 'updatedAt' },
      ExpressionAttributeValues: {
        ':status': 'archived',
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }),
  )

  return respond(200, toPost(result.Attributes as DdbLinkedInPost), alias, requestOrigin)
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  console.log(
    '[linkedin-posts] handler | requestId=%s method=%s path=%s resource=%s',
    context.awsRequestId,
    event.httpMethod,
    event.path,
    event.resource,
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
    const method = event.httpMethod
    const resource = event.resource

    if (method === 'GET' && resource === '/admin/linkedin-posts') {
      return await handleList(alias, requestOrigin)
    }

    if (method === 'GET' && resource === '/admin/linkedin-posts/{id}') {
      const id = event.pathParameters?.['id'] ?? ''
      return await handleGetOne(id, alias, requestOrigin)
    }

    if (method === 'POST' && resource === '/admin/linkedin-posts') {
      return await handleCreate(event, alias)
    }

    if (method === 'PUT' && resource === '/admin/linkedin-posts/{id}') {
      const id = event.pathParameters?.['id'] ?? ''
      return await handleUpdate(id, event, alias)
    }

    if (method === 'DELETE' && resource === '/admin/linkedin-posts/{id}') {
      const id = event.pathParameters?.['id'] ?? ''
      return await handleDelete(id, alias, requestOrigin)
    }

    return respond(405, { error: 'Method not allowed' }, alias, requestOrigin)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode
    if (code === 400) {
      return respond(400, { error: (err as Error).message }, alias, requestOrigin)
    }
    console.error('[linkedin-posts] unhandled error:', err)
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
