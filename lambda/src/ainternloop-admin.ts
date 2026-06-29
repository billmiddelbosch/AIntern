import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import jwt from 'jsonwebtoken'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

let cachedJwtSecret: { alias: string; value: string } | null = null
let cachedLoopTableName: string | null = null
let cachedNewsflowTableName: string | null = null

const PROD_ORIGINS = new Set(['https://aintern.nl', 'https://www.aintern.nl'])

function resolveAlias(context: Context): string {
  return context.invokedFunctionArn.split(':').pop() ?? 'dev'
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
  if (cachedJwtSecret?.alias === alias) return cachedJwtSecret.value
  const path = `${process.env.JWT_SECRET_SSM_PREFIX}/${alias}`
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: true }))
  const secret = result.Parameter?.Value
  if (!secret) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = { alias, value: secret }
  return secret
}

async function getLoopTableName(): Promise<string> {
  if (cachedLoopTableName) return cachedLoopTableName
  const path = process.env.LOOP_TABLE_SSM_PATH ?? '/aintern/loop/table-name'
  console.log('[ainternloop-admin] getLoopTableName | fetching SSM path=%s', path)
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: false }))
  const name = result.Parameter?.Value
  if (!name) throw new Error(`Loop table name not found at ${path}`)
  cachedLoopTableName = name
  return name
}

async function getNewsflowTableName(): Promise<string> {
  if (cachedNewsflowTableName) return cachedNewsflowTableName
  const path = process.env.NEWSFLOW_TABLE_SSM_PATH ?? '/aintern/newsflow/table-name'
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: false }))
  const name = result.Parameter?.Value
  if (!name) throw new Error(`Newsflow table name not found at ${path}`)
  cachedNewsflowTableName = name
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

// ── Issues ───────────────────────────────────────────────────────────────────

type IssueStatus = 'open' | 'escalated' | 'resolving' | 'closed'

interface IssueItem {
  issueId: string
  agentName: string
  description: string
  status: IssueStatus
  resolutionApproach?: string
  instructionToAgent?: string
  actionRef?: string
  type?: string
  createdAt: string
  updatedAt: string
  errorContext?: unknown
}

const VALID_ISSUE_STATUSES = new Set<string>(['open', 'escalated', 'resolving', 'closed'])
const DEFAULT_ISSUE_STATUSES: IssueStatus[] = ['open', 'escalated']

function parseStatusParam(
  raw: string | undefined,
  defaultStatuses: string[],
  validSet: Set<string>,
): string[] {
  if (!raw || raw === 'all') return Array.from(validSet)
  const parts = raw.split(',').map((s) => s.trim())
  const invalid = parts.filter((s) => !validSet.has(s))
  if (invalid.length > 0) {
    throw Object.assign(
      new Error(`Invalid status value(s): ${invalid.join(', ')}`),
      { statusCode: 400 },
    )
  }
  return parts.length > 0 ? parts : defaultStatuses
}

async function handleListIssues(
  event: APIGatewayProxyEvent,
  tableName: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const statusParam = event.queryStringParameters?.['status']
  const statuses = parseStatusParam(statusParam, DEFAULT_ISSUE_STATUSES, VALID_ISSUE_STATUSES)

  const seen = new Set<string>()
  const allItems: IssueItem[] = []

  for (const status of statuses) {
    const result = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1pk = :gsi1pk',
        FilterExpression: 'begins_with(pk, :issuePrefix)',
        ExpressionAttributeValues: {
          ':gsi1pk': `STATUS#${status}`,
          ':issuePrefix': 'ISSUE#',
        },
        Limit: 50,
        ScanIndexForward: false,
      }),
    )

    for (const raw of result.Items ?? []) {
      if (seen.has(raw['pk'] as string)) continue
      seen.add(raw['pk'] as string)

      const { errorContext: _errorContext, pk: _pk, sk: _sk, GSI1pk: _g1pk, GSI1sk: _g1sk, GSI2pk: _g2pk, GSI2sk: _g2sk, ...rest } = raw as Record<string, unknown>
      allItems.push(rest as unknown as IssueItem)

      if (allItems.length >= 100) break
    }

    if (allItems.length >= 100) break
  }

  console.log('[ainternloop-admin] handleListIssues | returning %d items', allItems.length)
  return respond(200, { items: allItems }, alias, requestOrigin)
}

async function handleGetIssue(
  id: string,
  tableName: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: `ISSUE#${id}`, sk: 'META' },
    }),
  )

  if (!result.Item) {
    return respond(404, { error: `Issue ${id} not found` }, alias, requestOrigin)
  }

  const { pk: _pk, sk: _sk, GSI1pk: _g1pk, GSI1sk: _g1sk, GSI2pk: _g2pk, GSI2sk: _g2sk, ...item } = result.Item as Record<string, unknown>
  return respond(200, item, alias, requestOrigin)
}

async function handlePatchIssue(
  id: string,
  event: APIGatewayProxyEvent,
  tableName: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(event.body ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  const body = parsed as Record<string, unknown>
  if (body['status'] !== 'closed') {
    throw Object.assign(
      new Error('Only status "closed" is allowed from this endpoint'),
      { statusCode: 400 },
    )
  }

  const now = new Date().toISOString()

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: `ISSUE#${id}`, sk: 'META' },
        UpdateExpression:
          'SET #status = :status, GSI1pk = :gsi1pk, #updatedAt = :now, closedBy = :by',
        ConditionExpression: 'attribute_exists(pk)',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':status': 'closed',
          ':gsi1pk': 'STATUS#closed',
          ':now': now,
          ':by': 'human',
        },
        ReturnValues: 'NONE',
      }),
    )
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
      return respond(404, { error: `Issue ${id} not found` }, alias, requestOrigin)
    }
    throw err
  }

  console.log('[ainternloop-admin] handlePatchIssue | closed issue=%s', id)
  return respond(200, { issueId: id, status: 'closed', updatedAt: now }, alias, requestOrigin)
}

// ── Agents ───────────────────────────────────────────────────────────────────

interface AgentItem {
  agentName: string
  displayName: string
  system: string
  instruction: string
  instructionVersion: number
  lastModifiedAt: string
  lastModifiedBy: string
  versionHistory?: unknown[]
}

async function handleListAgents(
  tableName: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const systems = ['AInternLoop', 'NewsFlow']
  const allItems: Omit<AgentItem, 'versionHistory'>[] = []

  for (const system of systems) {
    const result = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1pk = :gsi1pk',
        ExpressionAttributeValues: { ':gsi1pk': `SYSTEM#${system}` },
      }),
    )

    for (const raw of result.Items ?? []) {
      const { versionHistory: _vh, pk, sk: _sk, GSI1pk: _g1pk, GSI1sk: _g1sk, GSI2pk: _g2pk, GSI2sk: _g2sk, ...item } = raw as Record<string, unknown>
      const agentName = (pk as string).replace('AGENT#', '')
      allItems.push({ agentName, ...item } as Omit<AgentItem, 'versionHistory'>)
    }
  }

  allItems.sort((a, b) => {
    const sysCmp = (a.system ?? '').localeCompare(b.system ?? '')
    if (sysCmp !== 0) return sysCmp
    return (a.displayName ?? '').localeCompare(b.displayName ?? '')
  })

  console.log('[ainternloop-admin] handleListAgents | returning %d agents', allItems.length)
  return respond(200, { items: allItems }, alias, requestOrigin)
}

async function handleGetAgent(
  name: string,
  tableName: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  if (!KNOWN_AGENTS.includes(name)) {
    return respond(404, { error: `Agent ${name} not found` }, alias, requestOrigin)
  }
  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: `AGENT#${name}`, sk: 'CONFIG' },
    }),
  )

  if (!result.Item) {
    return respond(404, { error: `Agent ${name} not found` }, alias, requestOrigin)
  }

  const { pk, sk: _sk, GSI1pk: _g1pk, GSI1sk: _g1sk, GSI2pk: _g2pk, GSI2sk: _g2sk, ...item } = result.Item as Record<string, unknown>
  const agentName = (pk as string).replace('AGENT#', '')
  return respond(200, { agentName, ...item }, alias, requestOrigin)
}

async function handlePutAgent(
  name: string,
  event: APIGatewayProxyEvent,
  tableName: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  if (!KNOWN_AGENTS.includes(name)) {
    return respond(404, { error: `Agent ${name} not found` }, alias, requestOrigin)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(event.body ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  const body = parsed as Record<string, unknown>
  const instruction = body['instruction']

  if (typeof instruction !== 'string' || instruction.trim().length === 0) {
    throw Object.assign(new Error('instruction must be a non-empty string'), { statusCode: 400 })
  }
  if (instruction.length > 3000) {
    throw Object.assign(new Error('instruction must be 3000 characters or fewer'), { statusCode: 400 })
  }

  // Read current item to get instructionVersion
  const existing = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: `AGENT#${name}`, sk: 'CONFIG' },
    }),
  )

  if (!existing.Item) {
    return respond(404, { error: `Agent ${name} not found` }, alias, requestOrigin)
  }

  const currentVersion = (existing.Item['instructionVersion'] as number | undefined) ?? 0
  const newVersion = currentVersion + 1
  const now = new Date().toISOString()

  const historyEntry = {
    version: newVersion,
    instruction: instruction.trim(),
    modifiedAt: now,
    modifiedBy: 'human',
  }

  try {
    const result = await ddb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: `AGENT#${name}`, sk: 'CONFIG' },
        UpdateExpression:
          'SET instruction = :instr, instructionVersion = :version, lastModifiedAt = :now, lastModifiedBy = :by, versionHistory = list_append(if_not_exists(versionHistory, :emptyList), :entry)',
        ConditionExpression: 'attribute_exists(pk)',
        ExpressionAttributeValues: {
          ':instr': instruction.trim(),
          ':version': newVersion,
          ':now': now,
          ':by': 'human',
          ':entry': [historyEntry],
          ':emptyList': [],
        },
        ReturnValues: 'ALL_NEW',
      }),
    )

    const { versionHistory: _vh, pk: _pk, sk: _sk, GSI1pk: _g1pk, GSI1sk: _g1sk, GSI2pk: _g2pk, GSI2sk: _g2sk, ...updated } = (result.Attributes ?? {}) as Record<string, unknown>
    console.log('[ainternloop-admin] handlePutAgent | updated agent=%s version=%d', name, newVersion)
    return respond(200, updated, alias, requestOrigin)
  } catch (err: unknown) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
      return respond(404, { error: `Agent ${name} not found` }, alias, requestOrigin)
    }
    throw err
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────

type ActionStatus = 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'

const VALID_ACTION_STATUSES = new Set<string>([
  'open', 'in_progress', 'on_hold', 'completed', 'cancelled',
])
const DEFAULT_ACTION_STATUSES: ActionStatus[] = ['open', 'in_progress', 'on_hold']

const KNOWN_AGENTS = [
  'IssueResolver',
  'LearningAgent',
  'NewsAnalyzer',
  'ContentBuilder',
  'SEOOptimizer',
]

async function handleListActions(
  event: APIGatewayProxyEvent,
  tableName: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const statusParam = event.queryStringParameters?.['status']
  const agentParam = event.queryStringParameters?.['agent']

  const statuses = parseStatusParam(statusParam, DEFAULT_ACTION_STATUSES, VALID_ACTION_STATUSES)
  const statusSet = new Set(statuses)

  if (agentParam && !KNOWN_AGENTS.includes(agentParam)) {
    throw Object.assign(new Error(`Unknown agent: ${agentParam}`), { statusCode: 400 })
  }
  const agentsToQuery = agentParam ? [agentParam] : KNOWN_AGENTS

  const seen = new Set<string>()
  const allItems: unknown[] = []

  for (const agent of agentsToQuery) {
    const result = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2pk = :gsi2pk',
        ExpressionAttributeValues: { ':gsi2pk': `AGENT#${agent}` },
        Limit: 20,
      }),
    )

    for (const raw of result.Items ?? []) {
      const pk = raw['pk'] as string
      if (!pk.startsWith('ACTION#')) continue
      if (seen.has(pk)) continue

      const itemStatus = raw['status'] as string | undefined
      if (!itemStatus || !statusSet.has(itemStatus)) continue

      seen.add(pk)

      const { payload: _payload, pk: _pk, sk: _sk, GSI1pk: _g1pk, GSI1sk: _g1sk, GSI2pk: _g2pk, GSI2sk: _g2sk, ...item } = raw as Record<string, unknown>
      allItems.push(item)

      if (allItems.length >= 100) break
    }

    if (allItems.length >= 100) break
  }

  console.log('[ainternloop-admin] handleListActions | returning %d items', allItems.length)
  return respond(200, { items: allItems }, alias, requestOrigin)
}

async function handleGetAction(
  id: string,
  tableName: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: `ACTION#${id}`, sk: 'META' },
    }),
  )

  if (!result.Item) {
    return respond(404, { error: `Action ${id} not found` }, alias, requestOrigin)
  }

  const { pk: _pk, sk: _sk, GSI1pk: _g1pk, GSI1sk: _g1sk, GSI2pk: _g2pk, GSI2sk: _g2sk, ...item } = result.Item as Record<string, unknown>
  return respond(200, item, alias, requestOrigin)
}

// ── NewsFlow Pages ────────────────────────────────────────────────────────────

async function handleListNewsFlowPages(
  tableName: string,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  const results: unknown[] = []
  let lastKey: Record<string, unknown> | undefined

  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1pk = :pk',
        ExpressionAttributeValues: { ':pk': 'STATUS#published' },
        ScanIndexForward: false,
        Limit: 50,
        ExclusiveStartKey: lastKey,
      }),
    )

    for (const raw of res.Items ?? []) {
      const pk = raw['pk'] as string
      const slug = pk.replace('LANDING_PAGE#', '')
      if (!/^[a-z0-9-]{3,80}$/.test(slug)) continue

      const log = raw['optimizationLog'] as Array<{ at: string; agent: string; changes: string[] }> | undefined
      const lastLog = log && log.length > 0 ? log[log.length - 1] : undefined

      const { pk: _pk, sk: _sk, GSI1pk: _g1pk, GSI1sk: _g1sk, GSI2pk: _g2pk, GSI2sk: _g2sk, optimizationLog: _log, contentS3Key: _key, ...rest } = raw as Record<string, unknown>

      results.push({
        slug,
        ...rest,
        recentChanges: lastLog?.changes ?? [],
        recentChangesAt: lastLog?.at,
      })
    }

    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined
  } while (lastKey && results.length < 100)

  console.log('[ainternloop-admin] handleListNewsFlowPages | returning %d items', results.length)
  return respond(200, { items: results }, alias, requestOrigin)
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  console.log(
    '[ainternloop-admin] handler | requestId=%s method=%s path=%s resource=%s',
    context.awsRequestId,
    event.httpMethod,
    event.path,
    event.resource,
  )

  const alias = resolveAlias(context)
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']

  try {
    await requireAuth(event, alias)
  } catch {
    return respond(401, { error: 'Unauthorized' }, alias, requestOrigin)
  }

  try {
    const tableName = await getLoopTableName()
    const { httpMethod, resource, pathParameters } = event

    // Issues
    if (httpMethod === 'GET' && resource === '/admin/ainternloop/issues') {
      return await handleListIssues(event, tableName, alias, requestOrigin)
    }

    if (httpMethod === 'GET' && resource === '/admin/ainternloop/issues/{id}') {
      const id = pathParameters?.['id'] ?? ''
      return await handleGetIssue(id, tableName, alias, requestOrigin)
    }

    if (httpMethod === 'PATCH' && resource === '/admin/ainternloop/issues/{id}') {
      const id = pathParameters?.['id'] ?? ''
      return await handlePatchIssue(id, event, tableName, alias, requestOrigin)
    }

    // Agents
    if (httpMethod === 'GET' && resource === '/admin/ainternloop/agents') {
      return await handleListAgents(tableName, alias, requestOrigin)
    }

    if (httpMethod === 'GET' && resource === '/admin/ainternloop/agents/{name}') {
      const name = pathParameters?.['name'] ?? ''
      return await handleGetAgent(name, tableName, alias, requestOrigin)
    }

    if (httpMethod === 'PUT' && resource === '/admin/ainternloop/agents/{name}') {
      const name = pathParameters?.['name'] ?? ''
      return await handlePutAgent(name, event, tableName, alias, requestOrigin)
    }

    // Actions
    if (httpMethod === 'GET' && resource === '/admin/ainternloop/actions') {
      return await handleListActions(event, tableName, alias, requestOrigin)
    }

    if (httpMethod === 'GET' && resource === '/admin/ainternloop/actions/{id}') {
      const id = pathParameters?.['id'] ?? ''
      return await handleGetAction(id, tableName, alias, requestOrigin)
    }

    // NewsFlow Pages
    if (httpMethod === 'GET' && resource === '/admin/ainternloop/newsflow-pages') {
      const newsflowTableName = await getNewsflowTableName()
      return await handleListNewsFlowPages(newsflowTableName, alias, requestOrigin)
    }

    return respond(405, { error: 'Method not allowed' }, alias, requestOrigin)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode
    if (code === 400) {
      return respond(400, { error: (err as Error).message }, alias, requestOrigin)
    }
    console.error(
      JSON.stringify({
        level: 'ERROR',
        fn: 'handler',
        error: err instanceof Error ? err.message : String(err),
      }),
    )
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
