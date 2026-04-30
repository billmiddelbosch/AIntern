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
let cachedXWebhookUrl: string | null | undefined = undefined

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

async function getXWebhookUrl(alias: string): Promise<string | null> {
  if (cachedXWebhookUrl !== undefined) return cachedXWebhookUrl
  try {
    const res = await ssm.send(
      new GetParameterCommand({ Name: `/aintern/${alias}/zapier/x-webhook-url` }),
    )
    cachedXWebhookUrl = res.Parameter?.Value ?? null
  } catch {
    cachedXWebhookUrl = null
  }
  return cachedXWebhookUrl
}

interface OpportunityItem {
  pk: string
  id: string
  pain: string
  persona: string
  opportunity: string
  priority: string
  status: string
}

interface ContentResult {
  content: string
  hashtags: string
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

async function generateLinkedInPost(opp: OpportunityItem, anthropic: Anthropic): Promise<ContentResult | null> {
  const prompt = `Schrijf een LinkedIn post voor het AIntern company account.
Toon: expert, geen sales pitch, concreet en herkenbaar.
Kies één van deze openingsformats:
- "Ik zag deze week [X] bedrijven worstelen met..."
- "Zo automatiseer je [proces] in 3 stappen"
- "Van handmatig → AI workflow: [specifiek voorbeeld]"

Geen CTA in de post zelf. Geen directe reclame voor AIntern.
Max 400 woorden. Sluit af met 3 relevante hashtags.

Opportunity:
Pain: ${opp.pain}
Persona: ${opp.persona}
Opportunity: ${opp.opportunity}

Retourneer ONLY valid JSON: { "content": "...", "hashtags": "..." }`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = (msg.content[0] as { type: string; text: string }).text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
    return JSON.parse(raw) as ContentResult
  } catch {
    return null
  }
}

async function generateXThread(opp: OpportunityItem, anthropic: Anthropic): Promise<string | null> {
  const prompt = `Schrijf een X-thread (3-5 tweets) over dit MKB-probleem.
Elke tweet max 280 tekens. Geen reclame voor AIntern.
Format als genummerde lijst: "1/ ...\n2/ ...\n3/ ..."

Pain: ${opp.pain}
Opportunity: ${opp.opportunity}

Retourneer ONLY valid JSON: { "content": "..." }`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = (msg.content[0] as { type: string; text: string }).text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
    const parsed = JSON.parse(raw) as { content: string }
    return parsed.content
  } catch {
    return null
  }
}

export async function handler(_event: unknown, context: Context): Promise<void> {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const [tableName, apiKey] = await Promise.all([getTableName(alias), getAnthropicKey(alias)])
  const anthropic = new Anthropic({ apiKey })

  // Query OpportunityStatements with status=draft
  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk',
      FilterExpression: 'begins_with(pk, :prefix) AND #status = :draft',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':gsi1pk': 'PRIORITY#high',
        ':prefix': 'OPPORTUNITY#',
        ':draft': 'draft',
      },
    }),
  )

  const opportunities = ((res.Items ?? []) as OpportunityItem[])
    .sort((a, b) => (PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 2) - (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 2))
    .slice(0, 3)

  console.log('[content-engine] opportunities selected=%d', opportunities.length)

  if (opportunities.length === 0) {
    console.log('[content-engine] no draft opportunities found')
    return
  }

  const now = new Date().toISOString()

  for (const opp of opportunities) {
    // LinkedIn company post
    const linkedInResult = await generateLinkedInPost(opp, anthropic)
    if (linkedInResult) {
      const postId = randomUUID()
      const scheduledFor = now

      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            pk: `CONTENT#${postId}`,
            sk: 'DRAFT',
            GSI1pk: 'CHANNEL#linkedin_company',
            GSI1sk: scheduledFor,
            id: postId,
            opportunityId: opp.id,
            channel: 'linkedin_company',
            format: 'post',
            content: linkedInResult.content,
            hashtags: linkedInResult.hashtags,
            status: 'draft',
            scheduledFor,
            createdAt: now,
            updatedAt: now,
          },
        }),
      )
      console.log('[content-engine] linkedin post created | id=%s', postId)
    }

    // X thread
    const xContent = await generateXThread(opp, anthropic)
    if (xContent) {
      const xId = randomUUID()

      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            pk: `CONTENT#${xId}`,
            sk: 'DRAFT',
            GSI1pk: 'CHANNEL#x',
            GSI1sk: now,
            id: xId,
            opportunityId: opp.id,
            channel: 'x',
            format: 'thread',
            content: xContent,
            status: 'draft',
            createdAt: now,
            updatedAt: now,
          },
        }),
      )
      console.log('[content-engine] x thread created | id=%s', xId)

      // Publish to X via Zapier webhook (autonomous — no approval gate)
      const xWebhookUrl = await getXWebhookUrl(alias)
      if (xWebhookUrl) {
        try {
          const res = await fetch(xWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: xContent }),
          })
          if (res.ok) {
            await ddb.send(
              new UpdateCommand({
                TableName: tableName,
                Key: { pk: `CONTENT#${xId}`, sk: 'DRAFT' },
                UpdateExpression: 'SET #status = :s, publishedAt = :now',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: { ':s': 'published', ':now': now },
              }),
            )
            console.log('[content-engine] x post published via zapier | id=%s', xId)
          } else {
            const errText = await res.text().catch(() => res.statusText)
            await ddb.send(
              new UpdateCommand({
                TableName: tableName,
                Key: { pk: `CONTENT#${xId}`, sk: 'DRAFT' },
                UpdateExpression: 'SET publishError = :e',
                ExpressionAttributeValues: { ':e': `zapier ${res.status}: ${errText}` },
              }),
            )
            console.error('[content-engine] x zapier webhook failed | id=%s status=%d', xId, res.status)
          }
        } catch (err) {
          console.error('[content-engine] x zapier webhook error | id=%s', xId, err)
        }
      } else {
        console.log('[content-engine] x webhook not configured — skipping publish | alias=%s', alias)
      }
    }

    // Update opportunity status to in-content
    await ddb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: `OPPORTUNITY#${opp.id}`, sk: 'STATEMENT' },
        UpdateExpression: 'SET #status = :status, updatedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'in-content', ':now': now },
      }),
    )
  }

  console.log('[content-engine] done | processed=%d', opportunities.length)
}
