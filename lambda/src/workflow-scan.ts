import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

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
  if (
    !Array.isArray(topIssues) ||
    topIssues.length > 10 ||
    topIssues.some((i) => typeof i !== 'string' || i.length > 200)
  ) {
    return respond(400, { error: 'Invalid topIssues' }, alias, requestOrigin)
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

  return respond(200, { id, recommendations }, alias, requestOrigin)
}
