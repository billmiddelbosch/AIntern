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

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

let cachedJwtSecret: string | null = null
let cachedTableName: string | null = null

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
  companyName?: string
  linkedinUrl?: string
  linkedinName?: string
  status: LeadStatus
  assignee?: string
  connectionSentAt?: string
  connectionMessage?: string
  connectionVariant?: string
  dmSentAt?: string
  dmMessage?: string
  dmVariant?: string
  dmResponse?: string
  discoveryBookedAt?: string
  discoveryCallUrl?: string
  source?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface DdbLead extends Lead {
  pk: string
  sk: string
}

const VALID_STATUSES = new Set<string>([
  'new', 'enriched', 'connection_sent', 'connected',
  'dm_sent', 'dm_responded', 'discovery_booked', 'won', 'lost', 'not_found',
])

const UPDATABLE_FIELDS = [
  'connectionMessage', 'dmMessage', 'status', 'notes',
  'linkedinUrl', 'linkedinName', 'companyName', 'assignee',
  'connectionSentAt', 'connectionVariant', 'dmSentAt', 'dmVariant',
  'dmResponse', 'discoveryBookedAt', 'discoveryCallUrl',
] as const

type UpdatableField = (typeof UPDATABLE_FIELDS)[number]

function toLead(raw: DdbLead): Lead {
  const { pk: _pk, sk: _sk, ...lead } = raw
  return lead
}

async function handleList(
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const tableName = await getTableName(alias)

  const result = await ddb.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: { ':prefix': 'LEAD#' },
    }),
  )

  const leads = ((result.Items ?? []) as DdbLead[])
    .map(toLead)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  console.log('[lead-crud] handleList | returning %d leads', leads.length)
  return respond(200, leads, alias, requestOrigin)
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
      Key: { pk: `LEAD#${id}`, sk: 'METADATA' },
    }),
  )

  if (!result.Item) {
    return respond(404, { error: `Lead ${id} not found` }, alias, requestOrigin)
  }

  return respond(200, toLead(result.Item as DdbLead), alias, requestOrigin)
}

function parseUpdateBody(raw: string | null): Partial<Pick<Lead, UpdatableField>> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  const p = parsed as Record<string, unknown>
  const patch: Partial<Pick<Lead, UpdatableField>> = {}

  for (const field of UPDATABLE_FIELDS) {
    if (!(field in p)) continue
    if (field === 'status') {
      if (!VALID_STATUSES.has(p[field] as string)) {
        throw Object.assign(
          new Error(`status must be one of: ${Array.from(VALID_STATUSES).join(', ')}`),
          { statusCode: 400 },
        )
      }
      patch.status = p[field] as LeadStatus
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

  const pk = `LEAD#${id}`
  const sk = 'METADATA'

  const existing = await ddb.send(new GetCommand({ TableName: tableName, Key: { pk, sk } }))
  if (!existing.Item) {
    return respond(404, { error: `Lead ${id} not found` }, alias, requestOrigin)
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

  return respond(200, toLead(result.Attributes as DdbLead), alias, requestOrigin)
}

async function handleImport(
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']

  let parsed: unknown
  try {
    parsed = JSON.parse(event.body ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  const body = parsed as Record<string, unknown>
  if (!Array.isArray(body['leads'])) {
    throw Object.assign(new Error('leads array is required'), { statusCode: 400 })
  }

  const leads = body['leads'] as Lead[]
  const tableName = await getTableName(alias)
  let imported = 0

  for (const lead of leads) {
    if (!lead.website) continue

    const pk = `LEAD#${encodeURIComponent(lead.website)}`
    const sk = 'METADATA'

    const item: DdbLead = { ...lead, pk, sk }
    const cleanItem = Object.fromEntries(
      Object.entries(item).filter(([, v]) => v !== undefined && v !== ''),
    ) as DdbLead

    await ddb.send(new PutCommand({ TableName: tableName, Item: cleanItem }))
    imported++
  }

  console.log('[lead-crud] handleImport | imported %d leads', imported)
  return respond(200, { imported }, alias, requestOrigin)
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  console.log(
    '[lead-crud] handler | requestId=%s method=%s path=%s resource=%s',
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

    if (method === 'GET' && resource === '/admin/leads') {
      return await handleList(alias, requestOrigin)
    }

    if (method === 'GET' && resource === '/admin/leads/{id}') {
      const id = event.pathParameters?.['id'] ?? ''
      return await handleGetOne(id, alias, requestOrigin)
    }

    if (method === 'PUT' && resource === '/admin/leads/{id}') {
      const id = event.pathParameters?.['id'] ?? ''
      return await handleUpdate(id, event, alias)
    }

    if (method === 'POST' && resource === '/admin/leads') {
      return await handleImport(event, alias)
    }

    return respond(405, { error: 'Method not allowed' }, alias, requestOrigin)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode
    if (code === 400) {
      return respond(400, { error: (err as Error).message }, alias, requestOrigin)
    }
    console.error('[lead-crud] unhandled error:', err)
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
