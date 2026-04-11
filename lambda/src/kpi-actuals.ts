import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
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

function corsOrigin(alias: string): string {
  return alias === 'prod' ? 'https://aintern.nl' : 'http://localhost:5173'
}

function respond(
  statusCode: number,
  body: unknown,
  alias: string,
): APIGatewayProxyResult {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin(alias),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  if (statusCode === 204) {
    return { statusCode, headers, body: '' }
  }
  return { statusCode, headers, body: JSON.stringify(body) }
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
  const path = `${process.env.DYNAMODB_TABLE_SSM_PREFIX}/${alias}/dynamodb/table-name`
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: false }),
  )
  const name = result.Parameter?.Value
  if (!name) throw new Error(`DynamoDB table name not found at ${path}`)
  cachedTableName = name
  return name
}

/**
 * Validate Bearer JWT. Returns the decoded payload or throws on invalid/missing token.
 */
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
  // jwt.verify throws on invalid/expired tokens
  jwt.verify(token, secret, { algorithms: ['HS256'] })
}

/**
 * Compute the current ISO week string, e.g. "2026-W15".
 * No external dependency — pure Date arithmetic.
 */
function currentIsoWeek(): string {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1)
  const weekNum =
    Math.floor((now.getTime() - startOfWeek1.getTime()) / (7 * 86400000)) + 1
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// ── Route handlers ────────────────────────────────────────────────────────────

interface ActualItem {
  value: number
  source: 'automated' | 'manual'
}

async function handleGet(
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const week = event.queryStringParameters?.['week'] ?? currentIsoWeek()
  const tableName = await getTableName(alias)

  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': `METRIC#${week}` },
    }),
  )

  const actuals: Record<string, ActualItem> = {}
  for (const item of result.Items ?? []) {
    const sk = item['sk'] as string
    actuals[sk] = {
      value: item['value'] as number,
      source: item['source'] as 'automated' | 'manual',
    }
  }

  return respond(200, { week, actuals }, alias)
}

interface PutBody {
  week: string
  metricId: string
  value: number
}

function parsePutBody(raw: string | null): PutBody {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>)['week'] !== 'string' ||
    !(parsed as Record<string, unknown>)['week'] ||
    typeof (parsed as Record<string, unknown>)['metricId'] !== 'string' ||
    !(parsed as Record<string, unknown>)['metricId'] ||
    typeof (parsed as Record<string, unknown>)['value'] !== 'number' ||
    ((parsed as Record<string, unknown>)['value'] as number) < 0
  ) {
    throw Object.assign(
      new Error('week (string), metricId (string), and value (non-negative number) are required'),
      { statusCode: 400 },
    )
  }

  return {
    week: (parsed as Record<string, unknown>)['week'] as string,
    metricId: (parsed as Record<string, unknown>)['metricId'] as string,
    value: (parsed as Record<string, unknown>)['value'] as number,
  }
}

async function handlePut(
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const { week, metricId, value } = parsePutBody(event.body)
  const tableName = await getTableName(alias)

  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk: `METRIC#${week}`,
        sk: metricId,
        value,
        source: 'manual',
        updatedAt: new Date().toISOString(),
      },
      // Only write if row doesn't exist yet, OR if the existing row was manually entered.
      // This prevents a manual PUT from overwriting an automated row.
      ConditionExpression: 'attribute_not_exists(pk) OR #src = :manual',
      ExpressionAttributeNames: { '#src': 'source' },
      ExpressionAttributeValues: { ':manual': 'manual' },
    }),
  )

  return respond(204, null, alias)
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const alias = resolveAlias(context)

  try {
    await requireAuth(event, alias)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode ?? 401
    return respond(code, { error: (err as Error).message }, alias)
  }

  try {
    const method = event.httpMethod
    if (method === 'GET') {
      return await handleGet(event, alias)
    }
    if (method === 'PUT') {
      return await handlePut(event, alias)
    }
    return respond(405, { error: 'Method not allowed' }, alias)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode
    if (code === 400) {
      return respond(400, { error: (err as Error).message }, alias)
    }
    // DynamoDB ConditionalCheckFailedException — PUT blocked because row is automated
    const awsCode = (err as { name?: string }).name
    if (awsCode === 'ConditionalCheckFailedException') {
      return respond(409, { error: 'Cannot overwrite an automated actual with a manual value' }, alias)
    }
    console.error('kpi-actuals error:', err)
    return respond(500, { error: 'Internal server error' }, alias)
  }
}
