#!/usr/bin/env node
// Delete all LINKEDIN# POST items that do NOT have status="approved".
// Run when Human Board has approved specific episodes and all drafts/archived must be cleaned up.
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'

const REGION = 'eu-west-2'
const ssm = new SSMClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const { Parameter } = await ssm.send(new GetParameterCommand({ Name: '/aintern/dev/dynamodb/table-name' }))
const table = Parameter.Value

const result = await ddb.send(new ScanCommand({
  TableName: table,
  FilterExpression: 'begins_with(pk, :prefix) AND sk = :sk AND #s <> :approved',
  ExpressionAttributeValues: { ':prefix': 'LINKEDIN#', ':sk': 'POST', ':approved': 'approved' },
  ExpressionAttributeNames: { '#s': 'status' },
}))

console.log(`[delete-non-approved] Found ${result.Items?.length ?? 0} non-approved entries`)
for (const item of result.Items ?? []) {
  await ddb.send(new DeleteCommand({ TableName: table, Key: { pk: item.pk, sk: item.sk } }))
  console.log(`[delete-non-approved] ✅ Deleted ep.${item.episode} status="${item.status}" — "${item.title}"`)
}
console.log('[delete-non-approved] Done — approved episodes preserved')
