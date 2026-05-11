import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import jwt from 'jsonwebtoken'
import { corsOrigin, respond } from './utils/cors'

const ssm = new SSMClient({ region: 'eu-west-2' })
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

const TABLE = process.env.AI_STUDIO_TABLE ?? 'aintern-ai-studio'

const jwtSecretCache = new Map<string, string>()

function resolveAlias(context: Context): string {
  const arn = context.invokedFunctionArn
  const alias = arn.split(':').pop() ?? 'dev'
  console.log('[ai-studio-save] resolveAlias | arn=%s alias=%s', arn, alias)
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
    console.warn('[ai-studio-save] requireAuth | JWT failed: %s', (err as Error).message)
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

  if (event.httpMethod !== 'POST') {
    return respond(405, { message: 'Method not allowed' }, alias, requestOrigin)
  }

  let body: { name?: string; templateId?: string; prompt?: string; code?: string }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return respond(400, { message: 'Invalid JSON body' }, alias, requestOrigin)
  }

  const { name, templateId, prompt, code } = body

  if (!name?.trim() || !templateId || !code?.trim()) {
    return respond(
      400,
      { message: 'name, templateId, and code are required' },
      alias,
      requestOrigin,
    )
  }

  const VALID_TEMPLATE_IDS = new Set([
    'vue-component', 'pinia-store', 'composable', 'landing-section', 'blank',
  ])

  if (!VALID_TEMPLATE_IDS.has(templateId)) {
    return respond(400, { message: 'Invalid templateId' }, alias, requestOrigin)
  }

  const id = slugify(name)
  const now = new Date().toISOString()

  // Check for existing item — 409 on conflict, no overwrite
  try {
    const existing = await dynamo.send(
      new GetCommand({ TableName: TABLE, Key: { id } }),
    )
    if (existing.Item) {
      console.log('[ai-studio-save] conflict | id=%s', id)
      return respond(409, { message: 'A component with this name already exists' }, alias, requestOrigin)
    }
  } catch (err: unknown) {
    console.error('[ai-studio-save] GetCommand error:', err)
    return respond(500, { message: 'Failed to check for existing component' }, alias, requestOrigin)
  }

  const item = {
    id,
    name: name.trim(),
    templateId,
    prompt: prompt ?? '',
    code,
    createdAt: now,
    updatedAt: now,
  }

  try {
    await dynamo.send(
      new PutCommand({
        TableName: TABLE,
        Item: item,
        ConditionExpression: 'attribute_not_exists(id)',
      }),
    )
    console.log('[ai-studio-save] saved | id=%s templateId=%s', id, templateId)
    return respond(201, item, alias, requestOrigin)
  } catch (err: unknown) {
    const awsErr = err as { name?: string }
    if (awsErr.name === 'ConditionalCheckFailedException') {
      return respond(409, { message: 'A component with this name already exists' }, alias, requestOrigin)
    }
    console.error('[ai-studio-save] PutCommand error:', err)
    return respond(500, { message: 'Failed to save component' }, alias, requestOrigin)
  }
}
