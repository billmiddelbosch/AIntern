#!/usr/bin/env node
// Hard-delete all LinkedIn posts from DynamoDB (LINKEDIN# pk prefix).
// Use before re-importing ghostwriter drafts when content has been replaced.
// Usage: node lambda/scripts/clear-linkedin-posts.mjs [--alias=dev|prod]

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'

const REGION = 'eu-west-2'

const aliasArg = process.argv.find((a) => a.startsWith('--alias='))
const ALIAS = aliasArg ? aliasArg.split('=')[1] : (process.env.AINTERN_ALIAS ?? 'dev')

const ssm = new SSMClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

async function getTableName() {
  const result = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${ALIAS}/dynamodb/table-name` }),
  )
  const name = result.Parameter?.Value
  if (!name) throw new Error(`Table name SSM param not found for alias: ${ALIAS}`)
  return name
}

async function main() {
  const tableName = await getTableName()
  console.log(`[clear] alias=${ALIAS} table=${tableName}`)

  const result = await ddb.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: 'begins_with(pk, :prefix) AND sk = :sk',
      ExpressionAttributeValues: { ':prefix': 'LINKEDIN#', ':sk': 'POST' },
      ProjectionExpression: 'pk, sk, title',
    }),
  )

  const items = result.Items ?? []
  if (items.length === 0) {
    console.log('[clear] No LinkedIn posts found — nothing to delete.')
    return
  }

  console.log(`[clear] Found ${items.length} posts to delete:`)
  for (const item of items) {
    console.log(`  - ${item.pk} "${item.title ?? ''}"`)
    await ddb.send(new DeleteCommand({ TableName: tableName, Key: { pk: item.pk, sk: item.sk } }))
    console.log(`  ✅ Deleted`)
  }

  console.log(`\n[clear] Done: ${items.length} posts deleted.`)
}

main().catch((err) => {
  console.error('[clear] Error:', err.message)
  process.exit(1)
})
