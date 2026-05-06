/**
 * One-time migration: set GSI1pk = 'STATUS#enriched' on all existing lead items
 * that have status = 'enriched' but are missing the GSI1pk attribute.
 *
 * Build & run:
 *   cd lambda
 *   npx esbuild src/migrate-enriched-gsi1pk.ts --bundle --platform=node --target=node22 --outfile=dist/migrate-enriched-gsi1pk.js
 *   node dist/migrate-enriched-gsi1pk.js [dev|prod]
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const alias = process.argv[2] ?? 'dev'
const region = 'eu-west-2'

const ssm = new SSMClient({ region })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region }))

async function getTableName(): Promise<string> {
  const res = await ssm.send(
    new GetParameterCommand({ Name: `/aintern/${alias}/dynamodb/table-name` }),
  )
  const name = res.Parameter?.Value
  if (!name) throw new Error(`Table name SSM param not found for alias=${alias}`)
  return name
}

async function main() {
  const tableName = await getTableName()
  console.log(`[migrate] alias=${alias} table=${tableName}`)

  let scanned = 0
  let updated = 0
  let skipped = 0
  let lastKey: Record<string, unknown> | undefined

  do {
    const res = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression:
          '#status = :enriched AND attribute_not_exists(GSI1sk)',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':enriched': 'enriched',
        },
        ExclusiveStartKey: lastKey,
      }),
    )

    const items = res.Items ?? []
    scanned += items.length
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined

    for (const item of items) {
      const pk = item['pk'] as string
      const sk = item['sk'] as string

      if (!pk || !sk) { skipped++; continue }

      try {
        const gsi1sk = (item['updatedAt'] ?? item['createdAt'] ?? new Date().toISOString()) as string
        await ddb.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { pk, sk },
            UpdateExpression: 'SET GSI1pk = :gsi1pk, GSI1sk = :gsi1sk',
            ExpressionAttributeValues: { ':gsi1pk': 'STATUS#enriched', ':gsi1sk': gsi1sk },
          }),
        )
        updated++
        console.log(`[migrate] updated pk=${pk}`)
      } catch (err: unknown) {
        if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
          skipped++
        } else {
          console.error(`[migrate] failed pk=${pk}`, err)
        }
      }
    }

    console.log(
      `[migrate] progress: scanned=${scanned} updated=${updated} skipped=${skipped} hasMore=${!!lastKey}`,
    )
  } while (lastKey)

  console.log(`[migrate] done | scanned=${scanned} updated=${updated} skipped=${skipped}`)
}

main().catch(err => {
  console.error('[migrate] fatal', err)
  process.exit(1)
})
