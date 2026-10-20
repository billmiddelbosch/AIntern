/**
 * Public booking API — replaces the Calendly widget.
 *
 *   GET  /booking/slots  → bookable 30-min slots (UTC ISO): blocks Bill opened in the admin
 *                          (pk BOOKING_OPEN) that are still in the future and not booked
 *   POST /booking        → books a slot, upserts the lead in aintern-admin (CRM),
 *                          e-mails the lead (with .ics) and notifies b.middelbosch@bm-c.nl
 *
 * Double bookings are prevented with a conditional put on a slot-lock item
 * (pk BOOKING_SLOTS / sk SLOT#<iso>).
 *
 * Optional SSM parameters (per alias):
 *   /aintern/{alias}/booking/meeting-url    fixed video link shown in the confirmation
 *   /aintern/{alias}/booking/blocked-dates  "2026-12-24,2026-12-25" — days off
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { createHash, randomUUID } from 'crypto'
import {
  DEFAULT_BOOKING_CONFIG,
  generateSlots,
  parseBlockedDates,
  formatSlotLabel,
} from './lib/booking-slots'
import {
  buildLeadMail,
  buildOwnerMail,
  oneLine,
  ORGANIZER_EMAIL,
  type BookingDetails,
} from './lib/booking-email'
import { OPEN_PK, OPEN_PREFIX, SLOT_PK, queryStarts } from './lib/booking-store'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))
const ses = new SESClient({ region: 'eu-west-2' })

const RATE_PK = 'BOOKING_RATE'
const SETTINGS_TTL_MS = 5 * 60 * 1000
/** Max bookings per day from one IP address and for one email address. */
export const MAX_BOOKINGS_PER_IP_PER_DAY = 3
export const MAX_BOOKINGS_PER_EMAIL_PER_DAY = 2
/** Older notes are cut off so a lead item can never grow towards the 400 KB limit. */
const MAX_NOTES_LENGTH = 8000
/** Outreach stages a booking may move forward. Won/lost/booked leads keep their status. */
const ADVANCEABLE_STATUSES = new Set([
  'new',
  'not_found',
  'enriched',
  'email_sent',
  'connection_sent',
  'connected',
  'dm_sent',
  'dm_responded',
])

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

// ── SSM settings ─────────────────────────────────────────────────────────────

let cachedTableName: string | null = null
let cachedSettings: { meetingUrl?: string; blockedDates: Set<string>; at: number } | null = null

async function getParam(name: string, required: boolean): Promise<string | undefined> {
  try {
    const res = await ssm.send(new GetParameterCommand({ Name: name }))
    return res.Parameter?.Value?.trim() || undefined
  } catch (err) {
    if (!required && (err as { name?: string }).name === 'ParameterNotFound') return undefined
    throw err
  }
}

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  cachedTableName = (await getParam(`/aintern/${alias}/dynamodb/table-name`, true)) ?? 'aintern-admin'
  return cachedTableName
}

async function getSettings(alias: string) {
  if (cachedSettings && Date.now() - cachedSettings.at < SETTINGS_TTL_MS) return cachedSettings
  const [meetingUrlRaw, blockedRaw] = await Promise.all([
    getParam(`/aintern/${alias}/booking/meeting-url`, false),
    getParam(`/aintern/${alias}/booking/blocked-dates`, false),
  ])
  const meetingUrl = meetingUrlRaw && /^https:\/\/\S+$/.test(meetingUrlRaw) ? meetingUrlRaw : undefined
  cachedSettings = { meetingUrl, blockedDates: parseBlockedDates(blockedRaw), at: Date.now() }
  return cachedSettings
}

// ── Slots ────────────────────────────────────────────────────────────────────

async function availableSlots(alias: string, nowMs: number): Promise<string[]> {
  const [tableName, settings] = await Promise.all([getTableName(alias), getSettings(alias)])
  const from = new Date(nowMs).toISOString()
  const to = new Date(nowMs + (DEFAULT_BOOKING_CONFIG.maxDaysAhead + 2) * 86_400_000).toISOString()
  const [open, booked] = await Promise.all([
    queryStarts(ddb, tableName, OPEN_PK, from, to),
    queryStarts(ddb, tableName, SLOT_PK, from, to),
  ])
  return generateSlots(nowMs, DEFAULT_BOOKING_CONFIG, settings.blockedDates, booked).filter((s) => open.has(s))
}

async function handleSlots(alias: string, requestOrigin?: string): Promise<APIGatewayProxyResult> {
  const slots = await availableSlots(alias, Date.now())
  return respond(
    200,
    { timezone: 'Europe/Amsterdam', durationMinutes: DEFAULT_BOOKING_CONFIG.slotMinutes, slots },
    alias,
    requestOrigin,
  )
}

// ── Booking ──────────────────────────────────────────────────────────────────

interface BookingInput {
  start: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  website?: string
  note?: string
  locale: 'nl' | 'en'
}

const EMAIL_RE = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const PHONE_RE = /^[0-9+()\-.\s]{6,30}$/
const FREEMAIL = new Set([
  'gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.nl', 'outlook.com', 'outlook.nl',
  'live.com', 'live.nl', 'msn.com', 'yahoo.com', 'yahoo.nl', 'icloud.com', 'me.com',
  'ziggo.nl', 'kpnmail.nl', 'hetnet.nl', 'home.nl', 'planet.nl', 'xs4all.nl', 'proton.me',
  'protonmail.com',
])

class ValidationError extends Error {}

function str(body: Record<string, unknown>, key: string, max: number, required: boolean): string | undefined {
  const raw = body[key]
  if (raw === undefined || raw === null || raw === '') {
    if (required) throw new ValidationError(`${key} is required`)
    return undefined
  }
  if (typeof raw !== 'string') throw new ValidationError(`${key} must be a string`)
  const value = raw.trim()
  if (!value) {
    if (required) throw new ValidationError(`${key} is required`)
    return undefined
  }
  if (value.length > max) throw new ValidationError(`${key} is too long`)
  return value
}

/** Normalise "www.Bedrijf.nl/" or "http://bedrijf.nl" → "https://bedrijf.nl". */
export function normaliseWebsite(raw: string): string | undefined {
  const host = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0]
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? `https://${host}` : undefined
}

export function parseBookingInput(rawBody: string | null): BookingInput | 'honeypot' {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody ?? '')
  } catch {
    throw new ValidationError('Invalid JSON body')
  }
  if (!parsed || typeof parsed !== 'object') throw new ValidationError('Invalid body')
  const body = parsed as Record<string, unknown>

  // Hidden field — real visitors leave it empty
  if (typeof body['fax'] === 'string' && body['fax'] !== '') return 'honeypot'

  const start = str(body, 'start', 40, true)!
  if (Number.isNaN(Date.parse(start)) || new Date(start).toISOString() !== start) {
    throw new ValidationError('start must be an ISO timestamp')
  }

  const email = str(body, 'email', 254, true)!.toLowerCase()
  if (!EMAIL_RE.test(email)) throw new ValidationError('email is invalid')

  const phone = str(body, 'phone', 30, false)
  if (phone && !PHONE_RE.test(phone)) throw new ValidationError('phone is invalid')

  const websiteRaw = str(body, 'website', 200, false)
  const website = websiteRaw ? normaliseWebsite(websiteRaw) : undefined
  if (websiteRaw && !website) throw new ValidationError('website is invalid')

  return {
    start,
    companyName: oneLine(str(body, 'companyName', 120, true)!),
    contactName: oneLine(str(body, 'contactName', 100, true)!),
    email,
    phone: phone ? oneLine(phone) : undefined,
    website,
    note: str(body, 'note', 2000, false),
    locale: body['locale'] === 'en' ? 'en' : 'nl',
  }
}

/** Lead identifier in aintern-admin follows the CRM convention pk = LEAD#<encoded website>. */
function leadWebsite(input: BookingInput): string {
  if (input.website) return input.website
  const domain = input.email.split('@')[1]
  return FREEMAIL.has(domain) ? input.email : `https://${domain}`
}

async function upsertLead(
  tableName: string,
  input: BookingInput,
  bookingId: string,
  meetingUrl: string | undefined,
  nowIso: string,
): Promise<string> {
  const website = leadWebsite(input)
  const key = { pk: `LEAD#${encodeURIComponent(website)}`, sk: 'METADATA' }

  const bookingLine = [
    `[Afspraak ${formatSlotLabel(input.start, 'nl')}]`,
    `${input.contactName} <${input.email}>${input.phone ? ` · ${input.phone}` : ''}`,
    input.note ? `Opmerking: ${input.note}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Optimistic concurrency: the notes write only lands if nobody changed them in between
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = (await ddb.send(new GetCommand({ TableName: tableName, Key: key }))).Item
    const oldNotes = typeof existing?.notes === 'string' ? existing.notes : undefined
    const combined = oldNotes ? `${bookingLine}\n\n${oldNotes}` : bookingLine
    // Existing history is never cut away by a public form: when full, the booking line is skipped
    // (it is still stored in the slot item and in Bill's notification mail).
    const notes = combined.length <= MAX_NOTES_LENGTH ? combined : (oldNotes ?? bookingLine.slice(0, MAX_NOTES_LENGTH))
    const currentStatus = typeof existing?.status === 'string' ? existing.status : undefined
    const status =
      currentStatus === undefined || ADVANCEABLE_STATUSES.has(currentStatus) ? 'discovery_booked' : currentStatus

    try {
      await ddb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: key,
          UpdateExpression: [
            'SET #id = if_not_exists(#id, :id)',
            // Identity fields of an existing lead are never overwritten by a public form
            'website = if_not_exists(website, :website)',
            'companyName = if_not_exists(companyName, :companyName)',
            'email = if_not_exists(email, :email)',
            'contactName = if_not_exists(contactName, :contactName)',
            '#status = :status',
            'discoveryBookedAt = :start',
            'bookingId = :bookingId',
            'notes = :notes',
            '#source = if_not_exists(#source, :source)',
            'createdAt = if_not_exists(createdAt, :now)',
            'updatedAt = :now',
            ...(input.phone ? ['phone = if_not_exists(phone, :phone)'] : []),
            ...(meetingUrl ? ['discoveryCallUrl = :meetingUrl'] : []),
          ].join(', '),
          ConditionExpression: oldNotes === undefined ? 'attribute_not_exists(notes)' : 'notes = :oldNotes',
          ExpressionAttributeNames: { '#id': 'id', '#status': 'status', '#source': 'source' },
          ExpressionAttributeValues: {
            ':id': randomUUID(),
            ':website': website,
            ':companyName': input.companyName,
            ':email': input.email,
            ':contactName': input.contactName,
            ':status': status,
            ':start': input.start,
            ':bookingId': bookingId,
            ':notes': notes,
            ':source': 'booking-page',
            ':now': nowIso,
            ...(oldNotes !== undefined ? { ':oldNotes': oldNotes } : {}),
            ...(input.phone ? { ':phone': input.phone } : {}),
            ...(meetingUrl ? { ':meetingUrl': meetingUrl } : {}),
          },
        }),
      )
      return website
    } catch (err) {
      if ((err as { name?: string }).name !== 'ConditionalCheckFailedException' || attempt === 2) throw err
    }
  }
  throw new Error('lead upsert retries exhausted')
}

/** Gmail-style aliases (a+1@, a.b@gmail) count as one address for the rate limit. */
export function rateEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@')
  let base = local.split('+')[0]
  if (domain === 'gmail.com' || domain === 'googlemail.com') base = base.replace(/\./g, '')
  return `${base}@${domain}`
}

/** IPv6 clients usually own a whole /64, so the limit applies per /64 prefix. */
export function rateIp(ip: string): string {
  if (!ip.includes(':')) return ip
  const head = ip.toLowerCase().split('::')[0].split(':')
  return head.slice(0, 4).join(':')
}

/** One-way hash so no raw IP address or email ends up in the rate-limit items. */
function rateKey(kind: 'IP' | 'EMAIL', value: string, day: string): string {
  const hash = createHash('sha256').update(`${kind}:${value}:${day}`).digest('hex').slice(0, 32)
  return `${kind}#${day}#${hash}`
}

/**
 * Atomically counts one booking for this key. Returns false once the daily limit is reached.
 * Items carry a `ttl` (epoch seconds) so they can expire if TTL is enabled on the table.
 */
async function withinDailyLimit(
  tableName: string,
  sk: string,
  max: number,
  nowMs: number,
): Promise<boolean> {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: RATE_PK, sk },
        UpdateExpression: 'ADD #count :one SET #ttl = :ttl',
        ConditionExpression: 'attribute_not_exists(#count) OR #count < :max',
        ExpressionAttributeNames: { '#count': 'count', '#ttl': 'ttl' },
        ExpressionAttributeValues: {
          ':one': 1,
          ':max': max,
          ':ttl': Math.floor(nowMs / 1000) + 2 * 24 * 3600,
        },
      }),
    )
    return true
  } catch (err) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') return false
    throw err
  }
}

/** Gives a counted attempt back when the booking did not go through (taken slot, failure). */
async function releaseCount(tableName: string, sk: string): Promise<void> {
  await ddb
    .send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: RATE_PK, sk },
        UpdateExpression: 'ADD #count :minusOne',
        ConditionExpression: '#count > :zero',
        ExpressionAttributeNames: { '#count': 'count' },
        ExpressionAttributeValues: { ':minusOne': -1, ':zero': 0 },
      }),
    )
    .catch((e) => console.error('[booking] rate release failed', e))
}

async function handleBook(
  event: APIGatewayProxyEvent,
  alias: string,
  requestOrigin?: string,
): Promise<APIGatewayProxyResult> {
  // Only real JSON requests: forces a CORS preflight for cross-site browser posts
  const contentType = event.headers?.['content-type'] ?? event.headers?.['Content-Type'] ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return respond(415, { error: 'Content-Type must be application/json' }, alias, requestOrigin)
  }

  const input = parseBookingInput(event.body)
  if (input === 'honeypot') {
    // Pretend success so bots learn nothing
    return respond(200, { ok: true }, alias, requestOrigin)
  }

  const nowMs = Date.now()
  const nowIso = new Date(nowMs).toISOString()
  const [tableName, settings] = await Promise.all([getTableName(alias), getSettings(alias)])

  // Must be a slot we actually offer (working hours, not past, not blocked)
  const offered = generateSlots(nowMs, DEFAULT_BOOKING_CONFIG, settings.blockedDates)
  if (!offered.includes(input.start)) {
    return respond(409, { error: 'slot_unavailable' }, alias, requestOrigin)
  }
  // ...and one Bill opened in the admin
  const openItem = await ddb.send(
    new GetCommand({ TableName: tableName, Key: { pk: OPEN_PK, sk: `${OPEN_PREFIX}${input.start}` } }),
  )
  if (!openItem.Item) {
    return respond(409, { error: 'slot_unavailable' }, alias, requestOrigin)
  }

  // Per-client limits: stops one visitor from filling the calendar or using us to mail others
  const day = nowIso.slice(0, 10)
  const sourceIp = event.requestContext?.identity?.sourceIp ?? 'unknown'
  const ipKey = rateKey('IP', rateIp(sourceIp), day)
  const emailKey = rateKey('EMAIL', rateEmail(input.email), day)
  const releaseCounts = () => Promise.all([releaseCount(tableName, ipKey), releaseCount(tableName, emailKey)])

  if (!(await withinDailyLimit(tableName, ipKey, MAX_BOOKINGS_PER_IP_PER_DAY, nowMs))) {
    console.warn('[booking] daily IP limit reached')
    return respond(429, { error: 'too_many_bookings' }, alias, requestOrigin)
  }
  if (!(await withinDailyLimit(tableName, emailKey, MAX_BOOKINGS_PER_EMAIL_PER_DAY, nowMs))) {
    await releaseCount(tableName, ipKey)
    console.warn('[booking] daily e-mail limit reached')
    return respond(429, { error: 'too_many_bookings' }, alias, requestOrigin)
  }

  const bookingId = randomUUID()
  const website = leadWebsite(input)
  const end = new Date(Date.parse(input.start) + DEFAULT_BOOKING_CONFIG.slotMinutes * 60_000).toISOString()

  try {
    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: SLOT_PK,
          sk: `SLOT#${input.start}`,
          bookingId,
          start: input.start,
          end,
          companyName: input.companyName,
          contactName: input.contactName,
          email: input.email,
          // Shown in the admin booking list (links to the CRM lead)
          leadWebsite: website,
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.note ? { note: input.note } : {}),
          locale: input.locale,
          createdAt: nowIso,
        },
        ConditionExpression: 'attribute_not_exists(pk)',
      }),
    )
  } catch (err) {
    await releaseCounts()
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
      return respond(409, { error: 'slot_unavailable' }, alias, requestOrigin)
    }
    throw err
  }

  try {
    await upsertLead(tableName, input, bookingId, settings.meetingUrl, nowIso)
  } catch (err) {
    // Release the slot so the visitor can retry
    await ddb
      .send(new DeleteCommand({ TableName: tableName, Key: { pk: SLOT_PK, sk: `SLOT#${input.start}` } }))
      .catch((e) => console.error('[booking] slot release failed', e))
    await releaseCounts()
    throw err
  }

  const details: BookingDetails = {
    bookingId,
    start: input.start,
    end,
    companyName: input.companyName,
    contactName: input.contactName,
    email: input.email,
    phone: input.phone,
    website: input.website,
    note: input.note,
    locale: input.locale,
    meetingUrl: settings.meetingUrl,
  }
  const siteBase = alias === 'prod' ? 'https://aintern.nl' : 'https://test.aintern.nl'
  const adminLeadUrl = `${siteBase}/admin/leads/${encodeURIComponent(encodeURIComponent(website))}`

  const results = await Promise.allSettled([
    ses.send(
      new SendRawEmailCommand({
        // Explicit recipients: SES must never derive them from (user-influenced) headers
        Destinations: [input.email],
        RawMessage: { Data: Buffer.from(buildLeadMail(details, nowIso, randomUUID())) },
      }),
    ),
    ses.send(
      new SendRawEmailCommand({
        Destinations: [ORGANIZER_EMAIL],
        RawMessage: { Data: Buffer.from(buildOwnerMail(details, adminLeadUrl, nowIso, randomUUID())) },
      }),
    ),
  ])
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`[booking] mail ${i === 0 ? 'lead' : 'owner'} failed`, r.reason)
  })

  console.log('[booking] booked | bookingId=%s start=%s', bookingId, input.start)
  return respond(
    201,
    {
      bookingId,
      start: input.start,
      end,
      meetingUrl: settings.meetingUrl ?? null,
      emailSent: results[0].status === 'fulfilled',
    },
    alias,
    requestOrigin,
  )
}

// ── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const requestOrigin = event.headers?.['origin'] ?? event.headers?.['Origin']

  try {
    if (event.httpMethod === 'GET' && event.resource === '/booking/slots') {
      return await handleSlots(alias, requestOrigin)
    }
    if (event.httpMethod === 'POST' && event.resource === '/booking') {
      return await handleBook(event, alias, requestOrigin)
    }
    return respond(404, { error: 'Not found' }, alias, requestOrigin)
  } catch (err) {
    if (err instanceof ValidationError) {
      return respond(400, { error: err.message }, alias, requestOrigin)
    }
    console.error('[booking] error', err)
    return respond(500, { error: 'Internal server error' }, alias, requestOrigin)
  }
}
