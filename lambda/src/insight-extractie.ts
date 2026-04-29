import type { Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
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

interface PainSignalItem {
  pk: string
  id: string
  title: string
  text: string
  painCategory: string
  urgency: 'high' | 'medium' | 'low'
}

interface ClusterResult {
  painSignalIds: string[]
  pain: string
  persona: string
  rootCause: string
  opportunity: string
  priority: 'high' | 'medium' | 'low'
}

function determinePriority(urgencies: string[]): 'high' | 'medium' | 'low' {
  if (urgencies.every((u) => u === 'high')) return 'high'
  if (urgencies.some((u) => u === 'high') || urgencies.every((u) => u === 'medium')) return 'medium'
  return 'low'
}

export async function handler(_event: unknown, context: Context): Promise<void> {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const [tableName, apiKey] = await Promise.all([getTableName(alias), getAnthropicKey(alias)])
  const anthropic = new Anthropic({ apiKey })

  // Query all new PainSignals
  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk',
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': 'STATUS#new',
        ':prefix': 'PAIN#',
      },
    }),
  )

  const pains = (res.Items ?? []) as PainSignalItem[]
  console.log('[insight-extractie] new pains found=%d', pains.length)

  if (pains.length < 3) {
    console.log('[insight-extractie] not enough signals — minimum 3 required')
    return
  }

  const painList = pains
    .map((p) => `ID: ${p.id}\nTitel: ${p.title}\nText: ${p.text.slice(0, 400)}\nCategorie: ${p.painCategory}\nUrgency: ${p.urgency}`)
    .join('\n\n---\n\n')

  const prompt = `Je ontvangt een lijst Reddit-pains over MKB-processen.
Cluster ze in maximaal 5 thema-groepen en genereer per groep een Opportunity Statement.
Retourneer ONLY valid JSON zonder markdown:

[
  {
    "painSignalIds": ["id1", "id2"],
    "pain": "...",
    "persona": "...",
    "rootCause": "...",
    "opportunity": "...",
    "priority": "high|medium|low"
  }
]

Pains:
${painList}`

  let clusters: ClusterResult[] = []
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = (msg.content[0] as { type: string; text: string }).text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
    clusters = JSON.parse(raw) as ClusterResult[]
  } catch (err) {
    console.error('[insight-extractie] haiku clustering failed', err)
    return
  }

  const now = new Date().toISOString()

  for (const cluster of clusters.slice(0, 5)) {
    const id = randomUUID()

    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: `OPPORTUNITY#${id}`,
          sk: 'STATEMENT',
          GSI1pk: `PRIORITY#${cluster.priority}`,
          GSI1sk: now,
          id,
          painSignalIds: cluster.painSignalIds,
          pain: cluster.pain,
          persona: cluster.persona,
          rootCause: cluster.rootCause,
          opportunity: cluster.opportunity,
          priority: cluster.priority,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        },
      }),
    )

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    // Update processed PainSignals
    for (const painId of cluster.painSignalIds) {
      if (!UUID_RE.test(painId)) {
        console.warn('[insight-extractie] invalid painId from LLM — skipping | painId=%s', painId)
        continue
      }
      try {
        await ddb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { pk: `PAIN#${painId}`, sk: 'SIGNAL' },
            UpdateExpression: 'SET #status = :processed, GSI1pk = :processed_gsi, opportunityId = :oid',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':processed': 'processed',
              ':processed_gsi': 'STATUS#processed',
              ':oid': id,
            },
          }),
        )
      } catch (err) {
        console.error('[insight-extractie] pain update failed | painId=%s', painId, err)
      }
    }

    console.log('[insight-extractie] opportunity created | id=%s priority=%s', id, cluster.priority)
  }

  // Determine overall priority for log
  const allUrgencies = pains.map((p) => p.urgency)
  console.log('[insight-extractie] done | clusters=%d priority=%s', clusters.length, determinePriority(allUrgencies))
}
