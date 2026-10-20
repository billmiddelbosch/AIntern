/**
 * Admin API for the own booking page (JWT required).
 *
 *   GET /admin/bookings                → planned appointments + the block grid with open blocks
 *   PUT /admin/bookings/availability   → { open: iso[], close: iso[] } opens/closes blocks
 *
 * Only blocks Bill opened here (pk BOOKING_OPEN / sk OPEN#<iso>) are offered on /afspraak.
 * Closing a block never cancels an appointment that is already booked in it.
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import jwt from 'jsonwebtoken'
import { BOOKING_TIMEZONE, DEFAULT_BOOKING_CONFIG, generateSlots } from './lib/booking-slots'
import { OPEN_PK, OPEN_PREFIX, SLOT_PK, queryRange, queryStarts, startFromSk } from './lib/booking-store'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

/** How far back the admin list shows past appointments. */
const HISTORY_DAYS = 30
/** Max number of block changes in one request. */
export const MAX_CHANGES = 500
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/

let cachedJwtSecret: string | null = null
let cachedTableName: string | null = null

// ── CORS (mandatory pattern — see CLAUDE.md) ─────────────────────────────────

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
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}

// ── Auth + settings ──────────────────────────────────────────────────────────

class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

async function getJwtSecret(alias: string): Promise<string> {
  if (cachedJwtSecret) return cachedJwtSecret
  const path = `${process.env.JWT_SECRET_SSM_PREFIX ?? '/aintern/admin/jwt-secret'}/${alias}`
  const result = await ssm.send(new GetParameterCommand({ Name: path, WithDecryption: true }))
  const secret = result.Parameter?.Value
  if (!secret) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = secret
  return secret
}

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const path = `/aintern/${alias}/dynamodb/table-name`
  const result = await ssm.send(new GetParameterCommand({ Name: path }))
  const name = result.Parameter?.Value
  if (!name) throw new Error(`DynamoDB table name not found at ${path}`)
  cachedTableName = name
  return name
}

async function requireAuth(event: APIGatewayProxyEvent, alias: string): Promise<void> {
  const authHeader = event.headers?.['Authorization'] ?? event.headers?.['authorization'] ?? ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Unauthorized')
  const secret = await getJwtSecret(alias)
  try {
    jwt.verify(token, secret, { algorithms: ['HS256'] })
  } catch {
    throw new HttpError(401, 'Unauthorized')
  }
}

// ── Overview ─────────────────────────────────────────────────────────────────

export interface AdminBooking {
  bookingId: string
  start: string
  end: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  note?: string
  leadWebsite?: string
  createdAt?: string
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined
}

export function toAdminBooking(item: Record<string, unknown>): AdminBooking {
  const start = text(item.start) ?? startFromSk(item.sk)
  return {
    bookingId: text(item.bookingId) ?? '',
    start,
    end: text(item.end) ?? new Date(Date.parse(start) + DEFAULT_BOOKING_CONFIG.slotMinutes * 60_000).toISOString(),
    companyName: text(item.companyName) ?? '',
    contactName: text(item.contactName) ?? '',
    email: text(item.email) ?? '',
    phone: text(item.phone),
    note: text(item.note),
    leadWebsite: text(item.leadWebsite),
    createdAt: text(item.createdAt),
  }
}

async function overview(tableName: string, nowMs: number) {
  const from = new Date(nowMs - HISTORY_DAYS * 86_400_000).toISOString()
  const to = new Date(nowMs + (DEFAULT_BOOKING_CONFIG.maxDaysAhead + 2) * 86_400_000).toISOString()
  const nowIso = new Date(nowMs).toISOString()
  const [bookingItems, open] = await Promise.all([
    queryRange(ddb, tableName, SLOT_PK, from, to),
    queryStarts(ddb, tableName, OPEN_PK, nowIso, to),
  ])
  // The grid: every working-hours block that can still be offered on /afspraak
  const grid = generateSlots(nowMs, DEFAULT_BOOKING_CONFIG)
  return {
    timezone: BOOKING_TIMEZONE,
    durationMinutes: DEFAULT_BOOKING_CONFIG.slotMinutes,
    grid,
    open: grid.filter((s) => open.has(s)),
    bookings: bookingItems.map(toAdminBooking).sort((a, b) => a.start.localeCompare(b.start)),
  }
}

// ── Availability changes ─────────────────────────────────────────────────────

export interface AvailabilityChange {
  open: string[]
  close: string[]
}

/**
 * Validate a PUT body. Blocks can only be opened inside the grid (working hours,
 * from tomorrow, at most 8 weeks ahead). Any well-formed start can be closed.
 */
export function parseAvailabilityInput(rawBody: string | null, grid: ReadonlySet<string>): AvailabilityChange {
  let body: unknown
  try {
    body = JSON.parse(rawBody ?? '')
  } catch {
    throw new HttpError(400, 'Invalid JSON')
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new HttpError(400, 'Invalid body')
  const { open = [], close = [] } = body as Record<string, unknown>
  if (!Array.isArray(open) || !Array.isArray(close)) throw new HttpError(400, 'open and close must be arrays')
  if (open.length + close.length > MAX_CHANGES) throw new HttpError(400, 'Too many changes')
  for (const s of [...open, ...close]) {
    if (typeof s !== 'string' || !ISO_RE.test(s)) throw new HttpError(400, 'Invalid block start')
  }
  const openSet = new Set(open as string[])
  const closeSet = new Set(close as string[])
  for (const s of openSet) {
    if (!grid.has(s)) throw new HttpError(400, 'Block outside the bookable period')
    if (closeSet.has(s)) throw new HttpError(400, 'Block is both opened and closed')
  }
  return { open: [...openSet], close: [...closeSet] }
}

type WriteRequest = { PutRequest: { Item: Record<string, unknown> } } | { DeleteRequest: { Key: Record<string, unknown> } }

async function batchWrite(tableName: string, requests: WriteRequest[]): Promise<void> {
  for (let i = 0; i < requests.length; i += 25) {
    let pending: WriteRequest[] = requests.slice(i, i + 25)
    for (let attempt = 0; pending.length > 0; attempt++) {
      if (attempt === 5) throw new Error('BatchWrite: unprocessed items left after retries')
      if (attempt > 0) await new Promise((r) => setTimeout(r, 100 * 2 ** attempt))
      const res = await ddb.send(new BatchWriteCommand({ RequestItems: { [tableName]: pending } }))
      pending = (res.UnprocessedItems?.[tableName] ?? []) as WriteRequest[]
    }
  }
}

async function changeAvailability(tableName: string, change: AvailabilityChange, nowMs: number): Promise<void> {
  const nowIso = new Date(nowMs).toISOString()
  const requests: WriteRequest[] = [
    ...change.open.map(
      (start): WriteRequest => ({
        PutRequest: {
          Item: {
            pk: OPEN_PK,
            sk: `${OPEN_PREFIX}${start}`,
            start,
            createdAt: nowIso,
            // Cleaned up by DynamoDB TTL (if enabled) a week after the block
            ttl: Math.floor(Date.parse(start) / 1000) + 7 * 86_400,
          },
        },
      }),
    ),
    ...change.close.map(
      (start): WriteRequest => ({ DeleteRequest: { Key: { pk: OPEN_PK, sk: `${OPEN_PREFIX}${start}` } } }),
    ),
  ]
  await batchWrite(tableName, requests)
}

// ── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const requestOrigin = event.headers?.['origin'] ?? event.headers?.['Origin']

  try {
    await requireAuth(event, alias)
    const tableName = await getTableName(alias)
    const nowMs = Date.now()

    if (event.httpMethod === 'GET' && event.resource === '/admin/bookings') {
      return respond(200, await overview(tableName, nowMs), alias, requestOrigin)
    }
    if (event.httpMethod === 'PUT' && event.resource === '/admin/bookings/availability') {
      const grid = new Set(generateSlots(nowMs, DEFAULT_BOOKING_CONFIG))
      const change = parseAvailabilityInput(event.body, grid)
      await changeAvailability(tableName, change, nowMs)
      console.log('[booking-admin] availability | opened=%d closed=%d', change.open.length, change.close.length)
      return respond(200, await overview(tableName, nowMs), alias, requestOrigin)
    }
    return respond(404, { error: 'Not found' }, alias, requestOrigin)
  } catch (err) {
    if (err instanceof HttpError) return respond(err.statusCode, { error: err.message }, alias, requestOrigin)
    console.error('[booking-admin] error', err)
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
