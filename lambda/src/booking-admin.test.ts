import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { APIGatewayProxyEvent, Context } from 'aws-lambda'
import jwt from 'jsonwebtoken'

const { ddbSend, ssmSend } = vi.hoisted(() => ({ ddbSend: vi.fn(), ssmSend: vi.fn() }))

vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: vi.fn(function () {
    return { send: ssmSend }
  }),
  GetParameterCommand: vi.fn(function (input) {
    return { __type: 'GetParameter', input }
  }),
}))
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(function () {
    return {}
  }),
}))
vi.mock('@aws-sdk/lib-dynamodb', () => {
  const cmd = (type: string) =>
    vi.fn(function (input) {
      return { __type: type, input }
    })
  return {
    DynamoDBDocumentClient: { from: () => ({ send: ddbSend }) },
    QueryCommand: cmd('Query'),
    BatchWriteCommand: cmd('BatchWrite'),
  }
})

import { handler, parseAvailabilityInput, toAdminBooking, MAX_CHANGES } from './booking-admin'

type Cmd = { __type: string; input: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any

const SECRET = 'test-secret'
const token = jwt.sign({ sub: 'bill' }, SECRET, { algorithm: 'HS256' })
const ctx = (alias: string) =>
  ({ invokedFunctionArn: `arn:aws:lambda:eu-west-2:1:function:aintern-booking-admin:${alias}` }) as Context
const ev = (method: string, resource: string, body?: unknown, auth = `Bearer ${token}`) =>
  ({
    httpMethod: method,
    resource,
    headers: { origin: 'https://www.aintern.nl', Authorization: auth },
    body: body === undefined ? null : JSON.stringify(body),
  }) as unknown as APIGatewayProxyEvent
const calls = (type: string): Cmd[] => ddbSend.mock.calls.map(([c]) => c as Cmd).filter((c) => c.__type === type)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-20T08:00:00Z')) // Tuesday 10:00 Amsterdam
  ddbSend.mockReset().mockImplementation(async (cmd: Cmd) => {
    if (cmd.__type === 'Query' && cmd.input.ExpressionAttributeValues[':pk'] === 'BOOKING_SLOTS')
      return {
        Items: [
          {
            sk: 'SLOT#2026-10-22T08:00:00.000Z',
            bookingId: 'b2',
            start: '2026-10-22T08:00:00.000Z',
            end: '2026-10-22T08:30:00.000Z',
            companyName: 'Bakkerij',
            contactName: 'Jan',
            email: 'jan@bakkerij.nl',
            leadWebsite: 'https://bakkerij.nl',
          },
          { sk: 'SLOT#2026-10-21T07:00:00.000Z', bookingId: 'b1', companyName: 'Oud', email: 'a@b.nl' },
        ],
      }
    if (cmd.__type === 'Query')
      return { Items: [{ sk: 'OPEN#2026-10-21T07:30:00.000Z' }, { sk: 'OPEN#2026-10-20T07:00:00.000Z' }] }
    return {}
  })
  ssmSend.mockReset().mockImplementation(async (cmd: Cmd) => {
    if (cmd.input.Name.includes('jwt-secret')) return { Parameter: { Value: SECRET } }
    if (cmd.input.Name.endsWith('/dynamodb/table-name')) return { Parameter: { Value: 'aintern-admin' } }
    throw new Error('unexpected ' + cmd.input.Name)
  })
})
afterEach(() => vi.useRealTimers())

describe('auth', () => {
  it('rejects requests without a valid token', async () => {
    const none = await handler(ev('GET', '/admin/bookings', undefined, ''), ctx('prod'))
    expect(none.statusCode).toBe(401)
    const bad = await handler(ev('GET', '/admin/bookings', undefined, `Bearer ${jwt.sign({}, 'other')}`), ctx('prod'))
    expect(bad.statusCode).toBe(401)
    expect(bad.headers?.['Access-Control-Allow-Origin']).toBe('https://www.aintern.nl')
    expect(ddbSend).not.toHaveBeenCalled()
  })
})

describe('GET /admin/bookings', () => {
  it('returns bookings sorted by start, the grid and only future open blocks', async () => {
    const res = await handler(ev('GET', '/admin/bookings'), ctx('prod'))
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.bookings.map((b: { bookingId: string }) => b.bookingId)).toEqual(['b1', 'b2'])
    expect(body.bookings[0].start).toBe('2026-10-21T07:00:00.000Z')
    expect(body.bookings[0].end).toBe('2026-10-21T07:30:00.000Z')
    expect(body.bookings[1].leadWebsite).toBe('https://bakkerij.nl')
    expect(body.grid[0]).toBe('2026-10-21T07:00:00.000Z')
    expect(body.open).toEqual(['2026-10-21T07:30:00.000Z'])
    expect(body.durationMinutes).toBe(30)
  })
})

describe('PUT /admin/bookings/availability', () => {
  it('opens and closes blocks in one batch', async () => {
    const res = await handler(
      ev('PUT', '/admin/bookings/availability', {
        open: ['2026-10-21T08:00:00.000Z', '2026-10-21T08:30:00.000Z'],
        close: ['2026-10-21T07:30:00.000Z'],
      }),
      ctx('dev'),
    )
    expect(res.statusCode).toBe(200)
    const [batch] = calls('BatchWrite')
    const requests = batch.input.RequestItems['aintern-admin']
    expect(requests).toHaveLength(3)
    expect(requests[0].PutRequest.Item).toMatchObject({
      pk: 'BOOKING_OPEN',
      sk: 'OPEN#2026-10-21T08:00:00.000Z',
      start: '2026-10-21T08:00:00.000Z',
    })
    expect(requests[0].PutRequest.Item.ttl).toBeGreaterThan(Date.parse('2026-10-21T08:00:00Z') / 1000)
    expect(requests[2].DeleteRequest.Key).toEqual({ pk: 'BOOKING_OPEN', sk: 'OPEN#2026-10-21T07:30:00.000Z' })
  })

  it('splits large changes into batches of 25 and retries unprocessed items', async () => {
    const grid: string[] = []
    for (let h = 7; h < 15; h++) for (const m of ['00', '30']) grid.push(`2026-10-21T${String(h).padStart(2, '0')}:${m}:00.000Z`)
    for (let h = 7; h < 15; h++) for (const m of ['00', '30']) grid.push(`2026-10-22T${String(h).padStart(2, '0')}:${m}:00.000Z`)
    let first = true
    ddbSend.mockImplementation(async (cmd: Cmd) => {
      if (cmd.__type === 'BatchWrite' && first) {
        first = false
        return { UnprocessedItems: { 'aintern-admin': cmd.input.RequestItems['aintern-admin'].slice(0, 2) } }
      }
      return { Items: [] }
    })
    const promise = handler(ev('PUT', '/admin/bookings/availability', { open: grid }), ctx('dev'))
    await vi.runAllTimersAsync()
    expect((await promise).statusCode).toBe(200)
    const sizes = calls('BatchWrite').map((c) => c.input.RequestItems['aintern-admin'].length)
    expect(sizes).toEqual([25, 2, 7])
  })

  it('rejects blocks outside the bookable grid', async () => {
    const tonight = await handler(
      ev('PUT', '/admin/bookings/availability', { open: ['2026-10-21T20:00:00.000Z'] }),
      ctx('dev'),
    )
    expect(tonight.statusCode).toBe(400)
    const today = await handler(
      ev('PUT', '/admin/bookings/availability', { open: ['2026-10-20T14:00:00.000Z'] }),
      ctx('dev'),
    )
    expect(today.statusCode).toBe(400)
    expect(calls('BatchWrite')).toHaveLength(0)
  })
})

describe('parseAvailabilityInput', () => {
  const grid = new Set(['2026-10-21T07:00:00.000Z'])
  it('validates shape and values', () => {
    expect(() => parseAvailabilityInput('nope', grid)).toThrow('Invalid JSON')
    expect(() => parseAvailabilityInput('[]', grid)).toThrow('Invalid body')
    expect(() => parseAvailabilityInput('{"open":"x"}', grid)).toThrow('arrays')
    expect(() => parseAvailabilityInput('{"close":["2026-10-21"]}', grid)).toThrow('Invalid block start')
    expect(() => parseAvailabilityInput('{"close":[{"S":"x"}]}', grid)).toThrow('Invalid block start')
    expect(() =>
      parseAvailabilityInput(JSON.stringify({ open: ['2026-10-21T07:00:00.000Z'], close: ['2026-10-21T07:00:00.000Z'] }), grid),
    ).toThrow('both')
    const many = Array.from({ length: MAX_CHANGES + 1 }, () => '2026-10-21T07:00:00.000Z')
    expect(() => parseAvailabilityInput(JSON.stringify({ close: many }), grid)).toThrow('Too many')
  })
  it('deduplicates and allows closing any well-formed block', () => {
    const change = parseAvailabilityInput(
      JSON.stringify({
        open: ['2026-10-21T07:00:00.000Z', '2026-10-21T07:00:00.000Z'],
        close: ['2026-12-31T23:30:00.000Z'],
      }),
      grid,
    )
    expect(change).toEqual({ open: ['2026-10-21T07:00:00.000Z'], close: ['2026-12-31T23:30:00.000Z'] })
  })
})

describe('toAdminBooking', () => {
  it('drops non-string fields', () => {
    const b = toAdminBooking({ sk: 'SLOT#2026-10-21T07:00:00.000Z', email: 5, phone: '' })
    expect(b.email).toBe('')
    expect(b.phone).toBeUndefined()
    expect(b.start).toBe('2026-10-21T07:00:00.000Z')
  })
})

it('returns 404 for unknown routes', async () => {
  expect((await handler(ev('DELETE', '/admin/bookings'), ctx('dev'))).statusCode).toBe(404)
})
