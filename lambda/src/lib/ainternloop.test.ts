/**
 * ainternloop.test.ts
 *
 * Unit tests for the AInternLoop SDK.
 * DynamoDB commands are mocked with vi.mock so no AWS credentials are needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mockSend so it's available inside vi.mock factories ─────────────────
// vi.mock calls are hoisted to the top of the file by Vitest, which means any
// variable declared in module scope is not yet initialised when the factory runs.
// vi.hoisted() is the idiomatic fix: it creates the mock ref before hoisting.
const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}))

// ── Mock @aws-sdk/client-dynamodb ─────────────────────────────────────────────
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockImplementation(() => ({})),
}))

// ── Mock @aws-sdk/lib-dynamodb ────────────────────────────────────────────────
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn().mockReturnValue({ send: mockSend }),
  },
  PutCommand: vi.fn().mockImplementation((input) => ({ __type: 'PutCommand', input })),
  GetCommand: vi.fn().mockImplementation((input) => ({ __type: 'GetCommand', input })),
  UpdateCommand: vi.fn().mockImplementation((input) => ({ __type: 'UpdateCommand', input })),
  QueryCommand: vi.fn().mockImplementation((input) => ({ __type: 'QueryCommand', input })),
  TransactWriteCommand: vi.fn().mockImplementation((input) => ({
    __type: 'TransactWriteCommand',
    input,
  })),
}))

// Import AFTER mocks are in place
import { createAInternLoopSDK } from './ainternloop'

// ── Shared test data ──────────────────────────────────────────────────────────

const TABLE = 'aintern-loop-test'

const baseAction = {
  pk: 'ACTION#test-uuid-1234',
  sk: 'META',
  type: 'newsflow/content',
  status: 'open',
  sourceAgent: 'NewsAnalyzer',
  targetAgent: 'ContentBuilder',
  urgency: 80,
  payload: { articleId: 'abc' },
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
  GSI1pk: 'TYPE#newsflow/content',
  GSI1sk: 'STATUS#open#020#2024-01-15T10:00:00.000Z',
  GSI2pk: 'AGENT#ContentBuilder',
  GSI2sk: 'STATUS#open#2024-01-15T10:00:00.000Z',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AInternLoop SDK', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. registerAction — correct item shape
  it('registerAction writes correct item shape to DynamoDB', async () => {
    mockSend.mockResolvedValueOnce({}) // PutCommand

    const sdk = createAInternLoopSDK(TABLE)
    const actionId = await sdk.registerAction({
      type: 'newsflow/content',
      sourceAgent: 'NewsAnalyzer',
      targetAgent: 'ContentBuilder',
      urgency: 80,
      payload: { articleId: 'abc' },
    })

    expect(actionId).toBeTruthy()
    expect(mockSend).toHaveBeenCalledOnce()

    const call = mockSend.mock.calls[0][0]
    expect(call.__type).toBe('PutCommand')

    const item = call.input.Item
    expect(item.pk).toBe(`ACTION#${actionId}`)
    expect(item.sk).toBe('META')
    expect(item.status).toBe('open')
    expect(item.type).toBe('newsflow/content')
    expect(item.sourceAgent).toBe('NewsAnalyzer')
    expect(item.targetAgent).toBe('ContentBuilder')
    expect(item.urgency).toBe(80)
    expect(item.GSI1pk).toBe('TYPE#newsflow/content')
    // urgency 80 → urgency_desc = String(100 - 80).padStart(3, '0') = '020'
    expect(item.GSI1sk).toMatch(/^STATUS#open#020#/)
    expect(item.GSI2pk).toBe('AGENT#ContentBuilder')
    expect(item.GSI2sk).toMatch(/^STATUS#open#/)
  })

  // 2. claimNextAction — claim succeeds
  it('claimNextAction returns ActionItem when claim succeeds', async () => {
    const updatedAction = {
      ...baseAction,
      status: 'in_progress',
      updatedAt: '2024-01-15T10:01:00.000Z',
    }

    mockSend
      .mockResolvedValueOnce({ Items: [baseAction] }) // QueryCommand
      .mockResolvedValueOnce({}) // UpdateCommand (claim)
      .mockResolvedValueOnce({ Item: updatedAction }) // GetCommand (fetch updated)

    const sdk = createAInternLoopSDK(TABLE)
    const result = await sdk.claimNextAction('ContentBuilder', 'newsflow/content')

    expect(result).not.toBeNull()
    expect(result!.actionId).toBe('test-uuid-1234')
    expect(result!.status).toBe('in_progress')
    expect(result!.targetAgent).toBe('ContentBuilder')
    expect(result!.urgency).toBe(80)
  })

  // 3. claimNextAction — concurrent claim (ConditionalCheckFailedException)
  it('claimNextAction returns null when ConditionalCheckFailedException is thrown', async () => {
    const error = Object.assign(new Error('ConditionalCheckFailed'), {
      name: 'ConditionalCheckFailedException',
    })

    mockSend
      .mockResolvedValueOnce({ Items: [baseAction] }) // QueryCommand
      .mockRejectedValueOnce(error) // UpdateCommand — race condition

    const sdk = createAInternLoopSDK(TABLE)
    const result = await sdk.claimNextAction('ContentBuilder', 'newsflow/content')

    expect(result).toBeNull()
    // Must not throw
  })

  // 4. claimNextAction — no open actions
  it('claimNextAction returns null when no open actions exist', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] }) // QueryCommand

    const sdk = createAInternLoopSDK(TABLE)
    const result = await sdk.claimNextAction('ContentBuilder', 'newsflow/content')

    expect(result).toBeNull()
    expect(mockSend).toHaveBeenCalledOnce() // Only the query — no update attempted
  })

  // 5. logIssue — TransactWrite with both Put and Update
  it('logIssue calls TransactWriteCommand with Put (ISSUE#) and Update (ACTION#)', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: baseAction }) // GetCommand — read action
      .mockResolvedValueOnce({}) // TransactWriteCommand

    const sdk = createAInternLoopSDK(TABLE)
    const issueRef = await sdk.logIssue(
      'test-uuid-1234',
      'ContentBuilder',
      'Timeout exceeded',
      { timeout: 600 },
    )

    expect(mockSend).toHaveBeenCalledTimes(2)

    const transactCall = mockSend.mock.calls[1][0]
    expect(transactCall.__type).toBe('TransactWriteCommand')

    const items = transactCall.input.TransactItems
    expect(items).toHaveLength(2)

    // First item must be a Put for an ISSUE#
    const putItem = items[0]
    expect(putItem.Put).toBeDefined()
    expect(putItem.Put.Item.pk).toMatch(/^ISSUE#/)
    expect(putItem.Put.Item.status).toBe('open')
    expect(putItem.Put.Item.agentName).toBe('ContentBuilder')
    expect(putItem.Put.Item.description).toBe('Timeout exceeded')
    expect(putItem.Put.Item.errorContext).toEqual({ timeout: 600 })

    // Second item must be an Update for the ACTION# setting status to on_hold
    const updateItem = items[1]
    expect(updateItem.Update).toBeDefined()
    expect(updateItem.Update.Key.pk).toBe('ACTION#test-uuid-1234')
    expect(updateItem.Update.ExpressionAttributeValues[':onHold']).toBe('on_hold')
    expect(updateItem.Update.ExpressionAttributeValues[':issueRef']).toBe(issueRef)
  })

  // 6. logIssue — returns issueId with ISSUE# prefix
  it('logIssue returns a string that starts with ISSUE#', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: baseAction }) // GetCommand
      .mockResolvedValueOnce({}) // TransactWriteCommand

    const sdk = createAInternLoopSDK(TABLE)
    const issueRef = await sdk.logIssue('test-uuid-1234', 'ContentBuilder', 'Some error')

    expect(issueRef).toMatch(/^ISSUE#[0-9a-f-]{36}$/)
  })

  // 7. getAgentInstruction — returns instruction when found
  it('getAgentInstruction returns the instruction string when item exists', async () => {
    mockSend.mockResolvedValueOnce({
      Item: {
        pk: 'AGENT#ContentBuilder',
        sk: 'CONFIG',
        instruction: 'Verwerk newsflow/content acties.',
      },
    })

    const sdk = createAInternLoopSDK(TABLE)
    const instruction = await sdk.getAgentInstruction('ContentBuilder')

    expect(instruction).toBe('Verwerk newsflow/content acties.')
  })

  // 8. getAgentInstruction — returns null when not found
  it('getAgentInstruction returns null when item does not exist', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined })

    const sdk = createAInternLoopSDK(TABLE)
    const instruction = await sdk.getAgentInstruction('UnknownAgent')

    expect(instruction).toBeNull()
    // Must not throw
  })

  // 9. completeAction — sets ttl 90 days in the future
  it('completeAction sets ttl approximately 90 days from now', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: baseAction }) // GetCommand — read action
      .mockResolvedValueOnce({}) // UpdateCommand

    const before = Math.floor(Date.now() / 1000)

    const sdk = createAInternLoopSDK(TABLE)
    await sdk.completeAction('test-uuid-1234')

    const after = Math.floor(Date.now() / 1000)

    expect(mockSend).toHaveBeenCalledTimes(2)

    const updateCall = mockSend.mock.calls[1][0]
    expect(updateCall.__type).toBe('UpdateCommand')

    const ttl = updateCall.input.ExpressionAttributeValues[':ttl'] as number
    const ninetyDays = 90 * 24 * 60 * 60

    // ttl must be within ±5 seconds of now + 90 days
    expect(ttl).toBeGreaterThanOrEqual(before + ninetyDays - 5)
    expect(ttl).toBeLessThanOrEqual(after + ninetyDays + 5)

    // status must be set to 'done' (default terminal status)
    expect(updateCall.input.ExpressionAttributeValues[':status']).toBe('done')
  })

  // 10. getPriorityTopics — returns topics when item exists
  it('getPriorityTopics returns the topics array when item exists', async () => {
    mockSend.mockResolvedValueOnce({
      Item: {
        pk: 'CONFIG#priority-topics',
        sk: 'META',
        topics: ['AI-regulering', 'Lightspeed'],
      },
    })

    const sdk = createAInternLoopSDK(TABLE)
    const topics = await sdk.getPriorityTopics()

    expect(topics).toEqual(['AI-regulering', 'Lightspeed'])

    const call = mockSend.mock.calls[0][0]
    expect(call.__type).toBe('GetCommand')
    expect(call.input.Key).toEqual({ pk: 'CONFIG#priority-topics', sk: 'META' })
  })

  // 11. getPriorityTopics — returns [] when item does not exist
  it('getPriorityTopics returns an empty array when item does not exist', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined })

    const sdk = createAInternLoopSDK(TABLE)
    const topics = await sdk.getPriorityTopics()

    expect(topics).toEqual([])
  })
})
