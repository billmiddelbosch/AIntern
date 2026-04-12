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
  const arn = context.invokedFunctionArn
  const alias = arn.split(':').pop() ?? 'dev'
  console.log('[kpi-actuals] resolveAlias | arn=%s alias=%s', arn, alias)
  return alias
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
  if (cachedJwtSecret) {
    console.log('[kpi-actuals] getJwtSecret | using cached secret for alias=%s', alias)
    return cachedJwtSecret
  }
  const path = `${process.env.JWT_SECRET_SSM_PREFIX}/${alias}`
  console.log('[kpi-actuals] getJwtSecret | fetching from SSM path=%s', path)
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: true }),
  )
  const secret = result.Parameter?.Value
  if (!secret) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = secret
  console.log('[kpi-actuals] getJwtSecret | fetched OK')
  return secret
}

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) {
    console.log('[kpi-actuals] getTableName | using cached tableName=%s', cachedTableName)
    return cachedTableName
  }
  const path = `${process.env.DYNAMODB_TABLE_SSM_PREFIX}/${alias}/dynamodb/table-name`
  console.log('[kpi-actuals] getTableName | fetching from SSM path=%s', path)
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: false }),
  )
  const name = result.Parameter?.Value
  if (!name) throw new Error(`DynamoDB table name not found at ${path}`)
  cachedTableName = name
  console.log('[kpi-actuals] getTableName | resolved tableName=%s', name)
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
  console.log(
    '[kpi-actuals] requireAuth | Authorization header present=%s scheme=%s',
    !!authHeader,
    authHeader.split(' ')[0] || '(none)',
  )
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    console.warn('[kpi-actuals] requireAuth | missing or malformed Bearer token')
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
  const secret = await getJwtSecret(alias)
  try {
    jwt.verify(token, secret, { algorithms: ['HS256'] })
    console.log('[kpi-actuals] requireAuth | JWT verified OK')
  } catch (err: unknown) {
    console.warn('[kpi-actuals] requireAuth | JWT verification failed: %s', (err as Error).message)
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
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
  console.log('[kpi-actuals] GET | week=%s', week)

  const tableName = await getTableName(alias)

  console.log('[kpi-actuals] GET | querying DynamoDB table=%s pk=METRIC#%s', tableName, week)
  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': `METRIC#${week}` },
    }),
  )
  console.log('[kpi-actuals] GET | DynamoDB returned %d item(s)', result.Items?.length ?? 0)

  const actuals: Record<string, ActualItem> = {}
  for (const item of result.Items ?? []) {
    const sk = item['sk'] as string
    actuals[sk] = {
      value: item['value'] as number,
      source: item['source'] as 'automated' | 'manual',
    }
  }

  console.log('[kpi-actuals] GET | responding 200 with %d metrics', Object.keys(actuals).length)
  return respond(200, { week, actuals }, alias)
}

interface PutBody {
  week: string
  metricId: string
  value: number
}

function parsePutBody(raw: string | null): PutBody {
  console.log('[kpi-actuals] parsePutBody | raw body length=%d', raw?.length ?? 0)
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

  const body = {
    week: (parsed as Record<string, unknown>)['week'] as string,
    metricId: (parsed as Record<string, unknown>)['metricId'] as string,
    value: (parsed as Record<string, unknown>)['value'] as number,
  }
  console.log('[kpi-actuals] parsePutBody | week=%s metricId=%s value=%d', body.week, body.metricId, body.value)
  return body
}

async function handlePut(
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<APIGatewayProxyResult> {
  const { week, metricId, value } = parsePutBody(event.body)
  const tableName = await getTableName(alias)

  console.log(
    '[kpi-actuals] PUT | writing to table=%s pk=METRIC#%s sk=%s value=%d source=manual',
    tableName, week, metricId, value,
  )

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

  console.log('[kpi-actuals] PUT | DynamoDB write OK — responding 204')
  return respond(204, null, alias)
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  console.log(
    '[kpi-actuals] handler | requestId=%s method=%s path=%s qs=%s',
    context.awsRequestId,
    event.httpMethod,
    event.path,
    JSON.stringify(event.queryStringParameters ?? {}),
  )

  const alias = resolveAlias(context)

  try {
    await requireAuth(event, alias)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode ?? 401
    console.warn('[kpi-actuals] auth failed | status=%d message=%s', code, (err as Error).message)
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
    console.warn('[kpi-actuals] method not allowed | method=%s', method)
    return respond(405, { error: 'Method not allowed' }, alias)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode
    if (code === 400) {
      console.warn('[kpi-actuals] bad request | %s', (err as Error).message)
      return respond(400, { error: (err as Error).message }, alias)
    }
    // DynamoDB ConditionalCheckFailedException — PUT blocked because row is automated
    const awsCode = (err as { name?: string }).name
    if (awsCode === 'ConditionalCheckFailedException') {
      console.warn('[kpi-actuals] ConditionalCheckFailed | PUT blocked — row is automated')
      return respond(409, { error: 'Cannot overwrite an automated actual with a manual value' }, alias)
    }
    console.error('[kpi-actuals] unhandled error | %s', (err as Error).message, err)
    return respond(500, { error: 'Internal server error' }, alias)
  }
}
