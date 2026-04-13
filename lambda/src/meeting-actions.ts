import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb'
import jwt from 'jsonwebtoken'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

// Cached at module level — refreshed only on cold start
let cachedJwtSecret: string | null = null
let cachedTableName: string | null = null

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveAlias(context: Context): string {
  return context.invokedFunctionArn.split(':').pop() ?? 'dev'
}

function corsOrigin(alias: string, requestOrigin?: string): string {
  if (alias === 'prod') return 'https://aintern.nl'
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin(alias, requestOrigin),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  return { statusCode, headers, body: statusCode === 204 ? '' : JSON.stringify(body) }
}

async function getJwtSecret(alias: string): Promise<string> {
  if (cachedJwtSecret) return cachedJwtSecret
  const path = `${process.env.JWT_SECRET_SSM_PREFIX}/${alias}`
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: true }),
  )
  const secret = result.Parameter?.Value
  if (!secret) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = secret
  return secret
}

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const path = `${process.env.DYNAMODB_TABLE_SSM_PREFIX}/${alias}`
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: false }),
  )
  const name = result.Parameter?.Value
  if (!name) throw new Error(`DynamoDB table name not found at ${path}`)
  cachedTableName = name
  return name
}

async function requireAuth(
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<void> {
  const authHeader = event.headers['Authorization'] ?? event.headers['authorization'] ?? ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
  const secret = await getJwtSecret(alias)
  jwt.verify(token, secret, { algorithms: ['HS256'] })
}

/** Validate that a date string is YYYY-MM-DD. */
function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date))
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActionItem {
  id: string
  meetingDate: string
  assignee: string
  description: string
  dueDate: string
  status: 'open' | 'done'
  obsidianFile: string
}

interface DdbActionItem {
  pk: string
  sk: string
  assignee: string
  description: string
  dueDate: string
  status: 'open' | 'done'
  obsidianFile: string
}

function toResponseItem(raw: DdbActionItem, meetingDate: string): ActionItem {
  return {
    id: raw.sk.replace('ITEM#', ''),
    meetingDate,
    assignee: raw.assignee,
    description: raw.description,
    dueDate: raw.dueDate,
    status: raw.status,
    obsidianFile: raw.obsidianFile,
  }
}

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * GET /admin/meetings
 * Scan table for all MEETING# partition keys and return distinct dates most recent first.
 */
async function handleListMeetings(
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const tableName = await getTableName(alias)

  const result = await ddb.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: { ':prefix': 'MEETING#' },
      ProjectionExpression: 'pk',
    }),
  )

  const dateSet = new Set<string>()
  for (const item of result.Items ?? []) {
    const pk = item['pk'] as string
    dateSet.add(pk.replace('MEETING#', ''))
  }

  const dates = Array.from(dateSet).sort((a, b) => b.localeCompare(a))
  return respond(200, { dates }, alias, requestOrigin)
}

/**
 * GET /admin/meetings/{date}
 * Query all action items for the given meeting date.
 */
async function handleGetMeeting(
  date: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  if (!isValidDate(date)) {
    return respond(400, { error: 'Invalid date format — expected YYYY-MM-DD' }, alias, requestOrigin)
  }

  const tableName = await getTableName(alias)

  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `MEETING#${date}`,
        ':skPrefix': 'ITEM#',
      },
    }),
  )

  const items = (result.Items ?? []).map((raw) =>
    toResponseItem(raw as DdbActionItem, date),
  )

  return respond(200, items, alias, requestOrigin)
}

interface PostItemBody {
  id: string
  assignee: string
  description: string
  dueDate?: string
  status?: 'open' | 'done'
  obsidianFile?: string
}

function parsePostBody(raw: string | null, fallbackDate: string): PostItemBody & { dueDate: string; status: 'open' | 'done'; obsidianFile: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  const p = parsed as Record<string, unknown>

  if (typeof p['id'] !== 'string' || !p['id']) {
    throw Object.assign(new Error('id is required'), { statusCode: 400 })
  }
  if (typeof p['assignee'] !== 'string' || !p['assignee']) {
    throw Object.assign(new Error('assignee is required'), { statusCode: 400 })
  }
  if (typeof p['description'] !== 'string' || !p['description']) {
    throw Object.assign(new Error('description is required'), { statusCode: 400 })
  }

  const status = (p['status'] as 'open' | 'done' | undefined) ?? 'open'
  if (status !== 'open' && status !== 'done') {
    throw Object.assign(new Error('status must be "open" or "done"'), { statusCode: 400 })
  }

  return {
    id: p['id'] as string,
    assignee: p['assignee'] as string,
    description: p['description'] as string,
    dueDate: typeof p['dueDate'] === 'string' && p['dueDate'] ? p['dueDate'] as string : fallbackDate,
    status,
    obsidianFile: typeof p['obsidianFile'] === 'string' ? p['obsidianFile'] as string : '',
  }
}

/**
 * POST /admin/meetings/{date}/items
 * Create a new action item under the given meeting date.
 */
async function handleCreateItem(
  date: string,
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']
  if (!isValidDate(date)) {
    return respond(400, { error: 'Invalid date format — expected YYYY-MM-DD' }, alias, requestOrigin)
  }

  const body = parsePostBody(event.body, date)
  const tableName = await getTableName(alias)

  const item: DdbActionItem = {
    pk: `MEETING#${date}`,
    sk: `ITEM#${body.id}`,
    assignee: body.assignee,
    description: body.description,
    dueDate: body.dueDate,
    status: body.status,
    obsidianFile: body.obsidianFile,
  }

  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    }),
  )

  return respond(201, toResponseItem(item, date), alias, requestOrigin)
}

type PatchableFields = Partial<Pick<ActionItem, 'assignee' | 'description' | 'dueDate' | 'status' | 'obsidianFile'>>

function parsePatchBody(raw: string | null): PatchableFields {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  const p = parsed as Record<string, unknown>
  const allowed = ['assignee', 'description', 'dueDate', 'status', 'obsidianFile'] as const
  const patch: PatchableFields = {}

  for (const key of allowed) {
    if (key in p) {
      if (key === 'status') {
        const val = p[key]
        if (val !== 'open' && val !== 'done') {
          throw Object.assign(new Error('status must be "open" or "done"'), { statusCode: 400 })
        }
        patch.status = val
      } else {
        if (typeof p[key] !== 'string') {
          throw Object.assign(new Error(`${key} must be a string`), { statusCode: 400 })
        }
        // Safe cast: key is one of the string fields
        (patch as Record<string, unknown>)[key] = p[key]
      }
    }
  }

  if (Object.keys(patch).length === 0) {
    throw Object.assign(
      new Error('At least one field must be present in body: assignee, description, dueDate, status, obsidianFile'),
      { statusCode: 400 },
    )
  }

  return patch
}

/**
 * PATCH /admin/meetings/{date}/items/{id}
 * Update one or more fields on an existing action item.
 */
async function handleUpdateItem(
  date: string,
  id: string,
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']
  if (!isValidDate(date)) {
    return respond(400, { error: 'Invalid date format — expected YYYY-MM-DD' }, alias, requestOrigin)
  }

  const patch = parsePatchBody(event.body)
  const tableName = await getTableName(alias)

  const pk = `MEETING#${date}`
  const sk = `ITEM#${id}`

  // Verify the item exists before updating
  const existing = await ddb.send(
    new GetCommand({ TableName: tableName, Key: { pk, sk } }),
  )
  if (!existing.Item) {
    return respond(404, { error: `Action item ${id} not found for meeting ${date}` }, alias, requestOrigin)
  }

  // Build UpdateExpression dynamically from the patch fields
  const fieldMap: Record<string, string> = {
    assignee: '#assignee',
    description: '#description',
    dueDate: '#dueDate',
    status: '#status',
    obsidianFile: '#obsidianFile',
  }

  const setClauses: string[] = []
  const expressionNames: Record<string, string> = {}
  const expressionValues: Record<string, unknown> = {}

  for (const [field, nameToken] of Object.entries(fieldMap)) {
    if (field in patch) {
      const valueToken = `:${field}`
      setClauses.push(`${nameToken} = ${valueToken}`)
      expressionNames[nameToken] = field
      expressionValues[valueToken] = (patch as Record<string, unknown>)[field]
    }
  }

  const result = await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk },
      UpdateExpression: `SET ${setClauses.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    }),
  )

  return respond(200, toResponseItem(result.Attributes as DdbActionItem, date), alias, requestOrigin)
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
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

    // GET /admin/meetings — list all meeting dates
    if (method === 'GET' && resource === '/admin/meetings') {
      return await handleListMeetings(alias, requestOrigin)
    }

    // GET /admin/meetings/{date} — list items for a date
    if (method === 'GET' && resource === '/admin/meetings/{date}') {
      const date = event.pathParameters?.['date'] ?? ''
      return await handleGetMeeting(date, alias, requestOrigin)
    }

    // POST /admin/meetings/{date}/items — create an action item
    if (method === 'POST' && resource === '/admin/meetings/{date}/items') {
      const date = event.pathParameters?.['date'] ?? ''
      return await handleCreateItem(date, event, alias)
    }

    // PATCH /admin/meetings/{date}/items/{id} — update an action item
    if (method === 'PATCH' && resource === '/admin/meetings/{date}/items/{id}') {
      const date = event.pathParameters?.['date'] ?? ''
      const id = event.pathParameters?.['id'] ?? ''
      return await handleUpdateItem(date, id, event, alias)
    }

    return respond(405, { error: 'Method not allowed' }, alias, requestOrigin)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode
    if (code === 400) {
      return respond(400, { error: (err as Error).message }, alias, requestOrigin)
    }
    console.error('meeting-actions error:', err)
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
