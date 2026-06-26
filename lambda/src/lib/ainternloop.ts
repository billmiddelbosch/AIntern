/**
 * ainternloop.ts
 *
 * AInternLoop SDK — shared library for all AInternLoop agent Lambda handlers.
 *
 * This is NOT a Lambda handler — it has no `handler` export and no bundle script.
 * Import it from agent handlers that interact with the `aintern-loop` DynamoDB table.
 *
 * Usage:
 *   import { createAInternLoopSDK } from './lib/ainternloop'
 *   const sdk = createAInternLoopSDK()
 *
 * Environment variables:
 *   LOOP_TABLE_NAME — DynamoDB table name (injected by CDK via SSM at deploy time)
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb'

// ── Public types ──────────────────────────────────────────────────────────────

export interface RegisterActionInput {
  type: string
  sourceAgent: string // e.g. 'NewsAnalyzer' or 'human:<userId>'
  targetAgent: string
  urgency: number // 1–100
  payload: Record<string, unknown>
  supplementaryInstruction?: string
}

export interface ActionItem {
  actionId: string
  type: string
  status: string
  sourceAgent: string
  targetAgent: string
  urgency: number
  payload: Record<string, unknown>
  supplementaryInstruction?: string
  issueRef?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface AInternLoopSDK {
  registerAction(input: RegisterActionInput): Promise<string>
  updateActionStatus(actionId: string, status: string): Promise<void>
  completeAction(actionId: string, terminalStatus?: string): Promise<void>
  logIssue(
    actionId: string,
    agentName: string,
    description: string,
    errorContext?: Record<string, unknown>,
  ): Promise<string>
  claimNextAction(targetAgent: string, type: string): Promise<ActionItem | null>
  getAgentInstruction(agentName: string): Promise<string | null>
}

// ── Validation helpers (H-1, H-2, H-3) ───────────────────────────────────────

/**
 * Allowed characters for agent names and action types.
 * Colon (:) permitted for 'human:<userId>' source agents.
 * Forward slash (/) permitted for hierarchical types like 'newsflow/content'.
 */
const AGENT_NAME_RE = /^[a-zA-Z0-9_:/-]{1,64}$/
const ACTION_TYPE_RE = /^[a-zA-Z0-9_/-]{1,64}$/

/** Allow-list of valid status values. Prevents arbitrary strings poisoning GSI sort keys. */
const VALID_STATUSES = new Set([
  'open',
  'in_progress',
  'on_hold',
  'done',
  'cancelled',
  'failed',
])

function assertValidAgentName(name: string, field: string): void {
  if (!AGENT_NAME_RE.test(name)) {
    throw new Error(`Invalid ${field}: must match pattern [a-zA-Z0-9_:/-]{1,64}`)
  }
}

function assertValidActionType(type: string): void {
  if (!ACTION_TYPE_RE.test(type)) {
    throw new Error(`Invalid type: must match pattern [a-zA-Z0-9_/-]{1,64}`)
  }
}

function assertValidUrgency(urgency: number): void {
  if (!Number.isInteger(urgency) || urgency < 1 || urgency > 100) {
    throw new Error('urgency must be an integer between 1 and 100')
  }
}

function assertValidStatus(status: string): void {
  if (!VALID_STATUSES.has(status)) {
    throw new Error(
      `Invalid status '${status}'. Allowed: ${[...VALID_STATUSES].join(', ')}`,
    )
  }
}

/**
 * Shallow-sanitise a record to strip prototype-polluting keys.
 * The `payload` and `errorContext` fields are intentionally NOT logged
 * (they may contain PII or sensitive business data) — this is deliberate.
 */
function sanitiseRecord(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([k]) => k !== '__proto__' && k !== 'constructor' && k !== 'prototype',
    ),
  )
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Convert urgency (1–100) to a zero-padded inverted descriptor so high urgency sorts first lexicographically. */
function urgencyDesc(urgency: number): string {
  return String(100 - urgency).padStart(3, '0')
}

/** Structured log line consistent with the rest of the lambda codebase. */
function log(fn: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ level: 'INFO', fn, ...fields }))
}

// ── Raw DynamoDB item shape (internal) ───────────────────────────────────────

interface RawActionItem {
  pk: string
  sk: string
  type: string
  status: string
  sourceAgent: string
  targetAgent: string
  urgency: number
  payload: Record<string, unknown>
  supplementaryInstruction?: string
  issueRef?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  GSI1pk: string
  GSI1sk: string
  GSI2pk: string
  GSI2sk: string
  ttl?: number
}

function mapRawToActionItem(raw: RawActionItem): ActionItem {
  return {
    actionId: raw.pk.replace('ACTION#', ''),
    type: raw.type,
    status: raw.status,
    sourceAgent: raw.sourceAgent,
    targetAgent: raw.targetAgent,
    urgency: raw.urgency,
    payload: raw.payload,
    supplementaryInstruction: raw.supplementaryInstruction,
    issueRef: raw.issueRef,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    completedAt: raw.completedAt,
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create an AInternLoopSDK instance.
 *
 * @param tableName  Override the table name (useful in tests). Falls back to LOOP_TABLE_NAME env var.
 * @param ddbClient  Override the DynamoDB client (useful in tests).
 */
export function createAInternLoopSDK(
  tableName?: string,
  ddbClient?: DynamoDBDocumentClient,
): AInternLoopSDK {
  const table = tableName ?? process.env.LOOP_TABLE_NAME
  if (!table) throw new Error('LOOP_TABLE_NAME env var required')

  const ddb =
    ddbClient ??
    DynamoDBDocumentClient.from(new DynamoDBClient({}), {
      marshallOptions: { removeUndefinedValues: true },
    })

  // ── registerAction ──────────────────────────────────────────────────────────

  async function registerAction(input: RegisterActionInput): Promise<string> {
    // H-1: validate all values that flow into DynamoDB key expressions
    assertValidActionType(input.type)
    assertValidAgentName(input.sourceAgent, 'sourceAgent')
    assertValidAgentName(input.targetAgent, 'targetAgent')
    assertValidUrgency(input.urgency)
    if (
      input.supplementaryInstruction !== undefined &&
      input.supplementaryInstruction.length > 2000
    ) {
      throw new Error('supplementaryInstruction exceeds maximum length of 2000 characters')
    }

    const actionId = crypto.randomUUID()
    const desc = urgencyDesc(input.urgency)
    const now = new Date().toISOString()

    const item: RawActionItem = {
      pk: `ACTION#${actionId}`,
      sk: 'META',
      type: input.type,
      status: 'open',
      sourceAgent: input.sourceAgent,
      targetAgent: input.targetAgent,
      urgency: input.urgency,
      // M-1: sanitise payload to strip prototype-polluting keys
      payload: sanitiseRecord(input.payload),
      ...(input.supplementaryInstruction !== undefined
        ? { supplementaryInstruction: input.supplementaryInstruction }
        : {}),
      createdAt: now,
      updatedAt: now,
      // GSI1: query by type → sorted by (status, urgency desc, createdAt)
      GSI1pk: `TYPE#${input.type}`,
      GSI1sk: `STATUS#open#${desc}#${now}`,
      // GSI2: query by targetAgent → sorted by (status, createdAt)
      GSI2pk: `AGENT#${input.targetAgent}`,
      GSI2sk: `STATUS#open#${now}`,
    }

    await ddb.send(new PutCommand({ TableName: table, Item: item }))

    // payload and urgency are intentionally omitted from logs — may contain sensitive data
    log('registerAction', { actionId, type: input.type, targetAgent: input.targetAgent, urgency: input.urgency })
    return actionId
  }

  // ── claimNextAction ─────────────────────────────────────────────────────────

  async function claimNextAction(targetAgent: string, type: string): Promise<ActionItem | null> {
    // H-1: validate values interpolated into DynamoDB key expressions
    assertValidAgentName(targetAgent, 'targetAgent')
    assertValidActionType(type)

    // Query GSI1 for the highest-urgency open action of the given type.
    // Sort key structure: STATUS#open#<urgency_desc>#<createdAt>
    // Ascending sort (default) gives lowest urgency_desc first → highest urgency first.
    const queryResult = await ddb.send(
      new QueryCommand({
        TableName: table,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1pk = :gsi1pk AND begins_with(GSI1sk, :prefix)',
        ExpressionAttributeValues: {
          ':gsi1pk': `TYPE#${type}`,
          ':prefix': 'STATUS#open#',
        },
        Limit: 1,
      }),
    )

    const items = queryResult.Items
    if (!items || items.length === 0) {
      return null
    }

    const candidate = items[0] as RawActionItem
    const pk = candidate.pk
    const now = new Date().toISOString()

    // Derive urgency_desc and createdAt from the queried item (do not recalculate).
    const desc = urgencyDesc(candidate.urgency)
    const createdAt = candidate.createdAt

    try {
      await ddb.send(
        new UpdateCommand({
          TableName: table,
          Key: { pk, sk: 'META' },
          UpdateExpression:
            'SET #status = :inProgress, updatedAt = :now, GSI1sk = :gsi1sk, GSI2sk = :gsi2sk',
          ConditionExpression: '#status = :open',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':inProgress': 'in_progress',
            ':open': 'open',
            ':now': now,
            ':gsi1sk': `STATUS#in_progress#${desc}#${createdAt}`,
            ':gsi2sk': `STATUS#in_progress#${createdAt}`,
          },
        }),
      )
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : String(err)
      if (name === 'ConditionalCheckFailedException') {
        // Another Lambda claimed this action concurrently — caller should retry or skip.
        return null
      }
      throw err
    }

    // Fetch the updated item to return consistent state.
    const getResult = await ddb.send(
      new GetCommand({ TableName: table, Key: { pk, sk: 'META' } }),
    )

    if (!getResult.Item) return null

    const updated = getResult.Item as RawActionItem
    log('claimNextAction', { actionId: pk.replace('ACTION#', ''), targetAgent, type })
    return mapRawToActionItem(updated)
  }

  // ── updateActionStatus ──────────────────────────────────────────────────────

  async function updateActionStatus(actionId: string, status: string): Promise<void> {
    // H-2: validate status against allow-list before writing to GSI sort keys
    assertValidStatus(status)

    const pk = `ACTION#${actionId}`

    // Read current item to get urgency_desc, createdAt, and targetAgent for GSI key rebuild.
    const getResult = await ddb.send(
      new GetCommand({ TableName: table, Key: { pk, sk: 'META' } }),
    )
    if (!getResult.Item) {
      // M-2: log detail internally, surface a generic error to caller
      log('updateActionStatus', { actionId, error: 'action_not_found' })
      throw new Error('Action not found')
    }

    const current = getResult.Item as RawActionItem
    const desc = urgencyDesc(current.urgency)
    const now = new Date().toISOString()

    await ddb.send(
      new UpdateCommand({
        TableName: table,
        Key: { pk, sk: 'META' },
        UpdateExpression:
          'SET #status = :status, updatedAt = :now, GSI1sk = :gsi1sk, GSI2sk = :gsi2sk',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': status,
          ':now': now,
          ':gsi1sk': `STATUS#${status}#${desc}#${current.createdAt}`,
          ':gsi2sk': `STATUS#${status}#${current.createdAt}`,
        },
      }),
    )

    log('updateActionStatus', { actionId, status })
  }

  // ── completeAction ──────────────────────────────────────────────────────────

  async function completeAction(actionId: string, terminalStatus = 'done'): Promise<void> {
    // H-2: validate terminal status against allow-list
    assertValidStatus(terminalStatus)

    const pk = `ACTION#${actionId}`

    // Read to get urgency and createdAt for GSI key rebuild.
    const getResult = await ddb.send(
      new GetCommand({ TableName: table, Key: { pk, sk: 'META' } }),
    )
    if (!getResult.Item) {
      // M-2: log detail internally, surface a generic error to caller
      log('completeAction', { actionId, error: 'action_not_found' })
      throw new Error('Action not found')
    }

    const current = getResult.Item as RawActionItem
    const desc = urgencyDesc(current.urgency)
    const now = new Date().toISOString()
    const ttlEpoch = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60

    await ddb.send(
      new UpdateCommand({
        TableName: table,
        Key: { pk, sk: 'META' },
        UpdateExpression:
          'SET #status = :status, completedAt = :now, updatedAt = :now, #ttl = :ttl, GSI1sk = :gsi1sk, GSI2sk = :gsi2sk',
        ExpressionAttributeNames: {
          '#status': 'status',
          '#ttl': 'ttl',
        },
        ExpressionAttributeValues: {
          ':status': terminalStatus,
          ':now': now,
          ':ttl': ttlEpoch,
          ':gsi1sk': `STATUS#${terminalStatus}#${desc}#${current.createdAt}`,
          ':gsi2sk': `STATUS#${terminalStatus}#${current.createdAt}`,
        },
      }),
    )

    log('completeAction', { actionId, terminalStatus })
  }

  // ── logIssue ────────────────────────────────────────────────────────────────

  async function logIssue(
    actionId: string,
    agentName: string,
    description: string,
    errorContext?: Record<string, unknown>,
  ): Promise<string> {
    // H-3: validate agentName before it flows into GSI partition key
    assertValidAgentName(agentName, 'agentName')

    const issueId = crypto.randomUUID()
    const pk = `ACTION#${actionId}`
    const now = new Date().toISOString()

    // Read action to reconstruct GSI sort keys for the on_hold update.
    const getResult = await ddb.send(
      new GetCommand({ TableName: table, Key: { pk, sk: 'META' } }),
    )
    if (!getResult.Item) {
      // M-2: log detail internally, surface a generic error to caller
      log('logIssue', { actionId, error: 'action_not_found' })
      throw new Error('Action not found')
    }

    const current = getResult.Item as RawActionItem
    const desc = urgencyDesc(current.urgency)

    const issueItem: Record<string, unknown> = {
      pk: `ISSUE#${issueId}`,
      sk: 'META',
      actionRef: actionId,
      agentName,
      description,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      // GSI1: IssueResolver queries all open issues
      GSI1pk: 'STATUS#open',
      GSI1sk: now,
      // GSI2: LearningAgent queries issues per agent
      GSI2pk: `AGENT#${agentName}`,
      GSI2sk: now,
    }

    if (errorContext !== undefined) {
      // M-1: sanitise errorContext to strip prototype-polluting keys
      issueItem.errorContext = sanitiseRecord(errorContext)
    }

    await ddb.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: table,
              Item: issueItem,
            },
          },
          {
            Update: {
              TableName: table,
              Key: { pk, sk: 'META' },
              UpdateExpression:
                'SET #status = :onHold, issueRef = :issueRef, updatedAt = :now, GSI1sk = :gsi1sk, GSI2sk = :gsi2sk',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':onHold': 'on_hold',
                ':issueRef': `ISSUE#${issueId}`,
                ':now': now,
                ':gsi1sk': `STATUS#on_hold#${desc}#${current.createdAt}`,
                ':gsi2sk': `STATUS#on_hold#${current.createdAt}`,
              },
            },
          },
        ],
      }),
    )

    log('logIssue', { actionId, issueId, agentName })
    return `ISSUE#${issueId}`
  }

  // ── getAgentInstruction ─────────────────────────────────────────────────────

  async function getAgentInstruction(agentName: string): Promise<string | null> {
    // H-1: validate agentName before it flows into a DynamoDB key expression
    assertValidAgentName(agentName, 'agentName')

    const result = await ddb.send(
      new GetCommand({
        TableName: table,
        Key: { pk: `AGENT#${agentName}`, sk: 'CONFIG' },
      }),
    )

    const found = result.Item !== undefined
    log('getAgentInstruction', { agentName, found })

    if (!found) return null
    return (result.Item as { instruction: string }).instruction
  }

  // ── Return SDK ──────────────────────────────────────────────────────────────

  return {
    registerAction,
    claimNextAction,
    updateActionStatus,
    completeAction,
    logIssue,
    getAgentInstruction,
  }
}
