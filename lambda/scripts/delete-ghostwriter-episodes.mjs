#!/usr/bin/env node
// One-shot script: delete all "Het AI-Duo Experiment" episodes from DynamoDB.
// Run before re-importing when episode content has been rewritten.
// Usage: node lambda/scripts/delete-ghostwriter-episodes.mjs [--alias=dev|prod]

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'

const aliasArg = process.argv.find((a) => a.startsWith('--alias='))
const ALIAS = aliasArg ? aliasArg.split('=')[1] : (process.env.AINTERN_ALIAS ?? 'dev')
const REGION = 'eu-west-2'

const ssm = new SSMClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

const { Parameter } = await ssm.send(
  new GetParameterCommand({ Name: `/aintern/${ALIAS}/dynamodb/table-name` }),
)
const table = Parameter.Value
console.log(`[delete] alias=${ALIAS} table=${table}`)

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

console.log(`[delete] Found ${result.Items?.length ?? 0} episodes`)
for (const item of result.Items ?? []) {
  await ddb.send(new DeleteCommand({ TableName: table, Key: { pk: item.pk, sk: item.sk } }))
  console.log(`[delete] ✅ Deleted ep.${item.episode} — "${item.title}"`)
}
console.log('[delete] Done')
