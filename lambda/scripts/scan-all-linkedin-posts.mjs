#!/usr/bin/env node
// Scan all LINKEDIN# POST items and show episode, status, serie, title
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb'

const REGION = 'eu-west-2'
const ssm = new SSMClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const { Parameter } = await ssm.send(new GetParameterCommand({ Name: '/aintern/dev/dynamodb/table-name' }))
const table = Parameter.Value

const result = await ddb.send(new ScanCommand({
  TableName: table,
  FilterExpression: 'begins_with(pk, :prefix) AND sk = :sk',
  ExpressionAttributeValues: { ':prefix': 'LINKEDIN#', ':sk': 'POST' },
  ProjectionExpression: 'pk, episode, title, #s, serie',
  ExpressionAttributeNames: { '#s': 'status' },
}))

for (const item of (result.Items ?? []).sort((a,b) => (a.episode??0)-(b.episode??0))) {
  console.log(`ep.${item.episode} | status="${item.status}" | serie="${item.serie}" | ${item.title}`)
}
