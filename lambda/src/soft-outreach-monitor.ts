import type { Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  PutCommand,
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

const INTENT_KEYWORDS = [
  'hoe kan ik',
  'wat raad je aan',
  'iemand ervaring met',
  'looking for a solution',
  'any recommendations',
  'how do i',
  'anyone use',
  'what tool',
  'welke tool',
  'aanbevelingen',
]

interface RedditPost {
  data: {
    id: string
    title: string
    selftext: string
    permalink: string
    score: number
    num_comments: number
    author: string
    subreddit: string
  }
}

interface RedditListing {
  data: { children: RedditPost[] }
}

interface OpportunityItem {
  pk: string
  id: string
  pain: string
  persona: string
  opportunity: string
  priority: string
}

interface SuggestedResponseResult {
  response: string
  intent: 'question' | 'complaint' | 'solution_seeking'
}

function hasIntent(title: string, text: string): boolean {
  const combined = `${title} ${text}`.toLowerCase()
  return INTENT_KEYWORDS.some((kw) => combined.includes(kw))
}

async function checkUrlExists(tableName: string, sourceUrl: string): Promise<boolean> {
  // Use begins_with scan on GSI to find existing OUTREACH# items with this sourceUrl
  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk',
      FilterExpression: 'sourceUrl = :url',
      ExpressionAttributeValues: {
        ':gsi1pk': 'STATUS#pending',
        ':url': sourceUrl,
      },
    }),
  )
  return (res.Items?.length ?? 0) > 0
}

async function generateSuggestedResponse(
  title: string,
  text: string,
  opportunity: string,
  anthropic: Anthropic,
): Promise<SuggestedResponseResult | null> {
  const prompt = `Schrijf een behulpzame reactie op deze Reddit post.
Toon: expert collega, geen verkoper.
Max 150 woorden. Geef concrete tip. Noem AIntern NIET.
Pas de tip aan op de sector/context van de post.

Post: ${title} — ${text.slice(0, 500)}
Relevante opportunity context: ${opportunity}

Retourneer ONLY valid JSON: { "response": "...", "intent": "question|complaint|solution_seeking" }`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    return JSON.parse(raw) as SuggestedResponseResult
  } catch {
    return null
  }
}

export async function handler(_event: unknown, context: Context): Promise<void> {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const [tableName, apiKey] = await Promise.all([getTableName(alias), getAnthropicKey(alias)])
  const anthropic = new Anthropic({ apiKey })

  // Load active subreddits
  const subRes = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk',
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': 'STATUS#active',
        ':prefix': 'SUBREDDIT#',
      },
    }),
  )
  const SUBREDDIT_RE = /^[A-Za-z0-9_]{1,21}$/
  const subreddits = (subRes.Items ?? [])
    .map((i) => (i.pk as string).replace('SUBREDDIT#', ''))
    .filter((s) => SUBREDDIT_RE.test(s))

  // Load high-priority opportunities
  const oppRes = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk',
      FilterExpression: 'begins_with(pk, :prefix) AND #status <> :archived',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':gsi1pk': 'PRIORITY#high',
        ':prefix': 'OPPORTUNITY#',
        ':archived': 'archived',
      },
    }),
  )
  const opportunities = (oppRes.Items ?? []) as OpportunityItem[]

  if (opportunities.length === 0) {
    console.log('[soft-outreach] no high-priority opportunities found')
    return
  }

  let alertsCreated = 0
  const now = new Date().toISOString()

  for (const subreddit of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=30`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AIntern-SoftOutreach/1.0' },
      })
      if (!res.ok) continue

      const listing = (await res.json()) as RedditListing
      const posts = listing.data.children

      const candidates = posts
        .map((p) => ({
          ...p.data,
          hotScore: p.data.score + p.data.num_comments * 3,
        }))
        .filter((p) => p.hotScore >= 15 && hasIntent(p.title, p.selftext))

      for (const post of candidates) {
        const sourceUrl = `https://www.reddit.com${post.permalink}`

        if (await checkUrlExists(tableName, sourceUrl)) continue

        // Match against opportunities (use first opportunity as simplification)
        const opportunity = opportunities[0]
        const suggested = await generateSuggestedResponse(post.title, post.selftext, opportunity.opportunity, anthropic)
        if (!suggested) continue

        const id = randomUUID()
        await ddb.send(
          new PutCommand({
            TableName: tableName,
            Item: {
              pk: `OUTREACH#${id}`,
              sk: 'ALERT',
              GSI1pk: 'STATUS#pending',
              GSI1sk: now,
              id,
              opportunityId: opportunity.id,
              source: 'reddit',
              sourceUrl,
              authorName: post.author,
              intent: suggested.intent,
              suggestedResponse: suggested.response,
              status: 'pending',
              createdAt: now,
            },
          }),
        )
        alertsCreated++
        console.log('[soft-outreach] alert created | id=%s subreddit=%s', id, subreddit)
      }
    } catch (err) {
      console.error('[soft-outreach] error | subreddit=%s', subreddit, err)
    }
  }

  console.log('[soft-outreach] done | alerts_created=%d', alertsCreated)
}
