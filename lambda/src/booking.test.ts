import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

const { ddbSend, sesSend, ssmSend, state } = vi.hoisted(() => ({
  ddbSend: vi.fn(),
  sesSend: vi.fn(),
  ssmSend: vi.fn(),
  /** Whether the requested block is opened by Bill (BOOKING_OPEN item exists). */
  state: { blockOpen: true },
}))

// Vitest 4: constructors must be `function`, not arrow functions
vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: vi.fn(function () {
    return { send: ssmSend }
  }),
  GetParameterCommand: vi.fn(function (input) {
    return { __type: 'GetParameter', input }
  }),
}))
vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn(function () {
    return { send: sesSend }
  }),
  SendRawEmailCommand: vi.fn(function (input) {
    return { __type: 'SendRawEmail', input }
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
    DynamoDBDocumentClient: {
      from: () => ({
        // Every call is recorded in ddbSend; the open-block lookup is answered from state
        send: async (cmd: { __type: string; input: { Key?: { pk: string; sk: string } } }) => {
          const res = await ddbSend(cmd)
          if (cmd.__type === 'Get' && cmd.input.Key?.pk === 'BOOKING_OPEN') {
            return { Item: state.blockOpen ? { ...cmd.input.Key } : undefined }
          }
          return res
        },
      }),
    },
    GetCommand: cmd('Get'),
    PutCommand: cmd('Put'),
    QueryCommand: cmd('Query'),
    UpdateCommand: cmd('Update'),
    DeleteCommand: cmd('Delete'),
  }
})

import { handler, normaliseWebsite, parseBookingInput, rateEmail, rateIp } from './booking'

type Cmd = { __type: string; input: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any

const ctx = (alias: string) =>
  ({ invokedFunctionArn: `arn:aws:lambda:eu-west-2:1:function:aintern-booking:${alias}` }) as Context
const ev = (method: string, resource: string, body?: unknown, origin = 'https://aintern.nl') =>
  ({
    httpMethod: method,
    resource,
    headers: { origin, 'content-type': 'application/json' },
    requestContext: { identity: { sourceIp: '203.0.113.7' } },
    body: body === undefined ? null : JSON.stringify(body),
  }) as unknown as APIGatewayProxyEvent
const findCall = (type: string): Cmd | undefined =>
  ddbSend.mock.calls.map(([c]) => c as Cmd).find((c) => c.__type === type)
const isLeadUpdate = (c: Cmd) => c.__type === 'Update' && String(c.input.Key.pk).startsWith('LEAD#')
const leadUpdate = (): Cmd | undefined =>
  ddbSend.mock.calls.map(([c]) => c as Cmd).find(isLeadUpdate)

const validBody = {
  start: '2026-10-21T07:00:00.000Z',
  companyName: 'Bakkerij De Vries',
  contactName: 'Jan',
  email: 'Jan@Bakkerij.nl',
  phone: '+31 6 12345678',
  website: '',
  note: 'Hallo',
  locale: 'nl',
  fax: '',
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-20T08:00:00Z'))
  state.blockOpen = true
  ddbSend.mockReset()
  sesSend.mockReset().mockResolvedValue({})
  ssmSend.mockReset().mockImplementation(async (cmd: Cmd) => {
    if (cmd.input.Name.endsWith('/dynamodb/table-name')) return { Parameter: { Value: 'aintern-admin' } }
    if (cmd.input.Name.endsWith('/booking/meeting-url'))
      return { Parameter: { Value: 'https://meet.google.com/x' } }
    throw Object.assign(new Error('nf'), { name: 'ParameterNotFound' })
  })
})
afterEach(() => vi.useRealTimers())

describe('helpers', () => {
  it('normaliseWebsite', () => {
    expect(normaliseWebsite('www.Bakkerij.NL/contact')).toBe('https://bakkerij.nl')
    expect(normaliseWebsite('http://shop.bakkerij.nl')).toBe('https://shop.bakkerij.nl')
    expect(normaliseWebsite('javascript:alert(1)')).toBeUndefined()
  })

  it('parseBookingInput validates', () => {
    expect(() => parseBookingInput(JSON.stringify({ ...validBody, email: 'nope' }))).toThrow('email')
    expect(() => parseBookingInput(JSON.stringify({ ...validBody, companyName: '' }))).toThrow('companyName')
    expect(() => parseBookingInput(JSON.stringify({ ...validBody, start: 'tomorrow' }))).toThrow('start')
    expect(() => parseBookingInput(JSON.stringify({ ...validBody, note: 'x'.repeat(2001) }))).toThrow('note')
    expect(() => parseBookingInput(JSON.stringify({ ...validBody, phone: 'call me' }))).toThrow('phone')
    expect(parseBookingInput(JSON.stringify({ ...validBody, fax: 'bot' }))).toBe('honeypot')
  })
})

describe('rate-limit keys', () => {
  it('folds e-mail aliases and IPv6 /64 prefixes', () => {
    expect(rateEmail('J.an+test@GMail.com')).toBe('jan@gmail.com')
    expect(rateEmail('jan+x@bakkerij.nl')).toBe('jan@bakkerij.nl')
    expect(rateIp('2001:db8:1:2:aaaa:bbbb:cccc:dddd')).toBe('2001:db8:1:2')
    expect(rateIp('2001:db8::1')).toBe('2001:db8')
    expect(rateIp('203.0.113.7')).toBe('203.0.113.7')
  })
})

describe('GET /booking/slots', () => {
  it('returns only opened blocks that are not booked, with CORS echo', async () => {
    ddbSend.mockImplementation(async (cmd: Cmd) => {
      if (cmd.input.ExpressionAttributeValues?.[':pk'] === 'BOOKING_OPEN')
        return {
          Items: [
            { sk: 'OPEN#2026-10-21T07:00:00.000Z' }, // booked below
            { sk: 'OPEN#2026-10-21T07:30:00.000Z' },
            { sk: 'OPEN#2026-10-22T08:00:00.000Z' },
            { sk: 'OPEN#2026-10-20T20:00:00.000Z' }, // outside working hours: never offered
          ],
        }
      if (cmd.input.ExpressionAttributeValues?.[':pk'] === 'BOOKING_SLOTS')
        return { Items: [{ sk: 'SLOT#2026-10-21T07:00:00.000Z' }] }
      return {}
    })
    const res = await handler(ev('GET', '/booking/slots', undefined, 'https://www.aintern.nl'), ctx('prod'))
    expect(res.statusCode).toBe(200)
    expect(res.headers?.['Access-Control-Allow-Origin']).toBe('https://www.aintern.nl')
    const body = JSON.parse(res.body)
    expect(body.slots).toEqual(['2026-10-21T07:30:00.000Z', '2026-10-22T08:00:00.000Z'])
    expect(body.durationMinutes).toBe(30)
  })

  it('offers nothing when no block is opened', async () => {
    ddbSend.mockResolvedValue({ Items: [] })
    const body = JSON.parse((await handler(ev('GET', '/booking/slots'), ctx('prod'))).body)
    expect(body.slots).toEqual([])
  })
})

describe('POST /booking', () => {
  it('locks the slot, upserts the lead and sends two mails', async () => {
    ddbSend.mockImplementation(async (cmd: Cmd) => (cmd.__type === 'Get' ? { Item: undefined } : {}))
    const res = await handler(ev('POST', '/booking', validBody), ctx('prod'))
    expect(res.statusCode).toBe(201)

    const put = findCall('Put')!
    expect(put.input.Item).toMatchObject({
      pk: 'BOOKING_SLOTS',
      sk: 'SLOT#2026-10-21T07:00:00.000Z',
      leadWebsite: 'https://bakkerij.nl',
      phone: '+31 6 12345678',
      note: 'Hallo',
    })
    expect(put.input.ConditionExpression).toBe('attribute_not_exists(pk)')

    const update = leadUpdate()!
    expect(update.input.Key).toEqual({
      pk: `LEAD#${encodeURIComponent('https://bakkerij.nl')}`,
      sk: 'METADATA',
    })
    expect(update.input.ExpressionAttributeValues[':status']).toBe('discovery_booked')
    expect(update.input.ExpressionAttributeValues[':email']).toBe('jan@bakkerij.nl')
    expect(update.input.ExpressionAttributeValues[':meetingUrl']).toBe('https://meet.google.com/x')

    expect(sesSend).toHaveBeenCalledTimes(2)
    const owner = Buffer.from(sesSend.mock.calls[1][0].input.RawMessage.Data).toString()
    expect(owner).toContain('To: =?UTF-8?B?QmlsbCBNaWRkZWxib3NjaA==?= <b.middelbosch@bm-c.nl>')
    // Recipients are always explicit, never derived from headers
    expect(sesSend.mock.calls[0][0].input.Destinations).toEqual(['jan@bakkerij.nl'])
    expect(sesSend.mock.calls[1][0].input.Destinations).toEqual(['b.middelbosch@bm-c.nl'])
    // Identity fields of existing leads are not overwritten
    expect(update.input.UpdateExpression).toContain('companyName = if_not_exists(companyName, :companyName)')
  })

  it('counts bookings per hashed IP and e-mail and returns 429 at the limit', async () => {
    ddbSend.mockImplementation(async (cmd: Cmd) => {
      if (cmd.__type === 'Update' && cmd.input.Key.pk === 'BOOKING_RATE' && cmd.input.Key.sk.startsWith('IP#'))
        throw Object.assign(new Error('x'), { name: 'ConditionalCheckFailedException' })
      return {}
    })
    const res = await handler(ev('POST', '/booking', validBody), ctx('prod'))
    expect(res.statusCode).toBe(429)
    expect(JSON.parse(res.body).error).toBe('too_many_bookings')
    const rate = findCall('Update')!
    expect(rate.input.Key.sk).not.toContain('203.0.113.7')
    expect(rate.input.ExpressionAttributeValues[':max']).toBe(3)
    expect(findCall('Put')).toBeUndefined()
    expect(sesSend).not.toHaveBeenCalled()
  })

  it('rejects a POST without JSON content type', async () => {
    const e = ev('POST', '/booking', validBody)
    e.headers = { origin: 'https://aintern.nl', 'content-type': 'text/plain' }
    expect((await handler(e, ctx('prod'))).statusCode).toBe(415)
    expect(ddbSend).not.toHaveBeenCalled()
  })

  it('never cuts existing notes: a full notes field is left as it is', async () => {
    const old = 'x'.repeat(7990)
    ddbSend.mockImplementation(async (cmd: Cmd) =>
      cmd.__type === 'Get' ? { Item: { status: 'new', notes: old } } : {},
    )
    await handler(ev('POST', '/booking', validBody), ctx('prod'))
    const update = leadUpdate()!
    expect(update.input.ExpressionAttributeValues[':notes']).toBe(old)
    expect(update.input.ConditionExpression).toBe('notes = :oldNotes')
  })

  it('keeps lost leads lost and moves outreach leads to discovery_booked', async () => {
    ddbSend.mockImplementation(async (cmd: Cmd) => (cmd.__type === 'Get' ? { Item: { status: 'lost' } } : {}))
    await handler(ev('POST', '/booking', validBody), ctx('prod'))
    expect(leadUpdate()!.input.ExpressionAttributeValues[':status']).toBe('lost')

    ddbSend.mockReset().mockImplementation(async (cmd: Cmd) =>
      cmd.__type === 'Get' ? { Item: { status: 'dm_sent' } } : {},
    )
    await handler(ev('POST', '/booking', { ...validBody, start: '2026-10-21T08:00:00.000Z' }), ctx('prod'))
    expect(leadUpdate()!.input.ExpressionAttributeValues[':status']).toBe('discovery_booked')
  })

  it('retries the lead update when notes changed concurrently', async () => {
    let leadWrites = 0
    ddbSend.mockImplementation(async (cmd: Cmd) => {
      if (isLeadUpdate(cmd) && leadWrites++ === 0)
        throw Object.assign(new Error('x'), { name: 'ConditionalCheckFailedException' })
      return {}
    })
    const res = await handler(ev('POST', '/booking', validBody), ctx('prod'))
    expect(res.statusCode).toBe(201)
    expect(leadWrites).toBe(2)
  })

  it('gives the rate-limit counts back when the slot is taken', async () => {
    ddbSend.mockImplementation(async (cmd: Cmd) => {
      if (cmd.__type === 'Put') throw Object.assign(new Error('x'), { name: 'ConditionalCheckFailedException' })
      return {}
    })
    await handler(ev('POST', '/booking', validBody), ctx('prod'))
    const releases = ddbSend.mock.calls
      .map(([c]) => c as Cmd)
      .filter((c) => c.__type === 'Update' && c.input.ExpressionAttributeValues?.[':minusOne'] === -1)
    expect(releases).toHaveLength(2)
  })

  it('uses the e-mail address as lead key for freemail without website', async () => {
    ddbSend.mockResolvedValue({})
    await handler(ev('POST', '/booking', { ...validBody, email: 'jan@gmail.com' }), ctx('dev'))
    expect(leadUpdate()!.input.Key.pk).toBe(`LEAD#${encodeURIComponent('jan@gmail.com')}`)
  })

  it('keeps status "won" and existing notes for customers', async () => {
    ddbSend.mockImplementation(async (cmd: Cmd) =>
      cmd.__type === 'Get' ? { Item: { status: 'won', notes: 'oud' } } : {},
    )
    await handler(ev('POST', '/booking', validBody), ctx('prod'))
    const values = leadUpdate()!.input.ExpressionAttributeValues
    expect(values[':status']).toBe('won')
    expect(values[':notes']).toMatch(/oud$/)
  })

  it('returns 409 when the slot is already taken', async () => {
    ddbSend.mockImplementation(async (cmd: Cmd) => {
      if (cmd.__type === 'Put') throw Object.assign(new Error('x'), { name: 'ConditionalCheckFailedException' })
      return {}
    })
    const res = await handler(ev('POST', '/booking', validBody), ctx('prod'))
    expect(res.statusCode).toBe(409)
    expect(sesSend).not.toHaveBeenCalled()
  })

  it('returns 409 for a block that is not opened in the admin', async () => {
    state.blockOpen = false
    ddbSend.mockResolvedValue({})
    const res = await handler(ev('POST', '/booking', validBody), ctx('prod'))
    expect(res.statusCode).toBe(409)
    expect(JSON.parse(res.body).error).toBe('slot_unavailable')
    expect(findCall('Put')).toBeUndefined()
    expect(findCall('Update')).toBeUndefined()
    expect(sesSend).not.toHaveBeenCalled()
  })

  it('returns 409 for a slot outside working hours', async () => {
    const res = await handler(
      ev('POST', '/booking', { ...validBody, start: '2026-10-21T20:00:00.000Z' }),
      ctx('prod'),
    )
    expect(res.statusCode).toBe(409)
    expect(ddbSend).not.toHaveBeenCalled()
  })

  it('returns 400 on invalid input and a silent 200 for the honeypot', async () => {
    const bad = await handler(ev('POST', '/booking', { ...validBody, email: 'x' }), ctx('prod'))
    expect(bad.statusCode).toBe(400)
    const bot = await handler(ev('POST', '/booking', { ...validBody, fax: 'spam' }), ctx('prod'))
    expect(bot.statusCode).toBe(200)
    expect(ddbSend).not.toHaveBeenCalled()
  })

  it('releases the slot when the lead upsert fails', async () => {
    ddbSend.mockImplementation(async (cmd: Cmd) => {
      if (isLeadUpdate(cmd)) throw new Error('boom')
      return {}
    })
    const res = await handler(ev('POST', '/booking', validBody), ctx('dev'))
    expect(res.statusCode).toBe(500)
    expect(findCall('Delete')).toBeDefined()
  })

  it('still succeeds when SES fails', async () => {
    ddbSend.mockResolvedValue({})
    sesSend.mockRejectedValue(new Error('ses down'))
    const res = await handler(ev('POST', '/booking', validBody), ctx('dev'))
    expect(res.statusCode).toBe(201)
    expect(JSON.parse(res.body).emailSent).toBe(false)
  })

  it('returns 404 for unknown routes', async () => {
    expect((await handler(ev('DELETE', '/booking'), ctx('dev'))).statusCode).toBe(404)
  })
})
