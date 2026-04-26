import type { Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

const ssm = new SSMClient({ region: 'eu-west-2' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'eu-west-2' }))

let cachedTableName: string | null = null

async function getTableName(alias: string): Promise<string> {
  if (cachedTableName) return cachedTableName
  const res = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${alias}/dynamodb/table-name` }),
  )
  cachedTableName = res.Parameter?.Value ?? 'aintern-admin'
  return cachedTableName
}

// Step intervals in days
const STEP_INTERVALS = [0, 5, 12, 19] as const

function nextSendAt(currentStep: number): string {
  const interval = STEP_INTERVALS[currentStep] ?? 5
  const d = new Date()
  d.setDate(d.getDate() + interval)
  return d.toISOString()
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

export async function handler(_event: unknown, context: Context): Promise<void> {
  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const tableName = await getTableName(alias)

  const now = new Date().toISOString()

  // Query active sequences where nextSendAt <= now
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

  let sent = 0

  for (const entry of entries) {
    // Safety limit: max 10 per run to avoid Gmail spam risk
    if (sent >= 10) break

    try {
      const isLastStep = entry.currentStep >= 4
      const nextStep = entry.currentStep + 1

      if (isLastStep) {
        // Mark completed
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
        // Advance to next step
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
        console.log('[sequence-scheduler] step advanced | id=%s step=%d->%d nextSend=%s', entry.id, entry.currentStep, nextStep, nextSend)
      }

      sent++
    } catch (err) {
      console.error('[sequence-scheduler] error | id=%s', entry.id, err)
    }
  }

  console.log('[sequence-scheduler] done | processed=%d', sent)
}
