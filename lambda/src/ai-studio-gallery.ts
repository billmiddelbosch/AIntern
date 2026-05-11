import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'
import jwt from 'jsonwebtoken'
import { corsOrigin, respond } from './utils/cors'

const ssm = new SSMClient({ region: 'eu-west-2' })
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

const TABLE = process.env.AI_STUDIO_TABLE ?? 'aintern-ai-studio'

const jwtSecretCache = new Map<string, string>()

function resolveAlias(context: Context): string {
  const arn = context.invokedFunctionArn
  const alias = arn.split(':').pop() ?? 'dev'
  console.log('[ai-studio-gallery] resolveAlias | arn=%s alias=%s', arn, alias)
  return alias
}

async function getSsmParam(name: string): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }))
  const value = result.Parameter?.Value
  if (!value) throw new Error(`SSM param not found: ${name}`)
  return value
}

async function getJwtSecret(alias: string): Promise<string> {
  if (jwtSecretCache.has(alias)) return jwtSecretCache.get(alias)!
  const value = await getSsmParam(`${process.env.JWT_SECRET_SSM_PREFIX ?? '/aintern/jwt-secret'}/${alias}`)
  jwtSecretCache.set(alias, value)
  return value
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
    console.warn('[ai-studio-gallery] requireAuth | JWT failed: %s', (err as Error).message)
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const alias = resolveAlias(context)
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']

  if (event.httpMethod === 'OPTIONS') {
    return respond(204, '', alias, requestOrigin)
  }

  try {
    await requireAuth(event, alias)
  } catch {
    return respond(401, { message: 'Unauthorized' }, alias, requestOrigin)
  }

  if (event.httpMethod !== 'GET') {
    return respond(405, { message: 'Method not allowed' }, alias, requestOrigin)
  }

  try {
    const result = await dynamo.send(
      new ScanCommand({ TableName: TABLE, Limit: 100 }),
    )

    const items = (result.Items ?? []).sort(
      (a, b) => new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime(),
    )

    console.log('[ai-studio-gallery] fetched | count=%d', items.length)
    return respond(200, { items }, alias, requestOrigin)
  } catch (err: unknown) {
    console.error('[ai-studio-gallery] ScanCommand error:', err)
    return respond(500, { message: 'Failed to load gallery' }, alias, requestOrigin)
  }
}
