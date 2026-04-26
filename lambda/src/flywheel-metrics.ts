import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'
import jwt from 'jsonwebtoken'

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
  const res = await ssm.send(
    new GetParameterCommand({
      Name: `${process.env.JWT_SECRET_SSM_PREFIX}/${alias}`,
      WithDecryption: true,
    }),
  )
  cachedJwtSecret = res.Parameter?.Value ?? ''
  return cachedJwtSecret
}

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const res = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${alias}/dynamodb/table-name` }),
  )
  cachedTableName = res.Parameter?.Value ?? 'aintern-admin'
  return cachedTableName
}

async function verifyJwt(event: APIGatewayProxyEvent, alias: string): Promise<boolean> {
  const auth = event.headers['Authorization'] ?? event.headers['authorization'] ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return false
  try {
    const secret = await getJwtSecret(alias)
    jwt.verify(token, secret)
    return true
  } catch {
    return false
  }
}

function isoWeekStart(week: string): string {
  // week format: 2026-W18
  const [year, wStr] = week.split('-W')
  const w = parseInt(wStr, 10)
  const jan4 = new Date(parseInt(year, 10), 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const weekStart = new Date(jan4)
  weekStart.setDate(jan4.getDate() - dayOfWeek + 1 + (w - 1) * 7)
  return weekStart.toISOString()
}

function isoWeekEnd(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 7)
  return d.toISOString()
}

async function countItemsInWeek(
  tableName: string,
  gsi1pk: string,
  pkPrefix: string,
  weekStart: string,
  weekEnd: string,
): Promise<number> {
  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk AND GSI1sk BETWEEN :start AND :end',
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': gsi1pk,
        ':start': weekStart,
        ':end': weekEnd,
        ':prefix': pkPrefix,
      },
      Select: 'COUNT',
    }),
  )
  return res.Count ?? 0
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const alias = resolveAlias(context)
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']

  if (!(await verifyJwt(event, alias))) {
    return respond(401, { error: 'Unauthorized' }, alias, requestOrigin)
  }

  const tableName = await getTableName(alias)

  // GET /admin/pain-signals?limit=20
  if (event.httpMethod === 'GET' && event.path?.includes('/pain-signals')) {
    const rawLimit = parseInt(event.queryStringParameters?.limit ?? '20', 10)
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100)
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1pk = :gsi1pk',
        FilterExpression: 'begins_with(pk, :prefix)',
        ExpressionAttributeValues: {
          ':gsi1pk': 'STATUS#new',
          ':prefix': 'PAIN#',
        },
        Limit: limit,
        ScanIndexForward: false,
      }),
    )
    return respond(200, res.Items ?? [], alias, requestOrigin)
  }

  // GET /admin/flywheel-metrics?week=2026-W18
  if (event.httpMethod === 'GET') {
    const WEEK_RE = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/
    const now = new Date()
    const defaultWeek = `${now.getFullYear()}-W${String(Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)).padStart(2, '0')}`
    const requestedWeek = event.queryStringParameters?.week ?? defaultWeek
    const currentWeek = WEEK_RE.test(requestedWeek) ? requestedWeek : defaultWeek

    const weekStart = isoWeekStart(currentWeek)
    const weekEnd = isoWeekEnd(weekStart)

    const [pains, opportunities, posts, scanSubmissions, outreachAlerts] = await Promise.all([
      countItemsInWeek(tableName, 'STATUS#new', 'PAIN#', weekStart, weekEnd),
      countItemsInWeek(tableName, 'PRIORITY#high', 'OPPORTUNITY#', weekStart, weekEnd),
      countItemsInWeek(tableName, 'CHANNEL#linkedin_company', 'CONTENT#', weekStart, weekEnd),
      countItemsInWeek(tableName, 'STATUS#new', 'SCAN#', weekStart, weekEnd),
      countItemsInWeek(tableName, 'STATUS#pending', 'OUTREACH#', weekStart, weekEnd),
    ])

    return respond(
      200,
      {
        week: currentWeek,
        topFunnel: { pains, opportunities, posts },
        midFunnel: { scanSubmissions },
        bottomFunnel: { outreachAlerts },
      },
      alias,
      requestOrigin,
    )
  }

  // PUT /admin/flywheel-metrics — manual metric entry
  if (event.httpMethod === 'PUT') {
    let body: { week: string; key: string; value: number }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return respond(400, { error: 'Invalid JSON' }, alias, requestOrigin)
    }

    const WEEK_RE = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/
    const KEY_RE = /^[a-z_]{1,50}$/
    if (!WEEK_RE.test(body.week) || !KEY_RE.test(body.key) || typeof body.value !== 'number') {
      return respond(400, { error: 'Invalid metric payload' }, alias, requestOrigin)
    }

    const now = new Date().toISOString()
    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: `METRIC#${body.week}#${body.key}`,
          sk: 'VALUE',
          GSI1pk: `WEEK#${body.week}`,
          GSI1sk: now,
          week: body.week,
          key: body.key,
          value: body.value,
          updatedAt: now,
        },
      }),
    )

    return respond(200, { ok: true }, alias, requestOrigin)
  }

  return respond(404, { error: 'Not found' }, alias, requestOrigin)
}
