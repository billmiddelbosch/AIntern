import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  GetCommand,
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
  const secret = await getJwtSecret(alias)
  try {
    jwt.verify(token, secret)
    return true
  } catch {
    return false
  }
}

function toEditorialItem(raw: Record<string, unknown>) {
  const { pk, sk, ...rest } = raw
  void sk
  return { ...rest, id: (pk as string).replace('EDITORIAL#', '') }
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
  const path = event.path ?? ''

  // PUT /admin/editorial-outreach/{id}/approve
  // PUT /admin/editorial-outreach/{id}/skip
  if (method === 'PUT') {
    const approveMatch = path.match(/\/admin\/editorial-outreach\/([^/]+)\/(approve|skip)$/)
    if (!approveMatch) {
      return respond(404, { error: 'Not found' }, alias, requestOrigin)
    }
    const id = approveMatch[1]
    const action = approveMatch[2] as 'approve' | 'skip'

    if (!id || !/^[a-f0-9]{24}$/.test(id)) {
      return respond(400, { error: 'Invalid id' }, alias, requestOrigin)
    }

    const pk = `EDITORIAL#${id}`
    const newStatus = action === 'approve' ? 'approved' : 'skipped'
    const newGsi1pk = action === 'approve' ? 'STATUS#approved' : 'STATUS#skipped'
    const now = new Date().toISOString()

    try {
      await ddb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk, sk: 'OUTREACH' },
          UpdateExpression: 'SET #status = :status, GSI1pk = :gsi1pk, updatedAt = :ts',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': newStatus,
            ':gsi1pk': newGsi1pk,
            ':ts': now,
          },
          ConditionExpression: 'attribute_exists(pk)',
        }),
      )
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
        return respond(404, { error: 'Editorial item not found' }, alias, requestOrigin)
      }
      console.error('[editorial-crud] update error | pk=%s action=%s', pk, action, err)
      return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
    }

    // Return the updated item
    try {
      const getRes = await ddb.send(
        new GetCommand({ TableName: tableName, Key: { pk, sk: 'OUTREACH' } }),
      )
      const item = getRes.Item
        ? toEditorialItem(getRes.Item as Record<string, unknown>)
        : { id, status: newStatus }
      return respond(200, item, alias, requestOrigin)
    } catch {
      return respond(200, { id, status: newStatus }, alias, requestOrigin)
    }
  }

  // GET /admin/editorial-outreach?status=...
  if (method === 'GET') {
    const rawStatus = event.queryStringParameters?.status ?? 'pending_approval'

    if (rawStatus === 'all') {
      // Scan for all EDITORIAL# items
      const scanRes = await ddb.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: 'begins_with(pk, :prefix)',
          ExpressionAttributeValues: { ':prefix': 'EDITORIAL#' },
          Limit: 100,
        }),
      )
      const items = (scanRes.Items ?? []).map((i) =>
        toEditorialItem(i as Record<string, unknown>),
      )
      return respond(200, items, alias, requestOrigin)
    }

    // Query GSI1 by specific status
    const STATUS_RE = /^[a-z_]{1,40}$/
    if (!STATUS_RE.test(rawStatus)) {
      return respond(400, { error: 'Invalid status parameter' }, alias, requestOrigin)
    }

    const queryRes = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1pk = :gsi1pk',
        FilterExpression: 'begins_with(pk, :prefix)',
        ExpressionAttributeValues: {
          ':gsi1pk': `STATUS#${rawStatus}`,
          ':prefix': 'EDITORIAL#',
        },
        ScanIndexForward: false,
        Limit: 50,
      }),
    )

    const items = (queryRes.Items ?? []).map((i) =>
      toEditorialItem(i as Record<string, unknown>),
    )
    return respond(200, items, alias, requestOrigin)
  }

  return respond(404, { error: 'Not found' }, alias, requestOrigin)
}
