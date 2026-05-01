import type { Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb'
import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))
const ses = new SESClient({ region: 'eu-west-2' })

let cachedTableName: string | null = null
let cachedAnthropicKey: string | null = null

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const res = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${alias}/dynamodb/table-name` }),
  )
  cachedTableName = res.Parameter?.Value ?? 'aintern-admin'
  return cachedTableName
}

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

// Step intervals in days
const STEP_INTERVALS = [0, 5, 12, 19] as const

function nextSendAt(currentStep: number): string {
  const interval = STEP_INTERVALS[currentStep] ?? 5
  const d = new Date()
  d.setDate(d.getDate() + interval)
  return d.toISOString()
}

// Returns the next workday 09:00 CET as ISO string.
// Mon-Thu → tomorrow, Fri/Sat/Sun → next Monday.
function nextWorkday0900CET(): string {
  // CET = UTC+1, CEST = UTC+2. Use +1 as a conservative base.
  const nowUtc = new Date()
  // Determine day of week in CET (UTC+1)
  const cetOffset = 60 // minutes
  const cetNow = new Date(nowUtc.getTime() + cetOffset * 60 * 1000)
  const dayOfWeek = cetNow.getUTCDay() // 0=Sun,1=Mon,...,5=Fri,6=Sat

  // Days to add to get to next workday
  let daysToAdd: number
  if (dayOfWeek === 5) daysToAdd = 3      // Fri → Mon
  else if (dayOfWeek === 6) daysToAdd = 2 // Sat → Mon
  else if (dayOfWeek === 0) daysToAdd = 1 // Sun → Mon
  else daysToAdd = 1                       // Mon-Thu → tomorrow

  // Build target date at 09:00 CET (08:00 UTC)
  const target = new Date(nowUtc)
  target.setUTCDate(target.getUTCDate() + daysToAdd)
  target.setUTCHours(8, 0, 0, 0) // 08:00 UTC = 09:00 CET
  return target.toISOString()
}

const CTA_TEXTS: Record<string, string> = {
  A: 'Doe de gratis AI Workflow Scan op aintern.nl/workflow-scan — 5 minuten, direct resultaat',
  B: 'Plan een gratis 20-minuten gesprek via aintern.nl',
  C: 'Bekijk hoe vergelijkbare bedrijven dit aanpakten op aintern.nl/kennisbank',
}

interface LeadItem {
  pk: string
  sk: string
  id?: string
  email?: string
  company?: string
  website?: string
  status?: string
  emailSequenceCreatedAt?: string
}

interface SequenceItem {
  pk: string
  sk: string
  id: string
  email: string
  company?: string
  contactName?: string
  opportunityId: string
  variant: string
  currentStep: number
  nextSendAt: string
  status: string
}

interface EmailSequenceItem {
  pk: string
  sk: string
  type: string
  leadId: string
  email: string
  company?: string
  emailSubject: string
  emailBody: string
  ctaVariant: string
  status: string
  sendAt: string
  createdAt: string
  GSI1pk: string
  GSI1sk: string
  sentAt?: string
  sendError?: string
}

interface GeneratedEmail {
  subject: string
  body: string
}

export async function handler(_event: unknown, context: Context): Promise<void> {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const tableName = await getTableName(alias)
  const now = new Date().toISOString()

  // ── Part 1: Create email sequences for enriched leads ──────────────────────

  const scanRes = await ddb.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: '#status = :enriched AND attribute_exists(email) AND email <> :empty',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':enriched': 'enriched',
        ':empty': '',
      },
      Limit: 30,
    }),
  )

  const enrichedLeads = (scanRes.Items ?? []) as LeadItem[]
  console.log('[sequence-scheduler] enriched leads found=%d', enrichedLeads.length)

  let anthropic: Anthropic | null = null

  for (let i = 0; i < enrichedLeads.length; i++) {
    const lead = enrichedLeads[i]

    // Skip if already has an email sequence
    if (lead.emailSequenceCreatedAt) continue

    // Lazy-init Anthropic client
    if (!anthropic) {
      const apiKey = await getAnthropicKey(alias)
      anthropic = new Anthropic({ apiKey })
    }

    const ctaVariantKey = ['A', 'B', 'C'][Math.floor(i / 10) % 3] as 'A' | 'B' | 'C'
    const ctaText = CTA_TEXTS[ctaVariantKey]
    const companyLabel = lead.company ?? lead.website ?? 'jouw bedrijf'

    let generated: GeneratedEmail | null = null
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: 'Schrijf een professionele maar persoonlijke koude e-mail in het Nederlands namens Sanne van AIntern.\nJe bent Sanne, CMO van AIntern — AI-marketing en automatisering voor het MKB.\nToon: warm, direct, resultaatgericht. Geen buzzwords, geen AI-hype. Maximaal 150 woorden body.\n\nBedrijf: ' + companyLabel + '\nPijn: MKB-ondernemers verliezen uren aan handmatig repetitief werk dat AI kan automatiseren.\nCTA: ' + ctaText + '\n\nRetourneer ONLY valid JSON: { "subject": "...", "body": "..." }',
          },
        ],
      })

      const raw = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
      // Strip potential markdown code fences
      const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      generated = JSON.parse(jsonStr) as GeneratedEmail
    } catch (err) {
      console.error('[sequence-scheduler] email generation failed | lead=%s', lead.pk, err)
      continue
    }

    const leadId = lead.pk
    const sendAt = nextWorkday0900CET()
    const sequencePk = `SEQUENCE#${randomUUID()}`

    try {
      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            pk: sequencePk,
            sk: 'ENTRY',
            type: 'email',
            leadId,
            email: lead.email,
            company: lead.company,
            emailSubject: generated.subject,
            emailBody: generated.body,
            ctaVariant: ctaVariantKey,
            status: 'scheduled',
            sendAt,
            createdAt: now,
            GSI1pk: 'STATUS#email_scheduled',
            GSI1sk: sendAt,
          } satisfies EmailSequenceItem,
        }),
      )

      await ddb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk: lead.pk, sk: lead.sk },
          UpdateExpression: 'SET emailSequenceCreatedAt = :ts',
          ExpressionAttributeValues: { ':ts': now },
        }),
      )

      console.log(
        '[sequence-scheduler] email sequence created | lead=%s variant=%s sendAt=%s',
        leadId,
        ctaVariantKey,
        sendAt,
      )
    } catch (err) {
      console.error('[sequence-scheduler] failed to write sequence entry | lead=%s', lead.pk, err)
    }
  }

  // ── Part 2: Send scheduled emails that are due ─────────────────────────────

  const dueRes = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk AND GSI1sk <= :now',
      ExpressionAttributeValues: {
        ':gsi1pk': 'STATUS#email_scheduled',
        ':now': now,
      },
      Limit: 10,
    }),
  )

  const dueItems = (dueRes.Items ?? []) as EmailSequenceItem[]
  console.log('[sequence-scheduler] due email items=%d', dueItems.length)

  let sent = 0

  for (const item of dueItems) {
    if (sent >= 10) break

    try {
      await ses.send(
        new SendEmailCommand({
          Destination: { ToAddresses: [item.email] },
          Message: {
            Subject: { Data: item.emailSubject, Charset: 'UTF-8' },
            Body: { Html: { Data: item.emailBody, Charset: 'UTF-8' } },
          },
          Source: 'Sanne van AIntern <sanne@aintern.nl>',
        }),
      )

      await ddb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk: item.pk, sk: item.sk },
          UpdateExpression: 'SET #status = :sent, sentAt = :ts, GSI1pk = :done',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':sent': 'sent',
            ':ts': now,
            ':done': 'STATUS#email_sent',
          },
        }),
      )
      console.log('[sequence-scheduler] email sent | pk=%s to=%s', item.pk, item.email)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      await ddb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk: item.pk, sk: item.sk },
          UpdateExpression: 'SET #status = :failed, sendError = :err',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':failed': 'send_failed',
            ':err': errMsg,
          },
        }),
      )
      console.error('[sequence-scheduler] email send exception | pk=%s', item.pk, err)
    }

    sent++
  }

  // ── Part 3: Advance existing active sequences ──────────────────────────────

  const res = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk AND GSI1sk <= :now',
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': 'STATUS#active',
        ':now': now,
        ':prefix': 'SEQUENCE#',
      },
    }),
  )

  const entries = (res.Items ?? []) as SequenceItem[]
  console.log('[sequence-scheduler] due entries=%d', entries.length)

  for (const entry of entries) {
    if (sent >= 10) break

    try {
      const isLastStep = entry.currentStep >= 4
      const nextStep = entry.currentStep + 1

      if (isLastStep) {
        await ddb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { pk: entry.pk, sk: entry.sk },
            UpdateExpression: 'SET #status = :completed, GSI1pk = :done_gsi',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':completed': 'completed',
              ':done_gsi': 'STATUS#completed',
            },
          }),
        )
        console.log('[sequence-scheduler] sequence completed | id=%s', entry.id)
      } else {
        const nextSend = nextSendAt(nextStep - 1)
        await ddb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { pk: entry.pk, sk: entry.sk },
            UpdateExpression: 'SET currentStep = :step, nextSendAt = :next, GSI1sk = :gsi1sk',
            ExpressionAttributeValues: {
              ':step': nextStep,
              ':next': nextSend,
              ':gsi1sk': nextSend,
            },
          }),
        )
        console.log(
          '[sequence-scheduler] step advanced | id=%s step=%d->%d nextSend=%s',
          entry.id,
          entry.currentStep,
          nextStep,
          nextSend,
        )
      }

      sent++
    } catch (err) {
      console.error('[sequence-scheduler] error | id=%s', entry.id, err)
    }
  }

  console.log('[sequence-scheduler] done | processed=%d', sent)
}
