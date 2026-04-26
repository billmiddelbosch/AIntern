import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
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

function validateSubredditName(name: unknown): string | null {
  if (typeof name !== 'string') return null
  const cleaned = name.trim().toLowerCase().replace(/^r\//, '')
  if (!cleaned || cleaned.length > 30) return null
  if (!/^[a-z0-9_]+$/.test(cleaned)) return null
  return cleaned
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
  const method = event.httpMethod
  const rawName = event.pathParameters?.name

  // GET /admin/subreddit-config — list all
  if (method === 'GET') {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1pk = :gsi1pk',
        FilterExpression: 'begins_with(pk, :prefix)',
        ExpressionAttributeValues: {
          ':gsi1pk': 'STATUS#active',
          ':prefix': 'SUBREDDIT#',
        },
      }),
    )
    // Also fetch inactive ones via scan fallback
    const active = res.Items ?? []

    return respond(200, active.map((i) => ({
      name: (i.pk as string).replace('SUBREDDIT#', ''),
      active: i.active,
      signalCount: i.signalCount ?? 0,
      addedAt: i.addedAt,
      updatedAt: i.updatedAt,
    })), alias, requestOrigin)
  }

  // POST /admin/subreddit-config — add new
  if (method === 'POST') {
    let body: { name?: string }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return respond(400, { error: 'Invalid JSON' }, alias, requestOrigin)
    }
    const name = validateSubredditName(body.name)
    if (!name) {
      return respond(400, { error: 'Invalid subreddit name' }, alias, requestOrigin)
    }

    const now = new Date().toISOString()
    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: `SUBREDDIT#${name}`,
          sk: 'CONFIG',
          GSI1pk: 'STATUS#active',
          GSI1sk: now,
          name,
          active: true,
          signalCount: 0,
          addedAt: now,
          updatedAt: now,
        },
        ConditionExpression: 'attribute_not_exists(pk)',
      }),
    )

    return respond(201, { name, active: true, signalCount: 0, addedAt: now, updatedAt: now }, alias, requestOrigin)
  }

  // PUT /admin/subreddit-config/{name} — toggle active or update
  if (method === 'PUT' && rawName) {
    const name = validateSubredditName(decodeURIComponent(rawName))
    if (!name) return respond(400, { error: 'Invalid subreddit name' }, alias, requestOrigin)
    let body: { active?: boolean }
    try {
      body = JSON.parse(event.body ?? '{}')
    } catch {
      return respond(400, { error: 'Invalid JSON' }, alias, requestOrigin)
    }
    const now = new Date().toISOString()

    const newActive = typeof body.active === 'boolean' ? body.active : true
    const newGsi1pk = newActive ? 'STATUS#active' : 'STATUS#inactive'

    await ddb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: `SUBREDDIT#${name}`, sk: 'CONFIG' },
        UpdateExpression: 'SET #active = :active, GSI1pk = :gsi1pk, updatedAt = :now',
        ExpressionAttributeNames: { '#active': 'active' },
        ExpressionAttributeValues: { ':active': newActive, ':gsi1pk': newGsi1pk, ':now': now },
      }),
    )

    return respond(200, { name, active: newActive, updatedAt: now }, alias, requestOrigin)
  }

  // DELETE /admin/subreddit-config/{name}
  if (method === 'DELETE' && rawName) {
    const name = validateSubredditName(decodeURIComponent(rawName))
    if (!name) return respond(400, { error: 'Invalid subreddit name' }, alias, requestOrigin)
    await ddb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { pk: `SUBREDDIT#${name}`, sk: 'CONFIG' },
      }),
    )
    return respond(204, null, alias, requestOrigin)
  }

  return respond(404, { error: 'Not found' }, alias, requestOrigin)
}
