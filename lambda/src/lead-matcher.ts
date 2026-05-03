import type { Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

let cachedTableName: string | null = null
let cachedApolloKey: string | null = null

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const res = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${alias}/dynamodb/table-name` }),
  )
  cachedTableName = res.Parameter?.Value ?? 'aintern-admin'
  return cachedTableName
}

async function getApolloKey(alias: string): Promise<string> {
  if (cachedApolloKey) return cachedApolloKey
  const res = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${alias}/apollo/api-key`, WithDecryption: true }),
  )
  const key = res.Parameter?.Value ?? ''
  if (!key) throw new Error('[getApolloKey] SSM parameter missing or empty')
  cachedApolloKey = key
  return cachedApolloKey
}

interface LeadItem {
  pk: string
  sk: string
  website: string
}

interface ApolloResponse {
  person?: { email?: string }
}

function stripDomain(website: string): string {
  return website.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export async function handler(_event: unknown, context: Context): Promise<void> {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const tableName = await getTableName(alias)
  const apolloKey = await getApolloKey(alias)
  const now = new Date().toISOString()

  const scanRes = await ddb.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression:
        '#status = :new AND attribute_not_exists(email) AND attribute_exists(website)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':new': 'new' },
      Limit: 20,
    }),
  )

  const leads = (scanRes.Items ?? []) as LeadItem[]
  console.log('[lead-matcher] leads to enrich=%d', leads.length)

  let enriched = 0
  let notFound = 0

  for (const lead of leads) {
    const domain = stripDomain(lead.website)

    let apolloRes: ApolloResponse
    try {
      const res = await fetch('https://api.apollo.io/v1/people/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apolloKey },
        body: JSON.stringify({ domain, reveal_personal_emails: false }),
      })
      apolloRes = (await res.json()) as ApolloResponse
    } catch (err) {
      console.error('[lead-matcher] apollo fetch failed | lead=%s domain=%s', lead.pk, domain, err)
      continue
    }

    const email = apolloRes.person?.email
    if (!email) {
      console.log('[lead-matcher] no email found | lead=%s domain=%s', lead.pk, domain)
      try {
        await ddb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { pk: lead.pk, sk: lead.sk },
            UpdateExpression: 'SET #status = :notFound, updatedAt = :ts',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':notFound': 'not_found', ':ts': now },
          }),
        )
      } catch (err) {
        console.error('[lead-matcher] status update failed | lead=%s', lead.pk, err)
      }
      notFound++
      continue
    }

    try {
      await ddb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk: lead.pk, sk: lead.sk },
          UpdateExpression: 'SET email = :email, #status = :enriched, updatedAt = :ts',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':email': email,
            ':enriched': 'enriched',
            ':ts': now,
          },
        }),
      )
      console.log('[lead-matcher] enriched | lead=%s email=%s', lead.pk, email)
      enriched++
    } catch (err) {
      console.error('[lead-matcher] update failed | lead=%s', lead.pk, err)
    }
  }

  console.log('[lead-matcher] done | enriched=%d notFound=%d', enriched, notFound)
}
