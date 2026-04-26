import type { Context } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { createHash } from 'crypto'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

const TABLE_NAME = process.env.PAIN_TABLE_NAME ?? 'PainDatabase'

const SUBREDDITS = ['ondernemers', 'webshops', 'lightspeed'] as const

const PAIN_KEYWORDS = [
  'productinvoer',
  'handmatig',
  'tijdgebrek',
  'te druk',
  'repetitief',
  'data entry',
  'lightspeed',
  'webshop',
  'artikelen invoeren',
  'productdata',
]

interface RedditChild {
  data: {
    title: string
    selftext: string
    permalink: string
  }
}

interface RedditListing {
  data: { children: RedditChild[] }
}

function determineBranche(subreddit: string): string {
  if (subreddit === 'webshops') return 'webshop'
  if (subreddit === 'lightspeed') return 'lightspeed'
  return 'mkb'
}

function signalId(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16)
}

function matchedKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  return PAIN_KEYWORDS.filter((kw) => lower.includes(kw))
}

export async function handler(_event: unknown, _context: Context): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  let totalSaved = 0

  for (const subreddit of SUBREDDITS) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AIntern-SignaalDetectie/1.0' },
      })

      if (!res.ok) {
        console.error('[signaaldetectie] reddit fetch failed | subreddit=%s status=%d', subreddit, res.status)
        continue
      }

      const listing = (await res.json()) as RedditListing
      const posts = listing.data.children
      const branche = determineBranche(subreddit)
      let saved = 0

      for (const post of posts) {
        const { title, selftext, permalink } = post.data
        const fullText = `${title} ${selftext}`
        const keywords = matchedKeywords(fullText)

        if (keywords.length === 0) continue

        const postUrl = `https://www.reddit.com${permalink}`
        const id = signalId(postUrl)

        try {
          await ddb.send(
            new PutCommand({
              TableName: TABLE_NAME,
              Item: {
                signalId: id,
                brancheDate: `${branche}#${today}`,
                source: 'reddit',
                url: postUrl,
                text: fullText.slice(0, 500),
                keywords: new Set(keywords),
                branche,
                datum: today,
                verwerkt: false,
              },
              ConditionExpression: 'attribute_not_exists(signalId)',
            }),
          )
          saved++
          totalSaved++
        } catch (err: unknown) {
          // ConditionalCheckFailedException = duplicate, skip silently
          if ((err as { name?: string }).name !== 'ConditionalCheckFailedException') {
            console.error('[signaaldetectie] dynamodb put error | id=%s', id, err)
          }
        }
      }

      console.log('[signaaldetectie] subreddit=%s posts=%d saved=%d', subreddit, posts.length, saved)
    } catch (err) {
      console.error('[signaaldetectie] subreddit error | subreddit=%s', subreddit, err)
    }
  }

  console.log('[signaaldetectie] done | total_saved=%d date=%s', totalSaved, today)
}
