#!/usr/bin/env node
// Fetch all episodes of "Het AI-Duo Experiment" from DynamoDB sorted by episode number.
// Usage: node lambda/scripts/get-all-episodes.mjs [--alias=dev|prod]

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

const aliasArg = process.argv.find((a) => a.startsWith('--alias='))
const ALIAS = aliasArg ? aliasArg.split('=')[1] : (process.env.AINTERN_ALIAS ?? 'dev')
const REGION = 'eu-west-2'

const ssm = new SSMClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

const { Parameter } = await ssm.send(
  new GetParameterCommand({ Name: `/aintern/${ALIAS}/dynamodb/table-name` }),
)
const table = Parameter.Value

const result = await ddb.send(
  new ScanCommand({
    TableName: table,
    FilterExpression: 'begins_with(pk, :prefix) AND sk = :sk AND serie = :serie',
    ExpressionAttributeValues: {
      ':prefix': 'LINKEDIN#',
      ':sk': 'POST',
      ':serie': 'AIntern Experiment',
    },
  }),
)

const items = (result.Items ?? []).sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0))
if (items.length === 0) {
  console.log('[get-all-episodes] No episodes found.')
  process.exit(0)
}

for (const ep of items) {
  console.log(`\n=== Episode #${ep.episode} — "${ep.title}" ===`)
  console.log(`Status: ${ep.status} | Scheduled: ${ep.scheduledFor ?? 'not set'} | Updated: ${ep.updatedAt}`)
  console.log(`\n--- CONTENT ---\n`)
  console.log(ep.content)
  console.log(`\n--- END EPISODE #${ep.episode} ---`)
}
