import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))
const ses = new SESClient({ region: 'eu-west-2' })

let cachedTableName: string | null = null
let cachedAnthropicKey: string | null = null

async function getAnthropicKey(alias: string): Promise<string> {
  if (cachedAnthropicKey) return cachedAnthropicKey
  const res = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${alias}/anthropic/api-key`, WithDecryption: true }),
  )
  const key = res.Parameter?.Value ?? ''
  if (!key) throw new Error('[getAnthropicKey] SSM parameter missing or empty')
  cachedAnthropicKey = key
  return cachedAnthropicKey
}

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const res = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${alias}/dynamodb/table-name` }),
  )
  cachedTableName = res.Parameter?.Value ?? 'aintern-admin'
  return cachedTableName
}

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
    },
    body: JSON.stringify(body),
  }
}

interface ScanBody {
  email: string
  answers: Record<string, string | number>
  score: number
  rawScore: number
  topIssues: string[]
}

interface Recommendation {
  issue: string
  recommendation: string
  ainternApproach: string
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'Relatief geoptimaliseerd'
  if (score >= 40) return 'Geïdentificeerde gaps'
  return 'Hoog automatiserings-potentieel'
}

function toHtmlScanReport(score: number, topIssues: string[], recommendations: Recommendation[]): string {
  const label = scoreLabel(score)
  const issuesHtml = topIssues.length > 0
    ? topIssues.map(i => `<li style="margin:0 0 8px;font-size:14px;color:#374151;list-style:none;">&bull; ${escHtml(i)}</li>`).join('')
    : '<li style="font-size:14px;color:#374151;list-style:none;">Geen specifieke knelpunten gevonden.</li>'
  const recsHtml = recommendations.map((rec, i) => `
    <div style="margin-bottom:16px;padding:16px;background:#f8fafc;border-radius:8px;border-left:3px solid #4f46e5;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#1e293b;">${i + 1}. ${escHtml(rec.issue)}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#475569;">${escHtml(rec.recommendation)}</p>
      <p style="margin:0;font-size:12px;color:#6366f1;"><strong>AIntern aanpak:</strong> ${escHtml(rec.ainternApproach)}</p>
    </div>`).join('')

  return `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:600px;">
<tr><td>
<div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e5e7eb;">
  <span style="font-size:20px;font-weight:700;color:#4f46e5;letter-spacing:-0.5px;">AIntern</span>
</div>
<p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#374151;">Bedankt voor het invullen van de AI Workflow Scan.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#374151;">Hier is jouw persoonlijke analyse:</p>
<div style="margin-bottom:24px;padding:20px;background:#eef2ff;border-radius:8px;text-align:center;">
  <p style="margin:0 0 4px;font-size:32px;font-weight:700;color:#4f46e5;">${score}/100</p>
  <p style="margin:0;font-size:14px;color:#6366f1;font-weight:600;">${label}</p>
</div>
<div style="margin-bottom:24px;">
  <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">Geïdentificeerde knelpunten</h3>
  <ul style="margin:0;padding:0;">${issuesHtml}</ul>
</div>
<div style="margin-bottom:32px;">
  <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">Aanbevelingen</h3>
  ${recsHtml}
</div>
<div style="margin-bottom:32px;padding:24px;background:#4f46e5;border-radius:8px;text-align:center;">
  <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#ffffff;">Klaar om te automatiseren?</p>
  <p style="margin:0 0 16px;font-size:13px;color:#c7d2fe;">Plan een gratis 15-minuten gesprek. We laten zien welke knelpunten we als eerste aanpakken.</p>
  <a href="https://aintern.nl/?booking=1" style="display:inline-block;padding:12px 24px;background:#ffffff;color:#4f46e5;font-weight:600;font-size:14px;text-decoration:none;border-radius:6px;">Plan een gratis gesprek &rarr;</a>
</div>
<div style="padding-top:24px;border-top:1px solid #e5e7eb;">
  <p style="margin:0;font-size:14px;font-weight:600;color:#374151;">Sanne</p>
  <p style="margin:3px 0 0;font-size:13px;color:#6b7280;">CMO — AIntern</p>
  <p style="margin:3px 0 0;font-size:13px;"><a href="https://aintern.nl" style="color:#4f46e5;text-decoration:none;">aintern.nl</a></p>
</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

async function generateRecommendations(
  topIssues: string[],
  anthropic: Anthropic,
  sector?: string | number,
): Promise<Recommendation[]> {
  const issueList = topIssues.join('\n- ')
  const sectorContext = sector ? `Sector: ${sector}` : ''

  const prompt = `Je bent een AI-procesoptimalisatie expert voor MKB bedrijven.
Genereer voor elk knelpunt een concrete aanbeveling.
${sectorContext}

Knelpunten:
- ${issueList}

Retourneer ONLY valid JSON als array:
[
  {
    "issue": "...",
    "recommendation": "...",
    "ainternApproach": "..."
  }
]`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    return JSON.parse(raw) as Recommendation[]
  } catch {
    return topIssues.map((issue) => ({
      issue,
      recommendation: 'Overweeg procesautomatisering voor dit knelpunt.',
      ainternApproach: 'AIntern analyseert uw huidige workflow en implementeert een passende oplossing.',
    }))
  }
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']

  if (event.httpMethod === 'OPTIONS') {
    return respond(200, {}, alias, requestOrigin)
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed' }, alias, requestOrigin)
  }

  let body: ScanBody
  try {
    body = JSON.parse(event.body ?? '{}') as ScanBody
  } catch {
    return respond(400, { error: 'Invalid JSON' }, alias, requestOrigin)
  }

  const { email, answers, score, rawScore, topIssues } = body

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return respond(400, { error: 'Invalid email' }, alias, requestOrigin)
  }
  if (typeof score !== 'number' || score < 0 || score > 100) {
    return respond(400, { error: 'Invalid score' }, alias, requestOrigin)
  }
  if (typeof rawScore !== 'number' || rawScore < 0 || rawScore > 115) {
    return respond(400, { error: 'Invalid rawScore' }, alias, requestOrigin)
  }
  if (
    !Array.isArray(topIssues) ||
    topIssues.length > 10 ||
    topIssues.some((i) => typeof i !== 'string' || i.length > 200)
  ) {
    return respond(400, { error: 'Invalid topIssues' }, alias, requestOrigin)
  }
  if (
    typeof answers !== 'object' ||
    answers === null ||
    Array.isArray(answers) ||
    Object.keys(answers).length > 20 ||
    Object.values(answers).some(
      (v) => (typeof v !== 'string' && typeof v !== 'number') ||
             (typeof v === 'string' && v.length > 500),
    )
  ) {
    return respond(400, { error: 'Invalid answers' }, alias, requestOrigin)
  }

  const [tableName, apiKey] = await Promise.all([getTableName(alias), getAnthropicKey(alias)])
  const anthropic = new Anthropic({ apiKey })
  const id = randomUUID()
  const now = new Date().toISOString()
  const sector = answers?.q7

  try {
    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: `SCAN#${id}`,
          sk: 'SUBMISSION',
          GSI1pk: 'STATUS#new',
          GSI1sk: now,
          id,
          email,
          score,
          rawScore: typeof rawScore === 'number' ? rawScore : 0,
          answers,
          topIssues,
          sector: sector ?? null,
          createdAt: now,
        },
      }),
    )
  } catch (err) {
    console.error('[workflow-scan] ddb put error', err)
    return respond(500, { error: 'Internal error' }, alias, requestOrigin)
  }

  const recommendations = await generateRecommendations(topIssues, anthropic, sector)

  const emailDomain = email.split('@')[1] ?? ''
  const website = emailDomain ? `https://${emailDomain}` : ''
  const leadNotes = `Score: ${score}/100 | Sector: ${sector ?? 'Onbekend'} | Knelpunten: ${topIssues.join(', ')}`
  const htmlBody = toHtmlScanReport(score, topIssues, recommendations)
  const textBody = [
    `Bedankt voor het invullen van de AI Workflow Scan.`,
    ``,
    `Je score: ${score}/100 — ${scoreLabel(score)}`,
    ``,
    `Knelpunten:`,
    ...topIssues.map(i => `- ${i}`),
    ``,
    `Aanbevelingen:`,
    ...recommendations.map((r, i) => `${i + 1}. ${r.issue}\n   ${r.recommendation}\n   AIntern aanpak: ${r.ainternApproach}`),
    ``,
    `Plan een gratis gesprek: https://aintern.nl/?booking=1`,
    ``,
    `-- Sanne, CMO — AIntern — aintern.nl`,
  ].join('\n')

  const leadPk = website ? `LEAD#${encodeURIComponent(website)}` : `LEAD#${id}`

  await Promise.allSettled([
    ddb.send(new PutCommand({
      TableName: tableName,
      Item: {
        pk: leadPk,
        sk: 'METADATA',
        id,
        website,
        email,
        status: 'email_sent',
        source: 'workflow-scan',
        notes: leadNotes,
        createdAt: now,
        updatedAt: now,
      },
    })).catch(err => console.error('[workflow-scan] lead put error', err)),
    ses.send(new SendEmailCommand({
      Source: 'Sanne van AIntern <sanne@aintern.nl>',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: `Jouw AI Workflow Analyse — ${score}/100`, Charset: 'UTF-8' },
        Body: {
          Text: { Data: textBody, Charset: 'UTF-8' },
          Html: { Data: htmlBody, Charset: 'UTF-8' },
        },
      },
    })).catch(err => console.error('[workflow-scan] ses send error', err)),
  ])

  return respond(200, { id, recommendations }, alias, requestOrigin)
}
