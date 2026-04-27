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
import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import { respond } from './utils/cors'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

let cachedJwtSecret: string | null = null
let cachedTableName: string | null = null

const CHECKLIST_ITEMS = [
  { id: 'intro_call', label: 'Introductiegesprek gevoerd (doelen, verwachtingen, tijdlijn)' },
  { id: 'access_setup', label: 'Toegang verleend (systemen, tools, accounts)' },
  { id: 'nda_signed', label: 'NDA / verwerkersovereenkomst ondertekend' },
  { id: 'process_mapping', label: 'Proceskaart opgesteld (te automatiseren workflow gedocumenteerd)' },
  { id: 'data_sample', label: 'Voorbeelddata ontvangen en gevalideerd' },
  { id: 'first_automation', label: 'Eerste automatisering opgeleverd (demo of live)' },
  { id: 'client_feedback', label: 'Feedbackronde afgerond (client akkoord of aanpassingen verwerkt)' },
  { id: 'go_live', label: 'Go-live bevestigd door client' },
  { id: 'training', label: 'Gebruikerstraining gegeven' },
  { id: 'sign_off', label: 'Formele sign-off ontvangen (handtekening of schriftelijke bevestiging)' },
] as const

type ChecklistItemId = (typeof CHECKLIST_ITEMS)[number]['id']

interface ChecklistItem {
  id: ChecklistItemId
  label: string
  done: boolean
  completedAt: string | null
}

interface OnboardingEntry {
  clientId: string
  clientName: string
  createdAt: string
  createdBy: string
  status: 'active' | 'completed'
  items: ChecklistItem[]
}

function resolveAlias(context: Context): string {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  console.log('[onboarding] resolveAlias | arn=%s alias=%s', context.invokedFunctionArn, alias)
  return alias
}

async function getJwtSecret(alias: string): Promise<string> {
  if (cachedJwtSecret) return cachedJwtSecret
  const path = `${process.env.JWT_SECRET_SSM_PREFIX}/${alias}`
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: true }))
  const secret = result.Parameter?.Value
  if (!secret) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = secret
  return secret
}

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const path = `${process.env.ONBOARDING_TABLE_SSM_PREFIX}/${alias}/dynamodb/onboarding-table-name`
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: false }))
  const name = result.Parameter?.Value
  if (!name) throw new Error(`Onboarding table name not found at ${path}`)
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

function computeStatus(items: ChecklistItem[]): 'active' | 'completed' {
  return items.every((i) => i.done) ? 'completed' : 'active'
}

async function handleCreate(
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
  const clientName = typeof body['clientName'] === 'string' ? body['clientName'].trim() : ''
  const createdBy = typeof body['createdBy'] === 'string' ? body['createdBy'].trim() : 'admin'

  if (!clientName) {
    throw Object.assign(new Error('clientName is required'), { statusCode: 400 })
  }

  const clientId = randomUUID()
  const now = new Date().toISOString()

  const items: ChecklistItem[] = CHECKLIST_ITEMS.map((c) => ({
    id: c.id,
    label: c.label,
    done: false,
    completedAt: null,
  }))

  const entry: OnboardingEntry = {
    clientId,
    clientName,
    createdAt: now,
    createdBy,
    status: 'active',
    items,
  }

  const tableName = await getTableName(alias)
  await ddb.send(new PutCommand({ TableName: tableName, Item: entry }))

  console.log('[onboarding] handleCreate | clientId=%s clientName=%s', clientId, clientName)
  return respond(201, entry, alias, requestOrigin)
}

async function handleList(
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const tableName = await getTableName(alias)
  const result = await ddb.send(new ScanCommand({ TableName: tableName }))
  const entries = ((result.Items ?? []) as OnboardingEntry[]).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  )
  console.log('[onboarding] handleList | count=%d', entries.length)
  return respond(200, entries, alias, requestOrigin)
}

async function handleGetOne(
  clientId: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const tableName = await getTableName(alias)
  const result = await ddb.send(new GetCommand({ TableName: tableName, Key: { clientId } }))
  if (!result.Item) {
    return respond(404, { error: `Client ${clientId} not found` }, alias, requestOrigin)
  }
  return respond(200, result.Item, alias, requestOrigin)
}

async function handleToggleItem(
  clientId: string,
  itemId: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const tableName = await getTableName(alias)

  const existing = await ddb.send(new GetCommand({ TableName: tableName, Key: { clientId } }))
  if (!existing.Item) {
    return respond(404, { error: `Client ${clientId} not found` }, alias, requestOrigin)
  }

  const entry = existing.Item as OnboardingEntry
  const itemIndex = entry.items.findIndex((i) => i.id === itemId)
  if (itemIndex === -1) {
    return respond(404, { error: `Item ${itemId} not found` }, alias, requestOrigin)
  }

  const newDone = !entry.items[itemIndex].done
  const newCompletedAt = newDone ? new Date().toISOString() : null

  const updatedItems = entry.items.map((item, idx) =>
    idx === itemIndex ? { ...item, done: newDone, completedAt: newCompletedAt } : item,
  )

  const newStatus = computeStatus(updatedItems)

  const result = await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { clientId },
      UpdateExpression: 'SET #items = :items, #status = :status',
      ExpressionAttributeNames: { '#items': 'items', '#status': 'status' },
      ExpressionAttributeValues: { ':items': updatedItems, ':status': newStatus },
      ReturnValues: 'ALL_NEW',
    }),
  )

  console.log(
    '[onboarding] handleToggleItem | clientId=%s itemId=%s done=%s status=%s',
    clientId,
    itemId,
    newDone,
    newStatus,
  )
  return respond(200, result.Attributes, alias, requestOrigin)
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  console.log(
    '[onboarding] handler | requestId=%s method=%s path=%s resource=%s',
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

    if (method === 'POST' && resource === '/admin/onboarding') {
      return await handleCreate(event, alias)
    }

    if (method === 'GET' && resource === '/admin/onboarding') {
      return await handleList(alias, requestOrigin)
    }

    if (method === 'GET' && resource === '/admin/onboarding/{clientId}') {
      const clientId = event.pathParameters?.['clientId'] ?? ''
      return await handleGetOne(clientId, alias, requestOrigin)
    }

    if (method === 'PATCH' && resource === '/admin/onboarding/{clientId}/items/{itemId}') {
      const clientId = event.pathParameters?.['clientId'] ?? ''
      const itemId = event.pathParameters?.['itemId'] ?? ''
      return await handleToggleItem(clientId, itemId, alias, requestOrigin)
    }

    return respond(405, { error: 'Method not allowed' }, alias, requestOrigin)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode
    if (code === 400) {
      return respond(400, { error: (err as Error).message }, alias, requestOrigin)
    }
    console.error('[onboarding] unhandled error:', err)
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
