import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function toSequenceItem(raw: Record<string, unknown>) {
  const { pk, sk, ...rest } = raw
  void sk
  return { ...rest, id: (pk as string).replace('SEQUENCE#', '') }
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

  // PATCH /admin/sequences/{id}
  if (method === 'PATCH') {
    const patchMatch = path.match(/\/admin\/sequences\/([^/]+)$/)
    if (!patchMatch) return respond(404, { error: 'Not found' }, alias, requestOrigin)

    const id = patchMatch[1]
    if (!UUID_RE.test(id)) return respond(400, { error: 'Invalid id' }, alias, requestOrigin)

    let parsed: { emailSubject?: unknown; emailBody?: unknown }
    try {
      parsed = JSON.parse(event.body ?? '{}')
    } catch {
      return respond(400, { error: 'Invalid JSON body' }, alias, requestOrigin)
    }

    const { emailSubject, emailBody } = parsed
    if (typeof emailSubject !== 'string' || typeof emailBody !== 'string') {
      return respond(400, { error: 'emailSubject and emailBody required' }, alias, requestOrigin)
    }

    const pk = `SEQUENCE#${id}`
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk, sk: 'ENTRY' },
          UpdateExpression: 'SET emailSubject = :subj, emailBody = :body, updatedAt = :ts',
          ExpressionAttributeValues: {
            ':subj': emailSubject.slice(0, 200),
            ':body': emailBody.slice(0, 2000),
            ':ts': new Date().toISOString(),
          },
          ConditionExpression: 'attribute_exists(pk)',
        }),
      )
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
        return respond(404, { error: 'Sequence not found' }, alias, requestOrigin)
      }
      console.error('[sequence-crud] patch error | pk=%s', pk, err)
      return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
    }

    return respond(200, { id, emailSubject: emailSubject.slice(0, 200), emailBody: emailBody.slice(0, 2000) }, alias, requestOrigin)
  }

  // GET /admin/sequences
  if (method === 'GET') {
    const queryRes = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1pk = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': 'STATUS#email_scheduled',
        },
        ScanIndexForward: true,
        Limit: 50,
      }),
    )

    // Fetch full items from base table so all attributes (email, emailBody etc.) are available
    const items = await Promise.all(
      (queryRes.Items ?? []).map(async (indexItem) => {
        const pk = indexItem['pk'] as string
        const sk = indexItem['sk'] as string
        try {
          const res = await ddb.send(new GetCommand({ TableName: tableName, Key: { pk, sk } }))
          return res.Item ? toSequenceItem(res.Item as Record<string, unknown>) : null
        } catch {
          return null
        }
      }),
    )

    return respond(200, items.filter(Boolean), alias, requestOrigin)
  }

  return respond(404, { error: 'Not found' }, alias, requestOrigin)
}
