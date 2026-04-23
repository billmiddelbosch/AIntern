#!/usr/bin/env node
// Fetch the latest published/draft episode of "Het AI-Duo Experiment" from DynamoDB.
// Prints the episode content to stdout so the ghostwriter can read it before writing the next post.
// Usage: node lambda/scripts/get-latest-episode.mjs [--alias=dev|prod]

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
      ':serie': 'Het AI-Duo Experiment',
    },
  }),
)

const items = result.Items ?? []
if (items.length === 0) {
  console.log('[get-latest-episode] No episodes found.')
  process.exit(0)
}

// Sort by episode number descending, take the latest
const latest = items.sort((a, b) => (b.episode ?? 0) - (a.episode ?? 0))[0]

console.log(`[get-latest-episode] Latest episode: #${latest.episode} — "${latest.title}"`)
console.log(`[get-latest-episode] Status: ${latest.status}`)
console.log(`[get-latest-episode] Scheduled: ${latest.scheduledFor ?? 'not set'}`)
console.log(`[get-latest-episode] Updated: ${latest.updatedAt}`)
console.log(`\n--- CONTENT (as it exists in DynamoDB, including any human edits) ---\n`)
console.log(latest.content)
console.log(`\n--- END CONTENT ---`)
