import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import jwt from 'jsonwebtoken'

const ssm = new SSMClient({ region: 'eu-west-2' })
const s3 = new S3Client({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

// Module-level cache — refreshed only on cold start
let cachedJwtSecret: string | null = null
let cachedTableName: string | null = null

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveAlias(context: Context): string {
  return context.invokedFunctionArn.split(':').pop() ?? 'dev'
}

function corsOrigin(alias: string): string {
  return alias === 'prod' ? 'https://aintern.nl' : 'http://localhost:5173'
}

function respond(
  statusCode: number,
  body: unknown,
  alias: string,
): APIGatewayProxyResult {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin(alias),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  if (statusCode === 204) {
    return { statusCode, headers, body: '' }
  }
  return { statusCode, headers, body: JSON.stringify(body) }
}

async function getJwtSecret(alias: string): Promise<string> {
  if (cachedJwtSecret) return cachedJwtSecret
  const path = `${process.env.JWT_SECRET_SSM_PREFIX}/${alias}`
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: true }),
  )
  const secret = result.Parameter?.Value
  if (!secret) throw new Error(`JWT secret not found at ${path}`)
  cachedJwtSecret = secret
  return secret
}

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const path = `${process.env.DYNAMODB_TABLE_SSM_PREFIX}/${alias}/dynamodb/table-name`
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: false }),
  )
  const name = result.Parameter?.Value
  if (!name) throw new Error(`DynamoDB table name not found at ${path}`)
  cachedTableName = name
  return name
}

async function requireAuth(
  event: APIGatewayProxyEvent,
  alias: string,
): Promise<void> {
  const authHeader = event.headers['Authorization'] ?? event.headers['authorization'] ?? ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
  const secret = await getJwtSecret(alias)
  jwt.verify(token, secret, { algorithms: ['HS256'] })
}

/**
 * Compute the current ISO week string, e.g. "2026-W15".
 */
function currentIsoWeek(): string {
  const now = new Date()
  const jan4 = new Date(now.getFullYear(), 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1)
  const weekNum =
    Math.floor((now.getTime() - startOfWeek1.getTime()) / (7 * 86400000)) + 1
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/**
 * Convert "2026-W15" → { start: Monday 00:00:00.000, end: Sunday 23:59:59.999 }
 */
function isoWeekToDateRange(week: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = week.split('-W')
  const year = parseInt(yearStr, 10)
  const weekNum = parseInt(weekStr, 10)
  const jan4 = new Date(year, 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1)
  const start = new Date(startOfWeek1)
  start.setDate(startOfWeek1.getDate() + (weekNum - 1) * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

/**
 * Parse a date string from the CSV (YYYY-MM-DD or ISO 8601).
 * Returns null if blank or unparseable.
 */
function parseDate(raw: string | undefined): Date | null {
  if (!raw || raw.trim() === '') return null
  const d = new Date(raw.trim())
  return isNaN(d.getTime()) ? null : d
}

// ── DynamoDB write helper ─────────────────────────────────────────────────────

async function writeActual(
  tableName: string,
  week: string,
  metricId: string,
  value: number,
): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk: `METRIC#${week}`,
        sk: metricId,
        value,
        source: 'automated',
        updatedAt: new Date().toISOString(),
      },
      // Automated writes are unconditional EXCEPT they must not overwrite manual rows.
      // Per spec: only PUT /admin/kpi/actuals protects manual rows. The refresh endpoint
      // uses unconditional PutItem for automated rows — it overwrites stale automated rows
      // freely but must not stomp manual entries.
      ConditionExpression: 'attribute_not_exists(pk) OR #src = :automated',
      ExpressionAttributeNames: { '#src': 'source' },
      ExpressionAttributeValues: { ':automated': 'automated' },
    }),
  )
}

// ── Integration 1: Outreach CSV → cmo.2, kr2.2 ───────────────────────────────

interface OutreachRow {
  connection_sent_at: string | undefined
}

async function parseOutreachCsv(csvText: string): Promise<OutreachRow[]> {
  const lines = csvText.split('\n').filter((l) => l.trim() !== '')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: OutreachRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = cols[idx]?.trim() ?? ''
    })
    rows.push({ connection_sent_at: row['connection_sent_at'] })
  }
  return rows
}

async function integrateOutreach(
  week: string,
  tableName: string,
  errors: string[],
): Promise<string[]> {
  const updated: string[] = []
  const bucket = 'aintern-kennisbank'
  const key = 'admin-assets/outreach-log.csv'

  let csvText: string
  try {
    const resp = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    )
    csvText = await resp.Body!.transformToString('utf-8')
  } catch (err: unknown) {
    const code = (err as { name?: string }).name
    if (code === 'NoSuchKey' || code === 'NoSuchBucket') {
      errors.push(`outreach-csv: S3 object s3://${bucket}/${key} not found — skipping cmo.2 / kr2.2`)
      // Write zero values as soft fallback
      try {
        await writeActual(tableName, week, 'cmo.2', 0)
        await writeActual(tableName, week, 'kr2.2', 0)
        updated.push('cmo.2', 'kr2.2')
      } catch {
        // Ignore write errors for zero fallback
      }
      return updated
    }
    throw err
  }

  const rows = await parseOutreachCsv(csvText)
  const { start, end } = isoWeekToDateRange(week)

  // Q2 2026 start: 2026-04-01
  const q2Start = new Date('2026-04-01T00:00:00.000Z')

  let weekCount = 0
  let ytdCount = 0

  for (const row of rows) {
    const d = parseDate(row.connection_sent_at)
    if (!d) continue
    // Q2 YTD: from 2026-04-01 through end of given week
    if (d >= q2Start && d <= end) {
      ytdCount++
    }
    // This week: Monday–Sunday of the given ISO week
    if (d >= start && d <= end) {
      weekCount++
    }
  }

  await writeActual(tableName, week, 'cmo.2', weekCount)
  await writeActual(tableName, week, 'kr2.2', ytdCount)
  updated.push('cmo.2', 'kr2.2')

  return updated
}

// ── Integration 2: Kennisbank S3 → cpo.1, kr3.3 ─────────────────────────────

async function integrateKennisbank(
  week: string,
  tableName: string,
  errors: string[],
): Promise<string[]> {
  const updated: string[] = []
  const bucket = 'aintern-kennisbank'
  const { start, end } = isoWeekToDateRange(week)

  try {
    let weekCount = 0
    let totalCount = 0
    let continuationToken: string | undefined

    do {
      const resp = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
        }),
      )
      for (const obj of resp.Contents ?? []) {
        totalCount++
        const lastModified = obj.LastModified
        if (lastModified && lastModified >= start && lastModified <= end) {
          weekCount++
        }
      }
      continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined
    } while (continuationToken)

    await writeActual(tableName, week, 'cpo.1', weekCount)
    await writeActual(tableName, week, 'kr3.3', totalCount)
    updated.push('cpo.1', 'kr3.3')
  } catch (err: unknown) {
    errors.push(`kennisbank-s3: ${(err as Error).message}`)
  }

  return updated
}

// ── Integration 3: GA4 → cpo.3, kr3.4 ───────────────────────────────────────

async function getSSMString(path: string, decrypt: boolean): Promise<string> {
  const result = await ssm.send(
    new GetParameterCommand({ Name: path, WithDecryption: decrypt }),
  )
  const value = result.Parameter?.Value
  if (!value) throw new Error(`SSM parameter not found: ${path}`)
  return value
}

async function integrateGA4(
  week: string,
  alias: string,
  tableName: string,
  errors: string[],
): Promise<string[]> {
  const updated: string[] = []

  try {
    const saPath = process.env.GA4_SA_SSM_PATH
    const propPath = process.env.GA4_PROPERTY_SSM_PATH

    if (!saPath || !propPath) {
      errors.push('ga4: GA4_SA_SSM_PATH or GA4_PROPERTY_SSM_PATH env vars not set')
      return updated
    }

    // Replace {alias} placeholder in SSM paths with actual alias
    const resolvedSaPath = saPath.replace('{alias}', alias)
    const resolvedPropPath = propPath.replace('{alias}', alias)

    const [serviceAccountJson, propertyId] = await Promise.all([
      getSSMString(resolvedSaPath, true),
      getSSMString(resolvedPropPath, false),
    ])

    const client = new BetaAnalyticsDataClient({
      credentials: JSON.parse(serviceAccountJson) as Record<string, string>,
    })

    // kr3.4 — monthly unique visitors (last 30 days)
    const [monthlyResponse] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [{ name: 'activeUsers' }],
    })

    let monthlyUsers = 0
    for (const row of monthlyResponse.rows ?? []) {
      const val = parseInt(row.metricValues?.[0]?.value ?? '0', 10)
      if (!isNaN(val)) monthlyUsers += val
    }

    await writeActual(tableName, week, 'kr3.4', monthlyUsers)
    updated.push('kr3.4')

    // cpo.3 — traffic check done (1 if GA4 returned > 0 rows this week, else 0)
    const trafficDone = (monthlyResponse.rows ?? []).length > 0 ? 1 : 0
    await writeActual(tableName, week, 'cpo.3', trafficDone)
    updated.push('cpo.3')
  } catch (err: unknown) {
    errors.push(`ga4: ${(err as Error).message}`)
  }

  return updated
}

// ── Request body parsing ─────────────────────────────────────────────────────

interface RefreshBody {
  week: string
}

function parseRefreshBody(raw: string | null): RefreshBody {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw ?? '{}')
  } catch {
    throw Object.assign(new Error('Invalid JSON body'), { statusCode: 400 })
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw Object.assign(new Error('Body must be a JSON object'), { statusCode: 400 })
  }

  const obj = parsed as Record<string, unknown>
  const week =
    typeof obj['week'] === 'string' && obj['week'].trim() !== ''
      ? obj['week'].trim()
      : currentIsoWeek()

  return { week }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const alias = resolveAlias(context)

  try {
    await requireAuth(event, alias)
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode ?? 401
    return respond(code, { error: (err as Error).message }, alias)
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' }, alias)
  }

  let week: string
  try {
    ;({ week } = parseRefreshBody(event.body))
  } catch (err: unknown) {
    const code = (err as { statusCode?: number }).statusCode ?? 400
    return respond(code, { error: (err as Error).message }, alias)
  }

  let tableName: string
  try {
    tableName = await getTableName(alias)
  } catch (err: unknown) {
    console.error('kpi-integrations: failed to resolve table name:', err)
    return respond(500, { error: 'Internal server error' }, alias)
  }

  const errors: string[] = []
  const updated: string[] = []

  // Run all three integrations; failures are caught internally and appended to errors[]
  const [outreachUpdated, kennisbankUpdated, ga4Updated] = await Promise.all([
    integrateOutreach(week, tableName, errors).catch((err: unknown) => {
      errors.push(`outreach: unexpected error — ${(err as Error).message}`)
      return []
    }),
    integrateKennisbank(week, tableName, errors).catch((err: unknown) => {
      errors.push(`kennisbank: unexpected error — ${(err as Error).message}`)
      return []
    }),
    integrateGA4(week, alias, tableName, errors).catch((err: unknown) => {
      errors.push(`ga4: unexpected error — ${(err as Error).message}`)
      return []
    }),
  ])

  updated.push(...outreachUpdated, ...kennisbankUpdated, ...ga4Updated)

  if (errors.length > 0) {
    console.warn('kpi-integrations: partial errors during refresh:', errors)
  }

  return respond(200, { week, updated, errors }, alias)
}
