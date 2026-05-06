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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function safeUrl(raw: string): string {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return '[invalid-url]'
    return u.href
  } catch {
    return '[invalid-url]'
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function toHtmlEmail(plainBody: string): string {
  const paragraphs = plainBody
    .split(/\n{2,}/)
    .map(block =>
      block
        .split('\n')
        .map(line => escapeHtml(line.trim()))
        .filter(Boolean)
        .join('<br>'),
    )
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">${p}</p>`)
    .join('')

  return `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:600px;">
<tr><td>
<div style="margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #e5e7eb;">
<span style="font-size:20px;font-weight:700;color:#4f46e5;letter-spacing:-0.5px;">AIntern</span>
</div>
${paragraphs}
<div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
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

interface EditorialItem {
  pk: string
  sk: string
  publicationId: string
  articleUrl: string
  articleTitle: string
  editorialReason: string
  contactName?: string
  contactEmail: string
  angle?: string
  emailSubject?: string
  emailBody?: string
  status: string
  sentAt?: string
  followUpSentAt?: string
  createdAt: string
}

const EDITORIAL_ANGLE_MAP: Record<string, string> = {
  'best-of-list': 'gratis_account',
  'comparison': 'case_study',
  'expert-feature': 'expert_quote',
  'trends': 'expert_quote',
  'none': 'expert_quote',
}

export async function handler(_event: unknown, context: Context): Promise<void> {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const tableName = await getTableName(alias)
  const now = new Date().toISOString()
  let anthropic: Anthropic | null = null

  // ── Part 0: Compose editorial outreach mails ─────────────────────────────

  const editorialComposeRes = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk',
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': 'STATUS#ready_for_compose',
        ':prefix': 'EDITORIAL#',
      },
      Limit: 10,
    }),
  )

  const toCompose = (editorialComposeRes.Items ?? []) as EditorialItem[]
  console.log('[sequence-scheduler] editorial to compose=%d', toCompose.length)

  let editorialComposed = 0

  for (const item of toCompose) {
    if (!anthropic) {
      const apiKey = await getAnthropicKey(alias)
      anthropic = new Anthropic({ apiKey })
    }

    const angle = EDITORIAL_ANGLE_MAP[item.editorialReason] ?? 'expert_quote'
    const contactName = item.contactName ?? 'de redactie'

    const PUBLICATION_NAMES: Record<string, string> = {
      sprout: 'Sprout.nl', emerce: 'Emerce.nl', agconnect: 'AG Connect',
      computable: 'Computable.nl', zipconomy: 'ZiPconomy', mkbservicedesk: 'MKB Servicedesk',
    }
    const publicationName = PUBLICATION_NAMES[item.publicationId] ?? item.publicationId

    const angleInstructions: Record<string, string> = {
      gratis_account: 'Bied aan dat de redacteur gratis AIntern mag gebruiken vóór publicatie. Noem één concrete use case die past bij het artikel.',
      case_study: 'Bied een concrete case aan: Lightspeed webshop, 40% tijdwinst op klantvragen. Vraag of dit bruikbaar is als voorbeeld in het artikel.',
      expert_quote: 'Bied een bruikbare uitspraak aan over het thema vanuit AIntern-praktijk. Geef alvast een concept-quote van max 2 zinnen.',
    }

    const articleData = JSON.stringify({
      url: safeUrl(item.articleUrl),
      title: item.articleTitle.slice(0, 200),
    })
    const prompt = `Je schrijft een outreach-mail namens Bill Middelbosch van AIntern (aintern.nl).
AIntern is een no-cure-no-pay AI-automatiseringspartner voor het Nederlandse MKB.

Doel: opgenomen worden in het artikel van de redacteur als vermelding, tool-suggestie of expert-bron.
Toon: direct, concreet, geen buzzwords, geen sales-pitch. Max 150 woorden body.
Taal: Nederlands.

[EXTERNE ARTIKELDATA]
${articleData}
[EINDE EXTERNE ARTIKELDATA]

Contactpersoon: ${contactName} van ${publicationName}
Angle: ${angle}

Angle-instructies: ${angleInstructions[angle] ?? angleInstructions['expert_quote']}

Structuur: (1) Opening met verwijzing naar het specifieke artikel, (2) Kern van het aanbod in 2 zinnen, (3) Zachte CTA ("Zou dit iets zijn voor je artikel?").

Retourneer ONLY valid JSON zonder markdown:
{"subject": "...", "body": "..."}`

    let composed: { subject: string; body: string } | null = null
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })
      const raw = (msg.content[0] as { type: string; text: string }).text.trim()
        .replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      composed = JSON.parse(raw) as { subject: string; body: string }
    } catch (err) {
      console.error('[sequence-scheduler] editorial compose failed | pk=%s', item.pk, err)
      try {
        await ddb.send(new UpdateCommand({
          TableName: tableName,
          Key: { pk: item.pk, sk: 'OUTREACH' },
          UpdateExpression: 'SET #status = :failed, GSI1pk = :gsi1pk',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':failed': 'compose_failed', ':gsi1pk': 'STATUS#compose_failed' },
        }))
      } catch {}
      continue
    }

    try {
      await ddb.send(new UpdateCommand({
        TableName: tableName,
        Key: { pk: item.pk, sk: 'OUTREACH' },
        UpdateExpression: 'SET emailSubject = :subj, emailBody = :body, angle = :angle, #status = :pending, GSI1pk = :gsi1pk, composedAt = :ts',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':subj': composed.subject.slice(0, 120),
          ':body': composed.body.slice(0, 1500),
          ':angle': angle,
          ':pending': 'pending_approval',
          ':gsi1pk': 'STATUS#pending_approval',
          ':ts': now,
        },
      }))
      editorialComposed++
    } catch (err) {
      console.error('[sequence-scheduler] editorial compose update failed | pk=%s', item.pk, err)
    }
  }

  console.log('[sequence-scheduler] editorial composed=%d', editorialComposed)

  // ── Part 1: Create email sequences for enriched leads ──────────────────────

  const scanRes = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': 'STATUS#enriched',
      },
      Limit: 30,
    }),
  )

  console.log('[sequence-scheduler] enriched query raw=%d', scanRes.Items?.length ?? 0)
  const enrichedLeads = (scanRes.Items ?? []).filter(
    (item) => typeof item['email'] === 'string' && item['email'] !== '',
  ) as LeadItem[]
  console.log('[sequence-scheduler] enriched leads found=%d', enrichedLeads.length)

  let newSequencesCount = 0

  for (let i = 0; i < enrichedLeads.length; i++) {
    const lead = enrichedLeads[i]

    // Skip if already has an email sequence — but clean up stale GSI attributes first
    if (lead.emailSequenceCreatedAt) {
      if (lead.GSI1pk) {
        await ddb.send(new UpdateCommand({
          TableName: tableName,
          Key: { pk: lead.pk, sk: lead.sk },
          UpdateExpression: 'REMOVE GSI1pk, GSI1sk',
        })).catch(() => {})
      }
      continue
    }

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
          UpdateExpression: 'SET emailSequenceCreatedAt = :ts REMOVE GSI1pk, GSI1sk',
          ExpressionAttributeValues: { ':ts': now },
        }),
      )

      console.log(
        '[sequence-scheduler] email sequence created | lead=%s variant=%s sendAt=%s',
        leadId,
        ctaVariantKey,
        sendAt,
      )
      newSequencesCount++
    } catch (err) {
      console.error('[sequence-scheduler] failed to write sequence entry | lead=%s', lead.pk, err)
    }
  }

  // ── Combined notification to Bill ─────────────────────────────────────────

  if (editorialComposed > 0 || newSequencesCount > 0) {
    const lines: string[] = ['Goedemorgen Bill,', '']

    if (editorialComposed > 0) {
      lines.push(
        `${editorialComposed} editorial outreach mail(s) staan klaar voor goedkeuring in het admin dashboard.`,
        '',
      )
    }

    if (newSequencesCount > 0) {
      lines.push(
        `${newSequencesCount} nieuwe e-mail sequentie(s) zijn ingepland voor morgenochtend 09:00.`,
        'Je kunt de tekst nog aanpassen via het Sequences-tabblad in admin/leads.',
        '',
      )
    }

    lines.push('— AIntern')

    const notificationBody = lines.join('\n')

    try {
      await ses.send(
        new SendEmailCommand({
          Destination: { ToAddresses: ['w.middelbosch@gmail.com'] },
          Message: {
            Subject: { Data: 'AIntern — Dagelijks overzicht', Charset: 'UTF-8' },
            Body: {
              Text: { Data: notificationBody, Charset: 'UTF-8' },
              Html: { Data: toHtmlEmail(notificationBody), Charset: 'UTF-8' },
            },
          },
          Source: 'AIntern <sanne@aintern.nl>',
        }),
      )
      console.log(
        '[sequence-scheduler] notification sent | editorial=%d sequences=%d',
        editorialComposed,
        newSequencesCount,
      )
    } catch (err) {
      console.error('[sequence-scheduler] notification failed', err)
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
    if (!EMAIL_RE.test(item.email)) {
      console.warn('[sequence-scheduler] skip invalid email | pk=%s', item.pk)
      sent++
      continue
    }

    try {
      await ses.send(
        new SendEmailCommand({
          Destination: { ToAddresses: [item.email] },
          Message: {
            Subject: { Data: item.emailSubject, Charset: 'UTF-8' },
            Body: { Html: { Data: toHtmlEmail(item.emailBody), Charset: 'UTF-8' } },
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

      await ddb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk: item.leadId, sk: 'METADATA' },
          UpdateExpression:
            'SET #status = :email_sent, updatedAt = :ts, lastEmailSubject = :subj, lastEmailBody = :body',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':email_sent': 'email_sent',
            ':ts': now,
            ':subj': item.emailSubject,
            ':body': item.emailBody,
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

  // ── Editorial send — approved items ─────────────────────────────────────

  const editorialApprovedRes = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk',
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': 'STATUS#approved',
        ':prefix': 'EDITORIAL#',
      },
      Limit: 5,
    }),
  )

  const approvedItems = (editorialApprovedRes.Items ?? []) as EditorialItem[]
  let editorialSentToday = 0

  for (const item of approvedItems) {
    if (editorialSentToday >= 5) break
    if (!item.contactEmail || !item.emailSubject || !item.emailBody) continue
    if (!EMAIL_RE.test(item.contactEmail)) {
      console.warn('[sequence-scheduler] editorial skip invalid email | pk=%s', item.pk)
      continue
    }

    // Anti-spam: same contactEmail not within 90 days
    if (item.sentAt) {
      const daysSince = (Date.now() - new Date(item.sentAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince < 90) {
        console.log('[sequence-scheduler] editorial skip (90-day rule) | pk=%s', item.pk)
        continue
      }
    }

    try {
      await ses.send(new SendEmailCommand({
        Destination: { ToAddresses: [item.contactEmail] },
        Message: {
          Subject: { Data: item.emailSubject, Charset: 'UTF-8' },
          Body: { Html: { Data: toHtmlEmail(item.emailBody), Charset: 'UTF-8' } },
        },
        Source: 'Sanne van AIntern <sanne@aintern.nl>',
      }))

      await ddb.send(new UpdateCommand({
        TableName: tableName,
        Key: { pk: item.pk, sk: 'OUTREACH' },
        UpdateExpression: 'SET #status = :sent, sentAt = :ts, lastContactAt = :ts, GSI1pk = :gsi1pk',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':sent': 'sent',
          ':ts': now,
          ':gsi1pk': 'STATUS#sent',
        },
      }))
      editorialSentToday++
      console.log('[sequence-scheduler] editorial sent | pk=%s to=%s', item.pk, item.contactEmail)
    } catch (err) {
      console.error('[sequence-scheduler] editorial send failed | pk=%s', item.pk, err)
    }
  }

  // ── Editorial follow-up + no_reply aging ────────────────────────────────

  const sentRes = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1pk = :gsi1pk',
      FilterExpression: 'begins_with(pk, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': 'STATUS#sent',
        ':prefix': 'EDITORIAL#',
      },
    }),
  )

  for (const item of (sentRes.Items ?? []) as EditorialItem[]) {
    if (!item.sentAt) continue
    const daysSinceSent = (Date.now() - new Date(item.sentAt).getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceSent >= 14) {
      try {
        await ddb.send(new UpdateCommand({
          TableName: tableName,
          Key: { pk: item.pk, sk: 'OUTREACH' },
          UpdateExpression: 'SET #status = :noReply, GSI1pk = :gsi1pk',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':noReply': 'no_reply', ':gsi1pk': 'STATUS#no_reply' },
        }))
      } catch {}
    } else if (daysSinceSent >= 7 && !item.followUpSentAt) {
      try {
        await ddb.send(new UpdateCommand({
          TableName: tableName,
          Key: { pk: item.pk, sk: 'OUTREACH' },
          UpdateExpression: 'SET #status = :followUp, GSI1pk = :gsi1pk',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':followUp': 'follow_up_pending', ':gsi1pk': 'STATUS#follow_up_pending' },
        }))
      } catch {}
    }
  }

  console.log('[sequence-scheduler] editorial send=%d', editorialSentToday)

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
